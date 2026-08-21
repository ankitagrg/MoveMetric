import { useEffect, useState } from 'react'
import { scoreToGrade } from '../../lib/grading'
import { formatTempo, averageTempo } from '../../lib/reps'
import { gradeColor, GRADE_GOOD_COLOR, GRADE_POOR_COLOR } from '../../lib/theme'
import { sideLabel } from '../../lib/poseOverlay'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import StatTile from '../ui/StatTile'
import WarningIcon from '../ui/WarningIcon'

const depthIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v14m0 0-3.5-3.5M12 18l3.5-3.5" />
    <path strokeLinecap="round" d="M6 20h12" />
  </svg>
)

const postureIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <circle cx="12" cy="5" r="1.75" />
    <path strokeLinecap="round" d="M12 7.5v5.5M12 13c-1.8 1.4-2.5 2.7-2.5 5M12 13c1.8 1.4 2.5 2.7 2.5 5" />
  </svg>
)

const consistencyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 0 1 13.5-5.5L20 8M20 5v3.5h-3.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13a8 8 0 0 1-13.5 5.5L4 16M4 19v-3.5h3.5" />
  </svg>
)

const backIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 4.5 6 10l6.5 5.5" />
  </svg>
)

const sparkleIcon = (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M8 1.5c.3 2.3 1 3.7 3.5 4-2.5.3-3.2 1.7-3.5 4-.3-2.3-1-3.7-3.5-4 2.5-.3 3.2-1.7 3.5-4Z" />
  </svg>
)

// Maps an insight's tone to the same green/red vocabulary a grade already
// uses (see gradeColor) — 'neutral' deliberately stays black, not gray, so
// it still reads as a real takeaway rather than a disabled/muted one.
const INSIGHT_TONE_COLOR = {
  good: GRADE_GOOD_COLOR,
  neutral: 'var(--color-stone-900)',
  warning: GRADE_POOR_COLOR,
}

function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

// One phase of a single rep's tempo (e.g. "Eccentric 2s"), shown when a rep
// row is expanded — the compact "1-0-1-1" tempo string in the collapsed row
// is the same data, just too dense to read as labeled phases at a glance.
function TempoPhase({ label, ms }) {
  return (
    <div className="rounded-md bg-white border border-stone-100 py-1.5 text-center">
      <p className="text-sm font-medium text-stone-900 tabular-nums">{Math.round(ms / 1000)}s</p>
      <p className="text-[9px] font-medium text-stone-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

// The overall set grade: a ring gauge with the letter front and center, same
// footprint as a Kinetriq-style assessment badge. The ring sweeps in and the
// number counts up on arrival (score starts at 0, eases to the real value)
// instead of just appearing pre-filled — the one moment on this screen
// that's worth a reveal.
function GradeBadge({ grade, score }) {
  const size = 136
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const color = gradeColor(score)

  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (score == null) return
    const duration = 800
    const start = performance.now()
    let raf

    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setAnimatedScore(Math.round(eased * score))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  const pct = score == null ? 0 : Math.max(0, Math.min(100, animatedScore)) / 100

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-stone-200)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-medium tabular-nums" style={{ color }}>
          {grade ?? '—'}
        </span>
        <span className="text-[11px] font-medium tabular-nums text-stone-400">
          {score != null ? `${animatedScore} / 100` : 'Not graded'}
        </span>
      </div>
    </div>
  )
}

// One row of the sub-metric breakdown below the overall grade — a thin
// meter bar under the label sweeps in to `score`% on mount (starts at 0,
// same reveal idea as the big ring above it) so the breakdown reads as
// something that just happened, not a static table.
function GradeRow({ icon, label, score }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(score ?? 0), 50)
    return () => clearTimeout(t)
  }, [score])

  const color = gradeColor(score)

  return (
    <div className="py-2.5 border-b border-stone-100 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 min-w-0 text-sm font-medium text-stone-600">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-stone-100 text-stone-500 shrink-0">
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="font-medium text-base tabular-nums" style={{ color }}>
            {scoreToGrade(score)}
          </span>
          <span className="text-xs font-medium tabular-nums w-6 text-right" style={{ color }}>
            {score}
          </span>
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, backgroundColor: color, transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </div>
    </div>
  )
}

