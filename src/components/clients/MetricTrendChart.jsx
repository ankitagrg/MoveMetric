import { useEffect, useMemo, useRef, useState } from 'react'
import { colorForMetric } from '../../lib/theme'

const WIDTH = 600
const HEIGHT = 220
// Wide enough for a value label like "83°" or "61" to sit in its own gutter,
// clear of the plotted line — without this, the axis has no numbers on it
// at all and every metric's line looks like it swings the same dramatic
// amount, since each chart auto-zooms to fill the same height regardless of
// whether the real change is 2 points or 40.
const PAD_LEFT = 34
const PAD_RIGHT = 8
const PAD_TOP = 20
const PAD_BOTTOM = 34

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatAxisValue(v, unit) {
  return `${Math.round(v)}${unit ? ` ${unit}` : ''}`
}

// Catmull-Rom-through-Bezier smoothing — a straight connect-the-dots line
// between just 2-3 close values (a common case early on, before many sets
// are logged) reads as flat and lifeless. This bends the same points into a
// real curve without moving any of them, so the line still passes exactly
// through every logged value; a genuine 2-point line is still straight
// (nothing to curve between exactly two points), but 3+ gets real shape.
function smoothPath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }
  return d
}

const upIcon = (
  <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
    <path d="M6 2 10.5 9H1.5Z" />
  </svg>
)

const downIcon = (
  <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
    <path d="M6 10 1.5 3h9Z" />
  </svg>
)

const tapIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
    <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="5" strokeDasharray="1.5 2.3" />
  </svg>
)

