import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  async function addClient({ name, email, phone, notes }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clients')
      .insert({ trainer_id: user.id, name, email, phone, notes })
      .select()
      .single()

    if (!error) setClients((prev) => [data, ...prev])
    return { error }
  }

  async function updateClient(id, { name, email, phone, notes }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clients')
      .update({ name, email, phone, notes })
      .eq('id', id)
      .eq('trainer_id', user.id)
      .select()
      .single()

    if (!error) setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
    return { data, error }
  }

  // Cascades to that client's metrics at the database level (see
  // supabase/schema.sql — metrics.client_id is `on delete cascade`), so this
  // is a single irreversible action, not just an unlink.
  async function deleteClient(id) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('trainer_id', user.id)

    if (!error) setClients((prev) => prev.filter((c) => c.id !== id))
    return { error }
  }

  return { clients, loading, addClient, updateClient, deleteClient }
}