// The post-set results screen: a standalone page (not the "Measure via
// camera" card the Set up/Capture steps live in) so finishing a set actually
// feels like arriving somewhere new, matching the dedicated /results route
// ExerciseCapture already navigates to.
export default function CaptureResults({
  clientName,
  exercise,
  reps,
  overallGrade,
  insights,
  depthScore,
  postureScore,
  postureAngle,
  trackedSide,
  consistencyScore,
  bestExtreme,
  setDuration,
  recordingUrl,
  saving,
  onSave,
  onDiscard,
  onClose,
}) {
  const hasBreakdown = depthScore != null || postureScore != null || consistencyScore != null
  const [expandedRep, setExpandedRep] = useState(null)

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-scale-in">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          {backIcon} Back
        </button>
        {clientName && <span className="text-sm font-medium text-stone-400 truncate">for {clientName}</span>}
      </div>

      <Card className="relative overflow-hidden p-6 sm:p-8 shadow-[var(--shadow-soft-lg)] rounded-3xl">
        {overallGrade.score != null && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: gradeColor(overallGrade.score) }}
          />
        )}
        <div className="flex items-center justify-between gap-3 mb-5">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-900">Set complete</span>
          <Badge tone="dark">Form analysis</Badge>
        </div>
        <div className="flex items-center gap-5 sm:gap-6">
          <GradeBadge grade={overallGrade.letter} score={overallGrade.score} />
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight truncate">
              {exercise.label}
            </h2>
            <p className="text-sm font-medium text-stone-500 mt-1.5">
              {reps.length} rep{reps.length === 1 ? '' : 's'}
              {bestExtreme != null && <> &middot; best {Math.round(bestExtreme)}&deg;</>}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatTile value={reps.length} label="Reps" />
        <StatTile value={formatDuration(setDuration)} label="Duration" />
        <StatTile value={reps.length ? formatTempo(averageTempo(reps)) : '—'} label="Avg tempo" />
      </div>
      <p className="text-[11px] text-stone-400 -mt-3.5 text-center">
        Tempo in seconds: eccentric&ndash;pause&ndash;concentric&ndash;pause
      </p>

      {insights?.length > 0 && (
        <Card className="p-6 shadow-sm space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-900">Takeaways</p>
          <ul className="space-y-2.5">
            {insights.map(({ text, tone }, i) => {
              // Only the bullet carries the tone color, not the sentence
              // itself — green/red body text reads noticeably lower-contrast
              // than black at this size, so color stays on the small badge
              // (same restraint GradeRow uses: colored number, neutral label).
              const color = INSIGHT_TONE_COLOR[tone] ?? INSIGHT_TONE_COLOR.neutral
              return (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span
                    className="flex items-center justify-center w-4 h-4 rounded-full text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: color }}
                  >
                    {tone === 'warning' ? <WarningIcon className="w-2.5 h-2.5" /> : sparkleIcon}
                  </span>
                  {text}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {hasBreakdown && (
        <Card className="p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-900 mb-1">Breakdown</p>
          {depthScore != null && <GradeRow icon={depthIcon} label="Depth" score={depthScore} />}
          {postureScore != null && (
            <GradeRow icon={postureIcon} label={sideLabel(trackedSide, postureAngle.label)} score={postureScore} />
          )}
          {consistencyScore != null && <GradeRow icon={consistencyIcon} label="Consistency" score={consistencyScore} />}
        </Card>
      )}

      {reps.length > 0 && (
        <Card className="p-6 shadow-sm space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-900">Reps &middot; tap for tempo detail</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {reps.map((r, i) => {
              const isOpen = expandedRep === i
              return (
                <div
                  key={i}
                  className="rounded-lg border border-stone-100 bg-stone-50 overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedRep(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-2.5 text-sm px-3 py-2 text-left hover:bg-stone-100 active:bg-stone-200/70 transition-colors"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-medium shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="font-medium text-stone-900 tabular-nums">{Math.round(r.extremeValue)}&deg;</span>
                    <span className="text-stone-400 tabular-nums">&middot; tempo {formatTempo(r)}</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`ml-auto w-3.5 h-3.5 text-stone-300 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 4.5 5.5 5.5-5.5 5.5" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-4 gap-1.5 px-3 pb-3 pt-1 animate-fade-up">
                      <TempoPhase label="Eccentric" ms={r.eccentricMs} />
                      <TempoPhase label="Bottom" ms={r.bottomPauseMs} />
                      <TempoPhase label="Concentric" ms={r.concentricMs} />
                      <TempoPhase label="Top" ms={r.topPauseMs} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 pt-1">
        <Button onClick={onSave} disabled={saving} size="lg">
          {saving ? 'Saving…' : 'Save set'}
        </Button>
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        {recordingUrl && (
          <a
            href={recordingUrl}
            download={`${exercise.id}-${Date.now()}.webm`}
            className="ml-auto text-sm font-medium text-stone-900 underline underline-offset-4 decoration-stone-300 hover:text-stone-500 transition-colors"
          >
            Download video
          </a>
        )}
      </div>
    </div>
  )
}