export default function MetricTrendChart({ metricName, points }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [pinnedIndex, setPinnedIndex] = useState(null)
  // Sanitized to a valid SVG id — metric names contain spaces/punctuation
  // that would silently break the `url(#...)` fill reference below.
  const gradientId = `trend-fill-${metricName.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const accent = colorForMetric(metricName)

  const allSorted = useMemo(
    () => [...points].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)),
    [points]
  )

  const { path, areaPath, xForIndex, yForValue, minValue, maxValue, sorted } = useMemo(() => {
    const sorted = allSorted
    const times = sorted.map((p) => new Date(p.recorded_at).getTime())
    const values = sorted.map((p) => p.value)

    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const timeSpan = maxTime - minTime || 1

    let minValue = Math.min(...values)
    let maxValue = Math.max(...values)
    if (minValue === maxValue) {
      minValue -= 1
      maxValue += 1
    } else {
      const pad = (maxValue - minValue) * 0.15
      minValue -= pad
      maxValue += pad
    }
    const valueSpan = maxValue - minValue

    const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
    const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

    function xForIndex(i) {
      return PAD_LEFT + ((times[i] - minTime) / timeSpan) * plotWidth
    }

    function yForValue(v) {
      return PAD_TOP + plotHeight - ((v - minValue) / valueSpan) * plotHeight
    }

    const path = smoothPath(sorted.map((p, i) => ({ x: xForIndex(i), y: yForValue(p.value) })))

    const baseline = PAD_TOP + plotHeight
    const areaPath = sorted.length
      ? `${path} L ${xForIndex(sorted.length - 1)} ${baseline} L ${xForIndex(0)} ${baseline} Z`
      : ''

    return { path, areaPath, xForIndex, yForValue, minValue, maxValue, sorted }
  }, [allSorted])

  function nearestIndexForEvent(e) {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) * (WIDTH / rect.width)

    let nearest = 0
    let nearestDist = Infinity
    sorted.forEach((_, i) => {
      const dist = Math.abs(xForIndex(i) - mouseX)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    return nearest
  }

  function handlePointerMove(e) {
    if (pinnedIndex !== null) return
    setHoverIndex(nearestIndexForEvent(e))
  }

  function handleClick(e) {
    const nearest = nearestIndexForEvent(e)
    setPinnedIndex((prev) => (prev === nearest ? null : nearest))
  }

  useEffect(() => {
    if (pinnedIndex === null) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setPinnedIndex(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [pinnedIndex])

  const last = sorted[sorted.length - 1]
  const first = sorted[0]
  const activeIndex = pinnedIndex ?? hoverIndex
  const hovered = activeIndex !== null ? sorted[activeIndex] : null
  const hoveredPrev = activeIndex !== null && activeIndex > 0 ? sorted[activeIndex - 1] : null
  const delta = sorted.length >= 2 ? last.value - first.value : null

  const values = sorted.map((p) => p.value)
  const peak = Math.max(...values)
  const low = Math.min(...values)
  const average = values.reduce((a, b) => a + b, 0) / values.length
  // With only a couple of logs, a straight/near-flat line plus a
  // hover-only tooltip leaves nothing readable until someone thinks to
  // tap it. Below this many points, every value gets printed right on the
  // chart instead — past that it would just be visual noise.
  const showAllLabels = sorted.length > 0 && sorted.length <= 6

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{ backgroundColor: `${accent}20` }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
          </span>
          <div className="min-w-0">
            <h4 className="text-lg font-medium text-stone-900 truncate">{metricName}</h4>
            <p className="text-sm text-stone-500">
              Latest <span className="font-medium tabular-nums" style={{ color: accent }}>
                {last.value}{last.unit ? ` ${last.unit}` : ''}
              </span>
            </p>
          </div>
        </div>

        {delta != null && (
          // Same emerald/red-for-direction convention the pinned tooltip
          // below already uses (pre-existing) — this badge previously
          // stayed plain gray, which read inconsistently next to a tooltip
          // that already color-codes the same up/down comparison.
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1.5 shrink-0 ${delta > 0 ? 'text-emerald-600 bg-emerald-50' : delta < 0 ? 'text-red-600 bg-red-50' : 'text-stone-500 bg-stone-100'}`}
          >
            <span className="inline-flex items-center justify-center w-3.5 h-3.5">
              {delta > 0 ? upIcon : delta < 0 ? downIcon : '—'}
            </span>
            {delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${Math.round(delta * 100) / 100}${last.unit ? ` ${last.unit}` : ''}`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400 mb-3">
        <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">
          {sorted.length} log{sorted.length === 1 ? '' : 's'}
        </span>
        {sorted.length > 1 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              {tapIcon} Tap a point to compare
            </span>
          </>
        )}
      </div>

      <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-60 touch-none cursor-pointer"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        onPointerUp={() => setHoverIndex(null)}
        onClick={handleClick}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={PAD_LEFT} y1={PAD_TOP} x2={WIDTH - PAD_RIGHT} y2={PAD_TOP} stroke="var(--color-stone-200)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={PAD_LEFT} y1={(PAD_TOP + HEIGHT - PAD_BOTTOM) / 2} x2={WIDTH - PAD_RIGHT} y2={(PAD_TOP + HEIGHT - PAD_BOTTOM) / 2} stroke="var(--color-stone-100)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={PAD_LEFT} y1={HEIGHT - PAD_BOTTOM} x2={WIDTH - PAD_RIGHT} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-stone-400)" strokeWidth="1.5" />

        {/* Y-axis value labels — without these, every metric's line fills
            the same vertical space regardless of whether the real change is
            2 points or 40, since the axis auto-zooms to that metric's own
            min/max. These give the line an actual number to be read against.
            Skipped whenever showAllLabels is on: with few points, every
            value is already printed right on its own dot, and a near-flat
            sparse chart (e.g. 89 -> 90) packs the axis min/mid/max into
            almost the same vertical space as those point labels — showing
            both just overlaps two copies of nearly the same number. */}
        {!showAllLabels && (
          <>
            <text x={4} y={PAD_TOP + 4} fontSize="10" fontWeight="500" fill="var(--color-stone-500)">
              {formatAxisValue(maxValue, last.unit)}
            </text>
            <text x={4} y={(PAD_TOP + HEIGHT - PAD_BOTTOM) / 2 + 3.5} fontSize="10" fontWeight="500" fill="var(--color-stone-400)">
              {formatAxisValue((minValue + maxValue) / 2, last.unit)}
            </text>
            <text x={4} y={HEIGHT - PAD_BOTTOM - 4} fontSize="10" fontWeight="500" fill="var(--color-stone-500)">
              {formatAxisValue(minValue, last.unit)}
            </text>
          </>
        )}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={path}
          pathLength="1"
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="animate-draw-line"
        />

        {hovered && (
          <line
            x1={xForIndex(activeIndex)}
            y1={PAD_TOP}
            x2={xForIndex(activeIndex)}
            y2={HEIGHT - PAD_BOTTOM}
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        )}

        {sorted.map((p, i) => (
          <g key={p.id}>
            {/* Invisible, larger hit target — the visible dot is too small to reliably tap on a touchscreen. */}
            <circle cx={xForIndex(i)} cy={yForValue(p.value)} r={14} fill="transparent" />
            {/* A soft pulse on just the most recent reading — a quiet "this
                just happened" cue, same idea as the live-tracking dot on the
                capture screen, not meant on every point. */}
            {i === sorted.length - 1 && (
              <circle
                cx={xForIndex(i)}
                cy={yForValue(p.value)}
                r={5}
                fill={accent}
                opacity="0.4"
                className="animate-ping"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
            <circle
              cx={xForIndex(i)}
              cy={yForValue(p.value)}
              r={i === activeIndex ? 7 : 5}
              fill={accent}
              stroke={i === pinnedIndex ? 'var(--color-measure-4)' : '#ffffff'}
              strokeWidth={i === pinnedIndex ? 3 : 2.5}
              className="transition-[r,stroke] duration-150"
            />
            {/* Printed right on the chart when there are few enough points
                (see showAllLabels) — the number is just there, not something
                you have to know to hover/tap for. Flips below the dot when
                it's near the top edge so the label never clips out of frame. */}
            {showAllLabels && (
              <text
                x={xForIndex(i)}
                y={yForValue(p.value) > PAD_TOP + 16 ? yForValue(p.value) - 12 : yForValue(p.value) + 20}
                textAnchor={i === 0 ? 'start' : i === sorted.length - 1 ? 'end' : 'middle'}
                fontSize="12"
                fontWeight="600"
                fill={i === activeIndex ? accent : 'var(--color-stone-600)'}
              >
                {p.value}{p.unit ? ` ${p.unit}` : ''}
              </text>
            )}
          </g>
        ))}

        {sorted.length > 1 && (
          <>
            <text x={xForIndex(0)} y={HEIGHT - 12} textAnchor="start" fontSize="11" fontWeight="500" fill="var(--color-stone-500)">
              {formatShortDate(first.recorded_at)}
            </text>
            <text x={xForIndex(sorted.length - 1)} y={HEIGHT - 12} textAnchor="end" fontSize="11" fontWeight="500" fill="var(--color-stone-500)">
              {formatShortDate(last.recorded_at)}
            </text>
          </>
        )}
      </svg>

      {hovered && (
        <div
          className={`pointer-events-none absolute top-0 rounded-lg border bg-white px-2.5 py-1.5 shadow-[var(--shadow-soft)] text-xs whitespace-nowrap animate-scale-in z-10 ${pinnedIndex !== null ? 'border-measure-4' : 'border-stone-200'}`}
          style={{
            left: `${(xForIndex(activeIndex) / WIDTH) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-medium text-sm" style={{ color: accent }}>
            {hovered.value}{hovered.unit ? ` ${hovered.unit}` : ''}
          </p>
          <p className="text-stone-600">
            {new Date(hovered.recorded_at).toLocaleDateString()}
          </p>
          {hoveredPrev && (
            <p className={hovered.value === hoveredPrev.value ? 'text-stone-400' : hovered.value > hoveredPrev.value ? 'text-emerald-600' : 'text-red-600'}>
              {hovered.value === hoveredPrev.value ? 'No change' : `${hovered.value > hoveredPrev.value ? '+' : ''}${Math.round((hovered.value - hoveredPrev.value) * 100) / 100}`} vs prev
            </p>
          )}
          {pinnedIndex !== null && (
            <p className="text-stone-400 mt-0.5">Tap to unpin</p>
          )}
        </div>
      )}
      </div>

      {/* Peak/low/average aren't "good" or "bad" the same way delta is (see
          colorForMetric) — just a factual summary of the range currently
          plotted, still accent-colored so it visually belongs to this chart. */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-100">
        <div className="text-center">
          <p className="text-base font-medium tabular-nums" style={{ color: accent }}>
            {formatAxisValue(peak, last.unit)}
          </p>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mt-0.5">Peak</p>
        </div>
        <div className="text-center border-x border-stone-100">
          <p className="text-base font-medium tabular-nums text-stone-700">
            {formatAxisValue(average, last.unit)}
          </p>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mt-0.5">Average</p>
        </div>
        <div className="text-center">
          <p className="text-base font-medium tabular-nums" style={{ color: accent }}>
            {formatAxisValue(low, last.unit)}
          </p>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mt-0.5">Low</p>
        </div>
      </div>
    </div>
  )
}
