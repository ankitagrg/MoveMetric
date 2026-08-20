import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPoseLandmarker } from '../../lib/poseLandmarker'
import { EXERCISES } from '../../lib/exercises'
import { LEFT_HIP, RIGHT_HIP, LEFT_SHOULDER, RIGHT_SHOULDER } from '../../lib/landmarks'
import { pickSide, computeAngleDef } from '../../lib/angles'
import { createRepTracker, formatTempo } from '../../lib/reps'
import {
  computeConsistencyScore,
  computeDepthScore,
  computeInsights,
  computePostureScore,
  computeOverallGrade,
  scoreToGrade,
} from '../../lib/grading'
import { STATUS_WARNING_COLOR, GRADE_GOOD_COLOR, GRADE_POOR_COLOR, gradeColor } from '../../lib/theme'
import {
  ANGLE_COLORS,
  isOutOfRange,
  sideLabel,
  missingLandmarkReason,
  formatMeasurementValue,
  drawSkeleton,
  drawAngleOverlay,
  drawReferenceLine,
} from '../../lib/poseOverlay'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Field from '../ui/Field'
import Card from '../ui/Card'
import Alert from '../ui/Alert'
import WarningIcon from '../ui/WarningIcon'
import SegmentedControl from '../ui/SegmentedControl'
import CaptureResults from './CaptureResults'

// One row of the live sidebar readout: a color-matched dot + label on the
// left, the reading (or why it's unavailable) right-aligned — the same
// per-side, per-angle data the video overlay draws, just laid out for a
// panel next to the camera instead of stacked text burned onto the frame.
function AngleRow({ color, label, value, flagged, reason, tags }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span className="flex items-center gap-2 min-w-0 pt-0.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-stone-600 truncate">{label}</span>
      </span>
      <span className="text-right shrink-0">
        {value != null ? (
          <span
            className="text-lg font-medium tabular-nums flex items-center justify-end gap-1"
            style={{ color: flagged ? 'var(--color-status-warning)' : 'var(--color-stone-900)' }}
          >
            {flagged && <WarningIcon className="w-3.5 h-3.5" />}
            {formatMeasurementValue(value)}
          </span>
        ) : (
          <span className="inline-block text-xs font-medium text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">
            Not visible
          </span>
        )}
        {value == null && reason && <p className="text-[11px] text-stone-400 mt-0.5">{reason}</p>}
        {flagged && (
          <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--color-status-warning)' }}>
            outside typical range
          </p>
        )}
        {tags?.length > 0 && (
          <span className="flex flex-wrap justify-end gap-1 mt-1">
            {tags.map((t) => (
              <Badge key={t} tone="outline">{t}</Badge>
            ))}
          </span>
        )}
      </span>
    </div>
  )
}

const CAPTURE_STEPS = ['Set up', 'Capture', 'Results']

