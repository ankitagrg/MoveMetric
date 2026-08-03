import { useMemo, useState } from 'react'
import { useMetrics } from '../hooks/useMetrics'
import MetricTrendChart from './MetricTrendChart'
import ExerciseCapture from './ExerciseCapture'
import Button from './ui/Button'
import Field from './ui/Field'
import Card from './ui/Card'
import Alert from './ui/Alert'

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
    setSubmitting(true)

    const { error } = await addMetric({
      metricName,
      value: parseFloat(value),
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

      <h2 className="text-xl font-semibold text-stone-900 tracking-tight">{client.name}</h2>

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

        {loading && <p className="text-sm text-stone-400">Loading…</p>}

        {!loading && metrics.length === 0 && (
          <Card className="px-4 py-8 text-center">
            <p className="text-sm text-stone-400">No metrics logged yet.</p>
          </Card>
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
