import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useMetrics(clientId) {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false })

    if (!error) setMetrics(data)
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  async function addMetric({ metricName, value, unit, notes }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('metrics')
      .insert({
        client_id: clientId,
        trainer_id: user.id,
        metric_name: metricName,
        value,
        unit,
        notes,
      })
      .select()
      .single()

    if (!error) setMetrics((prev) => [data, ...prev])
    return { error }
  }

  return { metrics, loading, addMetric }
}
