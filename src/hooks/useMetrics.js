import { useCallback, useEffect, useState } from 'react'
import { supabase, getAuthedUserId, SESSION_EXPIRED_ERROR } from '../lib/supabaseClient'

export function useMetrics(clientId) {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthedUserId()
    if (!userId) {
      setMetrics([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('client_id', clientId)
      .eq('trainer_id', userId)
      .order('recorded_at', { ascending: false })

    if (!error) setMetrics(data)
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // `videoBlob` is optional — the annotated capture recording, if the
  // browser supports canvas recording and one exists for this set. Upload
  // failures (network hiccup, bucket not provisioned) never block saving
  // the metric itself: the numbers are what actually matters, the video is
  // a bonus on top, so a failed upload just means no video_path, not a
  // failed save.
  async function addMetric({ metricName, value, unit, notes, videoBlob }) {
    const userId = await getAuthedUserId()
    if (!userId) return { error: SESSION_EXPIRED_ERROR }

    let videoPath = null
    if (videoBlob) {
      const path = `${userId}/${clientId}/${crypto.randomUUID()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('capture-videos')
        .upload(path, videoBlob, { contentType: 'video/webm' })
      if (!uploadError) videoPath = path
    }

    const insertRow = {
      client_id: clientId,
      trainer_id: userId,
      metric_name: metricName,
      value,
      unit,
      notes,
      video_path: videoPath,
    }

    let { data, error } = await supabase.from('metrics').insert(insertRow).select().single()

    // 42703 = undefined_column — the video_path migration hasn't been run
    // on this Supabase project yet. Retry once without it rather than
    // failing the whole save over a column that doesn't exist; the video
    // just silently isn't persisted until the migration is applied.
    if (error?.code === '42703' && videoPath != null) {
      ;({ data, error } = await supabase
        .from('metrics')
        .insert({ client_id: clientId, trainer_id: userId, metric_name: metricName, value, unit, notes })
        .select()
        .single())
    }

    if (!error) setMetrics((prev) => [data, ...prev])
    return { error }
  }

  // Bucket is private, so a stored video_path isn't a usable URL on its
  // own — this mints a short-lived signed URL on demand each time someone
  // actually wants to watch it, rather than persisting a permanent link.
  async function getVideoUrl(path) {
    const { data, error } = await supabase.storage
      .from('capture-videos')
      .createSignedUrl(path, 3600)
    return { url: data?.signedUrl ?? null, error }
  }

  // DELETE on the row is already covered by the existing `for all` RLS
  // policy on metrics — no schema change needed for that part. The video
  // cleanup is best-effort: if it fails (or there was never a video_path),
  // the metric still gets deleted; an orphaned storage object is a much
  // smaller problem than a metric a trainer can't remove.
  async function deleteMetric(id) {
    const existing = metrics.find((m) => m.id === id)

    const { error } = await supabase
      .from('metrics')
      .delete()
      .eq('id', id)

    if (!error) {
      setMetrics((prev) => prev.filter((m) => m.id !== id))
      if (existing?.video_path) {
        supabase.storage.from('capture-videos').remove([existing.video_path])
      }
    }
    return { error }
  }

  return { metrics, loading, addMetric, deleteMetric, getVideoUrl }
}
