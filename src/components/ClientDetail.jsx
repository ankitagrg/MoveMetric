import { useMemo, useState } from 'react'
import { useMetrics } from '../hooks/useMetrics'
import MetricTrendChart from './MetricTrendChart'
import ExerciseCapture from './ExerciseCapture'
import Button from './ui/Button'
import Field from './ui/Field'
import Card from './ui/Card'
import Alert from './ui/Alert'
import EmptyState from './ui/EmptyState'
import { SkeletonList } from './ui/Skeleton'

const trendIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.5 11 11l3 2.5 4.5-5.5" />
  </svg>
)

export default function ClientDetail({ client, onBack }) {
  const { metrics, loading, addMetric } = useMetrics(client.id)
  const [metricName, setMetricName] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const numericValue = parseFloat(value)
    if (Number.isNaN(numericValue)) {
      setError('Value must be a number.')
      return
    }

    setSubmitting(true)

    const { error } = await addMetric({
      metricName,
      value: numericValue,
      unit: unit || null,
      notes: null,
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setMetricName('')
    setValue('')
    setUnit('')
  }

  const metricGroups = useMemo(() => {
    const groups = new Map()
    for (const m of metrics) {
      if (!groups.has(m.metric_name)) groups.set(m.metric_name, [])
      groups.get(m.metric_name).push(m)
    }
    return [...groups.entries()]
      .map(([name, points]) => ({ name, points }))
      .filter((g) => g.points.length >= 2)
      .sort((a, b) => {
        const aLatest = Math.max(...a.points.map((p) => new Date(p.recorded_at).getTime()))
        const bLatest = Math.max(...b.points.map((p) => new Date(p.recorded_at).getTime()))
        return bLatest - aLatest
      })
  }, [metrics])

  return (
    <div className="max-w-2xl mx-auto px-6 pb-16 space-y-8">
      <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
        ← Back to clients
      </button>

      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 text-sm font-semibold flex items-center justify-center shrink-0">
          {client.name?.[0]?.toUpperCase() ?? '?'}
        </span>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">{client.name}</h2>
      </div>

      {showCamera ? (
        <ExerciseCapture addMetric={addMetric} onDone={() => setShowCamera(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setShowCamera(true)}>
          Measure via camera
        </Button>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-stone-900">Log metric</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field
            label="Metric"
            id="metric-name"
            type="text"
            required
            placeholder="e.g. Squat depth, Balance score"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Value"
              id="metric-value"
              type="number"
              step="any"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />

            <Field
              label="Unit"
              id="metric-unit"
              type="text"
              placeholder="e.g. cm, kg, reps"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging…' : 'Log metric'}
          </Button>
        </form>
      </Card>

      {metricGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-stone-900">Progress</h3>
          {metricGroups.map((group) => (
            <Card key={group.name} className="p-5">
              <MetricTrendChart metricName={group.name} points={group.points} />
            </Card>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-3">History</h3>

        {loading && <SkeletonList rows={3} />}

        {!loading && metrics.length === 0 && (
          <EmptyState
            icon={trendIcon}
            title="No metrics logged yet"
            message="Log one above or measure via camera to start a trend."
          />
        )}

        {metrics.length > 0 && (
          <Card className="divide-y divide-stone-100 overflow-hidden">
            {metrics.map((metric) => (
              <div key={metric.id} className="px-4 py-3.5 flex justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900">{metric.metric_name}</p>
                  <p className="text-sm text-stone-400">
                    {new Date(metric.recorded_at).toLocaleDateString()}
                  </p>
                  {metric.notes && (
                    <p className="text-xs text-stone-400 mt-1">{metric.notes}</p>
                  )}
                </div>
                <p className="text-stone-900 font-medium whitespace-nowrap">
                  {metric.value}{metric.unit ? ` ${metric.unit}` : ''}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
