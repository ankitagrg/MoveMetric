import { useMemo, useRef, useState } from 'react'

const WIDTH = 600
const HEIGHT = 180
const PAD_LEFT = 8
const PAD_RIGHT = 8
const PAD_TOP = 16
const PAD_BOTTOM = 28

export default function MetricTrendChart({ metricName, points }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  const { path, xForIndex, yForValue, minValue, maxValue, sorted } = useMemo(() => {
    const sorted = [...points].sort(
      (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
    )

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

    const path = sorted
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xForIndex(i)} ${yForValue(p.value)}`)
      .join(' ')

    return { path, xForIndex, yForValue, minValue, maxValue, sorted }
  }, [points])

  function handlePointerMove(e) {
    const svg = svgRef.current
    if (!svg) return
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
    setHoverIndex(nearest)
  }

  const last = sorted[sorted.length - 1]
  const hovered = hoverIndex !== null ? sorted[hoverIndex] : null

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-medium text-stone-700">{metricName}</h4>
        <p className="text-sm text-stone-500">
          Latest: <span className="font-semibold text-stone-900">
            {last.value}{last.unit ? ` ${last.unit}` : ''}
          </span>
        </p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-40"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <line x1={PAD_LEFT} y1={yForValue(maxValue)} x2={WIDTH - PAD_RIGHT} y2={yForValue(maxValue)} stroke="#e7e5e4" strokeWidth="1" />
        <line x1={PAD_LEFT} y1={yForValue(minValue)} x2={WIDTH - PAD_RIGHT} y2={yForValue(minValue)} stroke="#e7e5e4" strokeWidth="1" />
        <line x1={PAD_LEFT} y1={HEIGHT - PAD_BOTTOM} x2={WIDTH - PAD_RIGHT} y2={HEIGHT - PAD_BOTTOM} stroke="#d6d3d1" strokeWidth="1" />

        <path d={path} fill="none" stroke="#2a78d6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {sorted.map((p, i) => (
          <circle
            key={p.id}
            cx={xForIndex(i)}
            cy={yForValue(p.value)}
            r={i === hoverIndex ? 6 : 4}
            fill="#2a78d6"
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}

        {hovered && (
          <line
            x1={xForIndex(hoverIndex)}
            y1={PAD_TOP}
            x2={xForIndex(hoverIndex)}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="#d6d3d1"
            strokeWidth="1"
          />
        )}

        <text
          x={xForIndex(sorted.length - 1)}
          y={yForValue(last.value) - 10}
          textAnchor="end"
          fontSize="11"
          fill="#78716c"
        >
          {last.value}{last.unit ? ` ${last.unit}` : ''}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 shadow-md text-xs whitespace-nowrap"
          style={{
            left: `${(xForIndex(hoverIndex) / WIDTH) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-semibold text-stone-900">
            {hovered.value}{hovered.unit ? ` ${hovered.unit}` : ''}
          </p>
          <p className="text-stone-500">
            {new Date(hovered.recorded_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}
