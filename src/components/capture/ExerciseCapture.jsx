import { useEffect, useRef, useState } from 'react'
import { getPoseLandmarker } from '../lib/poseLandmarker'
import { EXERCISES } from '../lib/exercises'
import { CONNECTIONS, JOINTS, LEFT_HIP, RIGHT_HIP } from '../lib/landmarks'
import { pickSide, computeAngleDef } from '../lib/angles'
import Button from './ui/Button'
import Field from './ui/Field'
import Card from './ui/Card'
import Alert from './ui/Alert'

// Assigned to exercise.angles by index, so "Knee angle" is always the same
// color on the video overlay and in the live readout list beside it.
const ANGLE_COLORS = ['#2a78d6', '#16a34a', '#d97706', '#7c3aed']
const REFERENCE_LINE_COLOR = '#dc2626'

function drawSkeleton(ctx, landmarks, width, height, opacity = 1) {
  ctx.globalAlpha = opacity
  ctx.strokeStyle = '#d6d3d1'
  ctx.lineWidth = 2
  for (const [a, b] of CONNECTIONS) {
    const p1 = landmarks[a]
    const p2 = landmarks[b]
    if (!p1 || !p2) continue
    ctx.beginPath()
    ctx.moveTo(p1.x * width, p1.y * height)
    ctx.lineTo(p2.x * width, p2.y * height)
    ctx.stroke()
  }

  for (const idx of JOINTS) {
    const p = landmarks[idx]
    if (!p) continue
    ctx.beginPath()
    ctx.arc(p.x * width, p.y * height, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#a8a29e'
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// Highlights the specific joints/segments behind each tracked angle, in the
// same color as its live readout — so what's on screen visibly matches what
// the numbers describe, the way the coach would point at a joint on video.
function drawAngleOverlay(ctx, landmarks, side, angles, width, height) {
  angles.forEach((def, i) => {
    const pts = side === 'right' ? def.right : def.left
    const color = ANGLE_COLORS[i % ANGLE_COLORS.length]

    ctx.strokeStyle = color
    ctx.lineWidth = 3
    for (let j = 0; j < pts.length - 1; j++) {
      const p1 = landmarks[pts[j]]
      const p2 = landmarks[pts[j + 1]]
      if (!p1 || !p2) continue
      ctx.beginPath()
      ctx.moveTo(p1.x * width, p1.y * height)
      ctx.lineTo(p2.x * width, p2.y * height)
      ctx.stroke()
    }

    const vertex = landmarks[pts[1]]
    if (vertex) {
      ctx.beginPath()
      ctx.arc(vertex.x * width, vertex.y * height, 6, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    }
  })
}

// A separate, visually distinct line across the frame for whatever
// alignment the coach is actually checking (e.g. torso staying over the
// base) — not one of the tracked angles itself, just a reference to eyeball.
function drawReferenceLine(ctx, landmarks, side, referenceLine, width, height) {
  if (!referenceLine) return
  const pts = side === 'right' ? referenceLine.right : referenceLine.left
  const p1 = landmarks[pts[0]]
  const p2 = landmarks[pts[1]]
  if (!p1 || !p2) return

  ctx.save()
  ctx.strokeStyle = REFERENCE_LINE_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash([7, 5])
  ctx.beginPath()
  ctx.moveTo(p1.x * width, p1.y * height)
  ctx.lineTo(p2.x * width, p2.y * height)
  ctx.stroke()
  ctx.restore()
}

function formatMeasurementValue(value) {
  return `${Math.round(value)}°`
}

function average(samples) {
  return samples.reduce((sum, s) => sum + s.value, 0) / samples.length
}

// Builds the notes string saved alongside a metric: a plain factual record
// of what every tracked angle read at save time, with the calibrated
// baseline noted where one was captured. No verdict language — the trainer
// interprets the numbers themselves.
function summarizeMeasurements(exercise, values, baseline) {
  const parts = exercise.angles
    .map((a) => {
      const value = values[a.id]
      if (value == null) return null
      let text = `${a.label} ${formatMeasurementValue(value)}`
      if (exercise.calibration?.checkId === a.id && baseline != null) {
        text += ` (baseline: ${formatMeasurementValue(baseline)})`
      }
      return text
    })
    .filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

const TRACKING_GRACE_MS = 600
const CALIBRATION_WINDOW_MS = 2000
const CALIBRATION_MIN_SAMPLES = 15

export default function ExerciseCapture({ addMetric, onDone }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const extremeRef = useRef(null)
  const stoppedRef = useRef(false)
  const lastGoodRef = useRef({ landmarks: null, time: 0 })
  const phaseRef = useRef('idle')
  const calibrationSamplesRef = useRef([])
  const calibrationRef = useRef(null)

  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id)
  const [phase, setPhase] = useState('idle')
  const [errorMessage, setErrorMessage] = useState(null)
  const [extremeAngle, setExtremeAngle] = useState(null)
  const [saving, setSaving] = useState(false)
  const [personVisible, setPersonVisible] = useState(true)
  const [angleValues, setAngleValues] = useState({})
  const [calibrationValue, setCalibrationValue] = useState(null)

  const exercise = EXERCISES.find((e) => e.id === exerciseId)
  const primaryAngle = exercise.angles.find((a) => a.primary)
  const calibrationAngle = exercise.calibration
    ? exercise.angles.find((a) => a.id === exercise.calibration.checkId)
    : null

  useEffect(() => {
    return () => stopCamera()
  }, [])

  function setPhaseBoth(next) {
    phaseRef.current = next
    setPhase(next)
  }

  function stopCamera() {
    stoppedRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  async function start() {
    setErrorMessage(null)
    setPhaseBoth('loading-model')
    stoppedRef.current = false
    extremeRef.current = null
    lastGoodRef.current = { landmarks: null, time: 0 }
    calibrationSamplesRef.current = []
    calibrationRef.current = null
    setCalibrationValue(null)
    setAngleValues({})
    setPersonVisible(true)

    try {
      const landmarker = await getPoseLandmarker()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      streamRef.current = stream

      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      setPhaseBoth(exercise.calibration ? 'calibrating' : 'ready')
      loop(landmarker)
    } catch (err) {
      setErrorMessage(err.message)
      setPhaseBoth('error')
      stopCamera()
    }
  }

  function confirmCalibration(value) {
    calibrationRef.current = value
    setCalibrationValue(value)
    setPhaseBoth('ready')
  }

  function confirmCalibrationNow() {
    const samples = calibrationSamplesRef.current
    if (samples.length === 0) {
      skipCalibration()
      return
    }
    confirmCalibration(average(samples))
  }

  function skipCalibration() {
    calibrationRef.current = null
    setCalibrationValue(null)
    setPhaseBoth('ready')
  }

  function loop(landmarker) {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    function tick() {
      if (stoppedRef.current || !videoRef.current) return

      const now = performance.now()
      const result = landmarker.detectForVideo(video, now)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const landmarks = result.landmarks?.[0]

      if (landmarks) {
        lastGoodRef.current = { landmarks, time: now }
        setPersonVisible(true)
        drawSkeleton(ctx, landmarks, canvas.width, canvas.height)

        const side = pickSide(landmarks, LEFT_HIP, RIGHT_HIP)
        drawAngleOverlay(ctx, landmarks, side, exercise.angles, canvas.width, canvas.height)
        drawReferenceLine(ctx, landmarks, side, exercise.referenceLine, canvas.width, canvas.height)

        if (phaseRef.current === 'calibrating') {
          if (calibrationAngle) {
            const value = computeAngleDef(landmarks, side, calibrationAngle)
            setAngleValues((prev) => ({ ...prev, [calibrationAngle.id]: value }))
            if (value !== null) {
              const samples = calibrationSamplesRef.current
              samples.push({ value, time: now })
              while (samples.length && now - samples[0].time > CALIBRATION_WINDOW_MS) samples.shift()

              const stable =
                samples.length >= CALIBRATION_MIN_SAMPLES &&
                now - samples[0].time >= CALIBRATION_WINDOW_MS - 100 &&
                Math.max(...samples.map((s) => s.value)) - Math.min(...samples.map((s) => s.value)) <=
                  exercise.calibration.stabilityTolerance
              if (stable) confirmCalibration(average(samples))
            }
          }
        } else {
          const values = {}
          for (const def of exercise.angles) {
            values[def.id] = computeAngleDef(landmarks, side, def)
          }
          setAngleValues(values)

          const primaryValue = values[primaryAngle.id]
          if (primaryValue != null) {
            const isNewExtreme =
              extremeRef.current === null ||
              (exercise.extreme === 'min' ? primaryValue < extremeRef.current : primaryValue > extremeRef.current)
            if (isNewExtreme) {
              extremeRef.current = primaryValue
              setExtremeAngle(Math.round(primaryValue))
            }
          }
        }
      } else if (now - lastGoodRef.current.time < TRACKING_GRACE_MS) {
        drawSkeleton(ctx, lastGoodRef.current.landmarks, canvas.width, canvas.height, 0.4)
      } else {
        setPersonVisible(false)
        setAngleValues({})
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  async function handleSave() {
    if (extremeAngle === null) return
    setSaving(true)
    await addMetric({
      metricName: exercise.metricName,
      value: extremeAngle,
      unit: exercise.unit,
      notes: summarizeMeasurements(exercise, angleValues, calibrationValue),
    })
    setSaving(false)
    reset()
  }

  function reset() {
    stopCamera()
    setPhaseBoth('idle')
    setExtremeAngle(null)
    setAngleValues({})
    setCalibrationValue(null)
  }

  function handleClose() {
    reset()
    onDone?.()
  }

  const extremeWord = exercise.extreme === 'min' ? 'Deepest' : 'Highest'
  const showCamera = phase === 'ready' || phase === 'calibrating'
  const calibrationLiveValue = calibrationAngle ? angleValues[calibrationAngle.id] : null

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Measure via camera</h3>
        <button onClick={handleClose} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
          Close
        </button>
      </div>

      {phase === 'idle' && (
        <div className="space-y-4">
          <Field label="Exercise" id="exercise" as="select" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            {EXERCISES.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </Field>

          <Button onClick={start}>Start camera</Button>
        </div>
      )}

      {phase === 'loading-model' && (
        <p className="text-sm text-stone-500">Loading pose model…</p>
      )}

      {phase === 'error' && (
        <Alert tone="error">Couldn't access the camera: {errorMessage}</Alert>
      )}

      <div className={showCamera ? 'relative w-full max-w-md mx-auto' : 'hidden'}>
        <video ref={videoRef} muted playsInline className="w-full rounded-xl scale-x-[-1]" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1]" />
        {showCamera && !personVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
            <p className="text-white text-sm font-medium text-center px-4">
              Can't see your full body — step back so your head and feet are both in frame
            </p>
          </div>
        )}
        {showCamera && personVisible && phase === 'ready' && (
          <div className="absolute top-2 left-2 rounded-lg bg-black/55 backdrop-blur-sm px-3 py-2 space-y-1">
            {exercise.angles.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 text-xs text-white">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ANGLE_COLORS[i % ANGLE_COLORS.length] }}
                />
                <span className="text-white/70">{a.label}:</span>
                <span className="font-semibold tabular-nums">
                  {angleValues[a.id] != null ? formatMeasurementValue(angleValues[a.id]) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {phase === 'calibrating' && (
        <div className="space-y-3 rounded-xl bg-stone-50 border border-stone-100 p-4">
          <p className="text-sm font-medium text-stone-900">Calibrating: {exercise.label}</p>
          <p className="text-sm text-stone-500">{exercise.calibration.instructions}</p>
          <p className="text-xs text-stone-400">Hold still for a couple of seconds…</p>
          <p className="text-sm text-stone-500">
            Current reading: <span className="font-semibold text-stone-900">
              {calibrationLiveValue != null ? formatMeasurementValue(calibrationLiveValue) : '—'}
            </span>
          </p>
          <div className="flex items-center gap-4">
            <Button size="sm" onClick={confirmCalibrationNow}>
              Use this position now
            </Button>
            <button onClick={skipCalibration} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
              Skip calibration
            </button>
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <div className="space-y-3 rounded-xl bg-stone-50 border border-stone-100 p-4">
          <p className="text-sm font-medium text-stone-900">{exercise.label}</p>

          <div className="space-y-1.5">
            {exercise.angles.map((a, i) => {
              const value = angleValues[a.id]
              const isCalibrated = exercise.calibration?.checkId === a.id && calibrationValue != null
              return (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: ANGLE_COLORS[i % ANGLE_COLORS.length] }}
                  />
                  <span className="text-stone-500">{a.label}:</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {value != null ? formatMeasurementValue(value) : '—'}
                  </span>
                  {a.primary && (
                    <span className="text-xs text-stone-400">(tracked)</span>
                  )}
                  {isCalibrated && (
                    <span className="text-xs text-stone-400">(baseline: {formatMeasurementValue(calibrationValue)})</span>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-sm text-stone-500 pt-1 border-t border-stone-200">
            {extremeWord} {primaryAngle.label.toLowerCase()} so far:{' '}
            <span className="font-semibold text-accent-500">{extremeAngle ?? '—'}°</span>
          </p>

          <p className="text-xs text-stone-400">{exercise.instructions}</p>

          <Button onClick={handleSave} disabled={extremeAngle === null || saving}>
            {saving ? 'Saving…' : `Save ${extremeWord.toLowerCase()} reading`}
          </Button>
        </div>
      )}
    </Card>
  )
}
