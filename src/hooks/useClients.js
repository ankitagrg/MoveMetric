import { useCallback, useEffect, useState } from 'react'
import { supabase, getAuthedUserId, SESSION_EXPIRED_ERROR } from '../lib/supabaseClient'

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthedUserId()
    if (!userId) {
      setClients([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('trainer_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  async function addClient({ name, email, phone, notes }) {
    const userId = await getAuthedUserId()
    if (!userId) return { error: SESSION_EXPIRED_ERROR }

    const { data, error } = await supabase
      .from('clients')
      .insert({ trainer_id: userId, name, email, phone, notes })
      .select()
      .single()

    if (!error) setClients((prev) => [data, ...prev])
    return { error }
  }

  async function updateClient(id, { name, email, phone, notes }) {
    const userId = await getAuthedUserId()
    if (!userId) return { data: null, error: SESSION_EXPIRED_ERROR }

    const { data, error } = await supabase
      .from('clients')
      .update({ name, email, phone, notes })
      .eq('id', id)
      .eq('trainer_id', userId)
      .select()
      .single()

    if (!error) setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
    return { data, error }
  }

  // Cascades to that client's metrics at the database level (see
  // supabase/schema.sql — metrics.client_id is `on delete cascade`), so this
  // is a single irreversible action, not just an unlink.
  async function deleteClient(id) {
    const userId = await getAuthedUserId()
    if (!userId) return { error: SESSION_EXPIRED_ERROR }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('trainer_id', userId)

    if (!error) setClients((prev) => prev.filter((c) => c.id !== id))
    return { error }
  }

  return { clients, loading, addClient, updateClient, deleteClient }
}
