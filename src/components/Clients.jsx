import { useState } from 'react'
import { useClients } from '../hooks/useClients'
import ClientDetail from './ClientDetail'
import Button from './ui/Button'
import Field from './ui/Field'
import Card from './ui/Card'
import Alert from './ui/Alert'
import EmptyState from './ui/EmptyState'
import { SkeletonList } from './ui/Skeleton'

const usersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <circle cx="12" cy="8.5" r="3.25" />
    <path strokeLinecap="round" d="M5 20c0-3.6 3.13-6 7-6s7 2.4 7 6" />
  </svg>
)

export default function Clients() {
  const { clients, loading, addClient } = useClients()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await addClient({ name, email, phone, notes: null })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    setEmail('')
    setPhone('')
  }

  if (selectedClient) {
    return <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pb-16 space-y-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-stone-900">Add client</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field
            label="Name"
            id="client-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Email"
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Field
              label="Phone"
              id="client-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add client'}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-3">Clients</h2>

        {loading && <SkeletonList rows={3} />}

        {!loading && clients.length === 0 && (
          <EmptyState
            icon={usersIcon}
            title="No clients yet"
            message="Add your first one above to start tracking their metrics."
          />
        )}

        {clients.length > 0 && (
          <Card className="divide-y divide-stone-100 overflow-hidden">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="w-full text-left px-4 py-3.5 hover:bg-stone-50 transition-colors flex items-center gap-3.5"
              >
                <span className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold flex items-center justify-center shrink-0">
                  {client.name?.[0]?.toUpperCase() ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{client.name}</p>
                  {(client.email || client.phone) && (
                    <p className="text-sm text-stone-400 truncate">
                      {[client.email, client.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-stone-300 shrink-0">&rarr;</span>
              </button>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