// idle/loading-model/calibrating/error all happen before a rep has been
// tracked, so they collapse into the same "Set up" step — the indicator
// tracks where the user is in the flow, not the internal phase machine.
function stepIndexForPhase(phase) {
  if (phase === 'ready') return 1
  if (phase === 'results') return 2
  return 0
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center">
      {CAPTURE_STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          {i > 0 && (
            <span className="w-4 sm:w-12 h-0.5 bg-stone-200 mx-1 sm:mx-2 shrink-0 relative overflow-hidden rounded-full">
              <span
                className="absolute inset-0 bg-stone-900 transition-transform duration-500 ease-out origin-left"
                style={{ transform: i <= current ? 'scaleX(1)' : 'scaleX(0)' }}
              />
            </span>
          )}
          <span
            className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-medium shrink-0 transition-all duration-300 ${
              i < current
                ? 'bg-stone-900 text-white'
                : i === current
                  ? 'border-2 border-stone-900 text-stone-900 scale-110'
                  : 'border border-stone-200 text-stone-300'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </span>
          <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${i === current ? 'text-stone-900' : 'text-stone-400'}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

function average(samples) {
  return samples.reduce((sum, s) => sum + s.value, 0) / samples.length
}

// Builds the notes string saved alongside the angle metric: a plain factual
// record of what every tracked angle read near the end of the set, with the
// calibrated baseline noted where one was captured.
function summarizeMeasurements(exercise, values, baseline, trackedSide) {
  const parts = exercise.angles.flatMap((a) => {
    const sides = values[a.id]
    if (!sides) return []
    return ['left', 'right']
      .map((side) => {
        const value = sides[side]
        if (value == null) return null
        let text = `${sideLabel(side, a.label)} ${formatMeasurementValue(value)}`
        if (side === trackedSide && exercise.calibration?.checkId === a.id && baseline != null) {
          text += ` (baseline: ${formatMeasurementValue(baseline)})`
        }
        if (isOutOfRange(a, value)) {
          text += ' — outside typical range'
        }
        return text
      })
      .filter(Boolean)
  })
  return parts.length ? parts.join(' · ') : null
}

const TRACKING_GRACE_MS = 600
const CALIBRATION_WINDOW_MS = 2000
const CALIBRATION_MIN_SAMPLES = 15

// Requested capture dimensions per exercise.orientation (see exercises.js).
// Full-HD along the body's long axis either way — tall for anything
// standing, wide for anything performed lying down — so no exercise gets
// cropped or squeezed into the wrong shape. These are `ideal`, not `exact`,
// so a webcam that can't hit 1920 on either side just degrades to its best
// available resolution instead of failing to start.
const CAPTURE_RESOLUTIONS = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
}

function defaultAspectFor(orientation) {
  const { width, height } = CAPTURE_RESOLUTIONS[orientation] ?? CAPTURE_RESOLUTIONS.portrait
  return width / height
}

export default function ExerciseCapture({ addMetric, onDone, basePath, clientName }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const stoppedRef = useRef(false)
  const lastGoodRef = useRef({ landmarks: null, time: 0 })
  const sideRef = useRef(null)
  const phaseRef = useRef('idle')
  const hudModeRef = useRef('full')
  const calibrationSamplesRef = useRef([])
  const calibrationRef = useRef(null)
  const repTrackerRef = useRef(null)
  const repCountRef = useRef(0)
  const leanSamplesRef = useRef({})
  const exportCanvasRef = useRef(null)
  const recorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id)
  const [phase, setPhase] = useState('idle')
  const [hudMode, setHudMode] = useState('full') // 'full' | 'simple' — see setHudModeBoth
  const [errorMessage, setErrorMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [personVisible, setPersonVisible] = useState(true)
  const [angleValues, setAngleValues] = useState({})
  const [angleUnavailable, setAngleUnavailable] = useState({})
  const [trackedSide, setTrackedSide] = useState(null)
  const [calibrationValue, setCalibrationValue] = useState(null)
  const [reps, setReps] = useState([])
  const [recordingBlob, setRecordingBlob] = useState(null)
  const [recordingUrl, setRecordingUrl] = useState(null)
  // Follows whatever ratio the camera actually delivers — cameras don't
  // always honor the `ideal` request below, so locking the frame to a fixed
  // ratio regardless would crop/zoom hard into whatever the real feed is.
  // Matching the real stream keeps the full frame visible. Seeded from the
  // starting exercise's orientation so the preview box isn't a mismatched
  // shape for the first frame or two before real metadata arrives.
  const [videoAspect, setVideoAspect] = useState(defaultAspectFor(EXERCISES[0].orientation))

  useEffect(() => {
    if (!recordingBlob) return
    const url = URL.createObjectURL(recordingBlob)
    setRecordingUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [recordingBlob])

  const exercise = EXERCISES.find((e) => e.id === exerciseId)
  const primaryAngle = exercise.angles.find((a) => a.primary)
  const postureAngle = exercise.angles.find((a) => a.type === 'lean' && a.postureTolerance != null)
  const calibrationAngle = exercise.calibration
    ? exercise.angles.find((a) => a.id === exercise.calibration.checkId)
    : null

  useEffect(() => {
    return () => stopCamera()
  }, [])

  // Keeps the URL in sync with the current step (Set up / Capture / Results)
  // without ever unmounting this component — the camera stream and refs
  // must survive the Set up → Capture transition, so the route change here
  // is a side effect of `phase`, not the other way around.
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (!basePath) return
    const suffix = phase === 'ready' ? '/live' : phase === 'results' ? '/results' : ''
    const targetPath = `${basePath}${suffix}`
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true })
    }
  }, [phase, basePath, location.pathname, navigate])

  function setPhaseBoth(next) {
    phaseRef.current = next
    setPhase(next)
  }

  // Mirrors phase into a ref for the same reason setPhaseBoth does — tick()
  // is a long-lived closure inside the detection loop, so it reads refs
  // rather than stale state. Toggling mid-capture must not restart the
  // camera/loop, just change what the next frame draws.
  function setHudModeBoth(next) {
    hudModeRef.current = next
    setHudMode(next)
  }

  function stopCamera() {
    stoppedRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  // Records the export canvas (video frame + skeleton/angle overlay, drawn
  // together in `tick`) so the set can be shared as one annotated clip
  // afterward — matching Kinetriq's video-export flow. Best-effort: if the
  // browser doesn't support canvas recording, the download link just never
  // appears rather than blocking the actual measuring flow.
  function startRecording(canvas) {
    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) return

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported?.(type))

    try {
      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recordedChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.start()
      recorderRef.current = recorder
    } catch {
      recorderRef.current = null
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    recorder.onstop = () => {
      setRecordingBlob(new Blob(recordedChunksRef.current, { type: 'video/webm' }))
    }
    recorder.stop()
  }

  async function start() {
    setErrorMessage(null)
    setPhaseBoth('loading-model')
    stoppedRef.current = false
    lastGoodRef.current = { landmarks: null, time: 0 }
    sideRef.current = null
    calibrationSamplesRef.current = []
    calibrationRef.current = null
    repTrackerRef.current = createRepTracker(exercise.extreme)
    repCountRef.current = 0
    leanSamplesRef.current = {}
    recordedChunksRef.current = []
    setReps([])
    setCalibrationValue(null)
    setAngleValues({})
    setAngleUnavailable({})
    setTrackedSide(null)
    setPersonVisible(true)
    setRecordingBlob(null)
    setVideoAspect(defaultAspectFor(exercise.orientation))

    // Loading the pose model and requesting the camera are two genuinely
    // different failure modes (a blocked CDN / no GPU delegate vs. denied
    // camera permission / no camera hardware) — split into separate
    // try/catches so the error shown actually names which one broke,
    // instead of every failure here being mislabeled "couldn't access the
    // camera" even when the camera was never touched.
    let landmarker
    try {
      landmarker = await getPoseLandmarker()
    } catch (err) {
      setErrorMessage(`Couldn't load the pose-tracking model: ${err.message}`)
      setPhaseBoth('error')
      stopCamera()
      return
    }

    try {
      const { width, height } = CAPTURE_RESOLUTIONS[exercise.orientation] ?? CAPTURE_RESOLUTIONS.portrait
      const stream = await navigator.mediaDevices.getUserMedia({
        // Tall for standing exercises, wide for anything performed lying
        // down (see exercise.orientation / CAPTURE_RESOLUTIONS) — a body
        // lying across the frame needs width, not height, to stay fully
        // visible. `ideal` (not exact) so it degrades gracefully on cameras
        // that can't hit these resolutions or this exact shape, instead of
        // failing to start. frameRate keeps pose tracking smooth enough to
        // catch the true bottom/top of a fast rep.
        video: {
          facingMode: 'user',
          width: { ideal: width },
          height: { ideal: height },
          aspectRatio: { ideal: width / height },
          frameRate: { ideal: 30 },
        },
      })
      streamRef.current = stream

      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      if (video.videoWidth && video.videoHeight) {
        setVideoAspect(video.videoWidth / video.videoHeight)
      }

      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = video.videoWidth
      exportCanvas.height = video.videoHeight
      exportCanvasRef.current = exportCanvas
      startRecording(exportCanvas)

      setPhaseBoth(exercise.calibration ? 'calibrating' : 'ready')
      loop(landmarker)
    } catch (err) {
      setErrorMessage(`Couldn't access the camera: ${err.message}`)
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

        const side = pickSide(landmarks, LEFT_HIP, RIGHT_HIP, sideRef.current, LEFT_SHOULDER, RIGHT_SHOULDER)
        sideRef.current = side
        setTrackedSide(side)
        // Full HUD burns every angle's numeric reading + the reference line
        // onto the frame; Simplified keeps just the colored joint tracking
        // so the video (and anything recorded from it) reads cleaner — the
        // exact numbers still live in the sidebar either way.
        const fullHud = hudModeRef.current === 'full'
        drawAngleOverlay(ctx, landmarks, exercise.angles, canvas.width, canvas.height, fullHud)
        if (fullHud) drawReferenceLine(ctx, landmarks, side, exercise.referenceLine, canvas.width, canvas.height)

        // Composite the same overlay onto the (unmirrored) export canvas,
        // burned in over the actual video frame this time, for the
        // downloadable annotated clip.
        const exportCanvas = exportCanvasRef.current
        if (exportCanvas) {
          const exportCtx = exportCanvas.getContext('2d')
          exportCtx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height)
          drawSkeleton(exportCtx, landmarks, exportCanvas.width, exportCanvas.height)
          drawAngleOverlay(exportCtx, landmarks, exercise.angles, exportCanvas.width, exportCanvas.height, fullHud)
          if (fullHud) drawReferenceLine(exportCtx, landmarks, side, exercise.referenceLine, exportCanvas.width, exportCanvas.height)
        }

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
        } else if (phaseRef.current === 'ready') {
          const values = {}
          const unavailable = {}
          for (const def of exercise.angles) {
            const leftValue = computeAngleDef(landmarks, 'left', def)
            const rightValue = computeAngleDef(landmarks, 'right', def)
            values[def.id] = { left: leftValue, right: rightValue }
            unavailable[def.id] = {
              left: leftValue == null ? missingLandmarkReason(landmarks, 'left', def) : null,
              right: rightValue == null ? missingLandmarkReason(landmarks, 'right', def) : null,
            }

            // Rep counting/grading needs one continuous stream, so it stays
            // anchored to the single sticky side (see pickSide) even though
            // the readout above tracks both sides independently — mixing
            // limbs mid-set would corrupt the tempo/consistency numbers.
            const trackedValue = side === 'right' ? rightValue : side === 'left' ? leftValue : null
            if (def.type === 'lean' && trackedValue != null) {
              const samples = leanSamplesRef.current[def.id] ?? (leanSamplesRef.current[def.id] = [])
              samples.push(trackedValue)
            }
          }
          setAngleValues(values)
          setAngleUnavailable(unavailable)

          const primaryValue = side === 'right' ? values[primaryAngle.id].right : side === 'left' ? values[primaryAngle.id].left : null
          repTrackerRef.current?.update(primaryValue, now)
          const currentReps = repTrackerRef.current?.getReps() ?? []
          if (currentReps.length !== repCountRef.current) {
            repCountRef.current = currentReps.length
            setReps([...currentReps])
          }
        }
      } else if (now - lastGoodRef.current.time < TRACKING_GRACE_MS) {
        drawSkeleton(ctx, lastGoodRef.current.landmarks, canvas.width, canvas.height, 0.4)
      } else {
        setPersonVisible(false)
        setAngleValues({})
        setAngleUnavailable({})
        setTrackedSide(null)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  function finishSet() {
    repTrackerRef.current?.finalizeTopPause(performance.now())
    setReps(repTrackerRef.current ? [...repTrackerRef.current.getReps()] : [])
    stopRecording()
    stopCamera()
    setPhaseBoth('results')
  }

  async function handleSave() {
    setSaving(true)

    if (reps.length > 0) {
      // Attached to this metric specifically (not the form-grade one below)
      // since this is the one that always saves whenever there are reps —
      // the grade metric is skipped entirely when overallGrade.score is
      // null (e.g. a single deadlift rep), and the video shouldn't depend
      // on that.
      await addMetric({
        metricName: exercise.metricName,
        value: Math.round(bestExtreme),
        unit: exercise.unit,
        notes: summarizeMeasurements(exercise, angleValues, calibrationValue, trackedSide),
        videoBlob: recordingBlob,
      })

      if (overallGrade.score != null) {
        const breakdown = [
          depthScore != null && `Depth ${scoreToGrade(depthScore)} (${depthScore})`,
          postureScore != null && `${postureAngle.label} ${scoreToGrade(postureScore)} (${postureScore})`,
          consistencyScore != null && `Consistency ${scoreToGrade(consistencyScore)} (${consistencyScore})`,
        ].filter(Boolean)

        await addMetric({
          metricName: `${exercise.label} form grade`,
          value: overallGrade.score,
          unit: 'grade',
          notes: `Overall ${overallGrade.letter} (${overallGrade.score}) · ${breakdown.join(' · ')}`,
        })
      }
    }

    setSaving(false)
    reset()
  }

  function reset() {
    stopCamera()
    setPhaseBoth('idle')
    setAngleValues({})
    setAngleUnavailable({})
    setTrackedSide(null)
    setCalibrationValue(null)
    setReps([])
    repCountRef.current = 0
    leanSamplesRef.current = {}
    exportCanvasRef.current = null
    setRecordingBlob(null)
  }

  function handleClose() {
    reset()
    onDone?.()
  }

  const showCamera = phase === 'ready' || phase === 'calibrating'
  // Includes 'loading-model': start() attaches the stream to videoRef.current
  // as soon as getUserMedia resolves, while phase is still 'loading-model' —
  // the video/canvas below must already be mounted (not just visible) by
  // then, so this only ever toggles a CSS class, never whether the elements
  // exist in the DOM. Conditionally mounting them (e.g. `{x && <video/>}`)
  // makes videoRef.current null during that window and start() throws
  // "Cannot set properties of null (setting 'srcObject')".
  const cameraMounted = phase === 'loading-model' || showCamera
  const calibrationLiveValue = calibrationAngle ? angleValues[calibrationAngle.id] : null
  const setDuration = reps.length > 0 ? reps[reps.length - 1].endTime - reps[0].startTime : 0
  const bestExtreme =
    reps.length === 0
      ? null
      : exercise.extreme === 'min'
        ? Math.min(...reps.map((r) => r.extremeValue))
        : Math.max(...reps.map((r) => r.extremeValue))

  const depthScore = computeDepthScore(primaryAngle, reps)
  const postureScore = postureAngle
    ? computePostureScore(leanSamplesRef.current[postureAngle.id], postureAngle.postureTolerance)
    : null
  const consistencyScore = computeConsistencyScore(reps)
  const overallGrade = computeOverallGrade({ depth: depthScore, posture: postureScore, consistency: consistencyScore })
  const insights = computeInsights({ reps, exercise, consistencyScore, postureScore, postureAngle })

  // Results gets its own standalone screen rather than living inside the
  // "Measure via camera" card the Set up/Capture steps share — the camera
  // is already stopped by this point (see finishSet), so nothing here needs
  // the video/canvas refs to stay mounted, and the /results route this
  // phase already navigates to (see the effect above) should actually feel
  // like a different page, not a different section of the same one.
  if (phase === 'results') {
    return (
      <CaptureResults
        clientName={clientName}
        exercise={exercise}
        reps={reps}
        overallGrade={overallGrade}
        insights={insights}
        depthScore={depthScore}
        postureScore={postureScore}
        postureAngle={postureAngle}
        trackedSide={trackedSide}
        consistencyScore={consistencyScore}
        bestExtreme={bestExtreme}
        setDuration={setDuration}
        recordingUrl={recordingUrl}
        saving={saving}
        onSave={handleSave}
        onDiscard={reset}
        onClose={handleClose}
      />
    )
  }

  return (
    <Card className="p-6 sm:p-9 space-y-6 shadow-[var(--shadow-soft-lg)] rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight truncate">Measure via camera</h3>
          {clientName && <p className="text-sm font-medium text-stone-400 truncate mt-0.5">for {clientName}</p>}
        </div>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="flex items-center justify-center w-9 h-9 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
            <path strokeLinecap="round" d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </div>

      {phase !== 'error' && (
        <StepIndicator current={stepIndexForPhase(phase)} />
      )}

      {phase === 'idle' && (
        <div className="max-w-sm mx-auto space-y-5 animate-fade-up">
          <Field label="Exercise" id="exercise" as="select" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            {EXERCISES.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </Field>

          <div className="flex gap-2.5 rounded-xl bg-stone-50 border border-stone-100 p-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-stone-400 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 11v5.5M12 8v.01" />
            </svg>
            <p className="text-xs text-stone-500 leading-relaxed">
              Set the camera up directly to your side, not at an angle &mdash; angles are
              measured from this camera's 2D view, so a straight side-on frame gives the
              most accurate reading.
              {exercise.orientation === 'landscape' ? (
                <>
                  {' '}This exercise is done lying down, so turn your phone or laptop camera
                  sideways (landscape) and step back &mdash; a tall frame wastes most of its
                  height on a body lying across it.
                </>
              ) : (
                <>
                  {' '}Keep the phone or laptop upright (portrait) and stand back far enough
                  that your head and feet are both fully in frame.
                </>
              )}
            </p>
          </div>

          <Button onClick={start} className="w-full">Start camera</Button>
        </div>
      )}

      {phase === 'loading-model' && (
        <p className="flex items-center gap-2 text-sm text-stone-500 animate-fade-up">
          <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin text-stone-400">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          Loading pose model…
        </p>
      )}

      {phase === 'error' && (
        <Alert tone="error">{errorMessage}</Alert>
      )}

      <div
        className={
          cameraMounted
            ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start animate-fade-up'
            : 'hidden'
        }
      >
        <div className="space-y-2.5 w-full max-w-2xl mx-auto lg:mx-0">
        {showCamera && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-stone-400">Overlay</span>
            <SegmentedControl
              options={[
                { value: 'full', label: 'Full HUD' },
                { value: 'simple', label: 'Simplified' },
              ]}
              value={hudMode}
              onChange={setHudModeBoth}
            />
          </div>
        )}
        <div
          className="relative w-full max-h-[80vh] mx-auto rounded-2xl overflow-hidden border border-stone-200 shadow-[var(--shadow-soft)] bg-stone-950"
          style={{ aspectRatio: videoAspect }}
        >
          <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
          {showCamera && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm px-2.5 py-1">
              <span className="relative flex w-1.5 h-1.5 shrink-0">
                {personVisible && (
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: GRADE_GOOD_COLOR }}
                  />
                )}
                <span
                  className="relative inline-flex w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: personVisible ? GRADE_GOOD_COLOR : STATUS_WARNING_COLOR }}
                />
              </span>
              <span className="text-[10px] font-medium text-white uppercase tracking-wide">
                {personVisible ? 'Tracking' : 'No person detected'}
              </span>
            </div>
          )}
          {showCamera && !personVisible && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <p className="text-white text-sm font-medium text-center px-4">
                Can't see your full body — step back so your head and feet are both in frame
              </p>
            </div>
          )}
          {personVisible && phase === 'ready' && (
            <div className="absolute top-3 right-3 rounded-xl bg-black/55 backdrop-blur-sm px-4 py-2 text-right space-y-0.5">
              <p key={reps.length} className="text-2xl font-medium text-white tabular-nums leading-none animate-scale-in">{reps.length}</p>
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">rep{reps.length === 1 ? '' : 's'}</p>
              {overallGrade.score != null && (
                <p
                  className="text-xs font-medium tabular-nums"
                  style={{ color: overallGrade.score >= 80 ? GRADE_GOOD_COLOR : overallGrade.score < 60 ? GRADE_POOR_COLOR : '#ffffff' }}
                >
                  Score: {overallGrade.score}
                </p>
              )}
            </div>
          )}
        </div>
        </div>

        {phase === 'calibrating' && (
            <div className="space-y-3 rounded-2xl bg-stone-50 border border-stone-100 p-4 animate-fade-up">
              <p className="text-sm font-medium text-stone-900">Calibrating: {exercise.label}</p>
              <p className="text-sm text-stone-500">{exercise.calibration.instructions}</p>
              <p className="flex items-center gap-1.5 text-xs text-stone-400">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 animate-spin text-stone-400">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                Hold still for a couple of seconds…
              </p>
              <p className="text-sm text-stone-500">
                Current reading: <span className="font-medium text-stone-900">
                  {calibrationLiveValue != null ? formatMeasurementValue(calibrationLiveValue) : '—'}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
            <div className="space-y-3 rounded-2xl bg-stone-50 border border-stone-100 p-5 animate-fade-up">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-medium text-stone-900">{exercise.label}</p>
                {overallGrade.score != null && (
                  <span
                    className="flex items-center gap-1.5 text-base font-medium tabular-nums"
                    style={{ color: gradeColor(overallGrade.score) }}
                  >
                    {overallGrade.letter} · {overallGrade.score}
                  </span>
                )}
              </div>

              <div>
                {exercise.angles.flatMap((a, i) =>
                  ['left', 'right'].map((side) => {
                    const value = angleValues[a.id]?.[side]
                    const isPrimaryTrackedSide = side === trackedSide
                    const isCalibrated = isPrimaryTrackedSide && exercise.calibration?.checkId === a.id && calibrationValue != null
                    const tags = [
                      a.primary && isPrimaryTrackedSide ? 'tracked' : null,
                      isCalibrated ? `baseline ${formatMeasurementValue(calibrationValue)}` : null,
                    ].filter(Boolean)
                    return (
                      <AngleRow
                        key={`${a.id}-${side}`}
                        color={ANGLE_COLORS[i % ANGLE_COLORS.length]}
                        label={sideLabel(side, a.label)}
                        value={value}
                        flagged={isOutOfRange(a, value)}
                        reason={angleUnavailable[a.id]?.[side]}
                        tags={tags}
                      />
                    )
                  })
                )}
              </div>

              {reps.length > 0 && (
                <div className="pt-2 border-t border-stone-200 space-y-1.5 max-h-48 overflow-y-auto">
                  {reps.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm bg-white rounded-lg border border-stone-200 px-3 py-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-medium shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                      <span className="font-medium text-stone-900 tabular-nums">{Math.round(r.extremeValue)}°</span>
                      <span className="text-stone-500 tabular-nums">· tempo {formatTempo(r)}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-stone-400">{exercise.instructions}</p>

              <Button onClick={finishSet} disabled={reps.length === 0} className="w-full">
                Finish set
              </Button>
            </div>
          )}
        </div>
    </Card>
  )
}
