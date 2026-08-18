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

  return { clients, loading, addClient, updateClient }
}
