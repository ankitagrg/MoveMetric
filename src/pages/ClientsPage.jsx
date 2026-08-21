import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import EmptyState from '../components/ui/EmptyState'
import PageContainer from '../components/ui/PageContainer'
import { SkeletonList } from '../components/ui/Skeleton'

const usersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <circle cx="12" cy="8.5" r="3.25" />
    <path strokeLinecap="round" d="M5 20c0-3.6 3.13-6 7-6s7 2.4 7 6" />
  </svg>
)

const plusIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
    <path strokeLinecap="round" d="M10 4v12M4 10h12" />
  </svg>
)

const searchIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path strokeLinecap="round" d="m17 17-4-4" />
  </svg>
)

const closeIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5">
    <path strokeLinecap="round" d="m5 5 10 10M15 5 5 15" />
  </svg>
)

const arrowIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10h11M10.5 4.5 16 10l-5.5 5.5" />
  </svg>
)

const mailIconSm = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 5.5h13v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-9Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m4 6 6 5 6-5" />
  </svg>
)

const phoneIconSm = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h2.3l1 3.2-1.7 1.1a9 9 0 0 0 4.2 4.2l1.1-1.7 3.2 1v2.3c0 .7-.6 1.3-1.3 1.2C9.8 14.4 5.6 10.2 5.1 6c-.1-.7.5-1.3 1.2-1.3Z" />
  </svg>
)

const calendarIconSm = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
    <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" />
    <path strokeLinecap="round" d="M3.5 8h13M7 3v3M13 3v3" />
  </svg>
)

// Deterministic avatar tint so the same client always lands on the same
// shade — purely decorative variety within the grayscale palette, never a
// meaningful signal (unlike the measurement colors used during capture).
const AVATAR_TONES = [
  'bg-stone-900 text-white',
  'bg-stone-700 text-white',
  'bg-stone-200 text-stone-700',
  'bg-stone-100 text-stone-600',
]
function avatarTone(name) {
  const code = (name || '?').charCodeAt(0) || 0
  return AVATAR_TONES[code % AVATAR_TONES.length]
}

export default function ClientsPage() {
  const { clients, loading, addClient } = useOutletContext()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.name, c.email, c.phone].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  }, [clients, query])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await addClient({
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    setEmail('')
    setPhone('')
    setNotes('')
    setShowForm(false)
  }

  return (
    <PageContainer maxWidth="max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">Clients</h1>
          <p className="mt-1.5 text-sm sm:text-base text-stone-500">Manage your clients and track progress across sessions.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="w-full sm:w-auto shrink-0">
          {showForm ? closeIcon : plusIcon}
          {showForm ? 'Close' : 'Add client'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-7 sm:p-9 shadow-[var(--shadow-soft)] animate-scale-in">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-900 text-white shrink-0">
              {plusIcon}
            </span>
            <h2 className="text-2xl font-medium text-stone-900 tracking-tight">Add client</h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <Field
              label="Name"
              id="client-name"
              type="text"
              required
              autoFocus
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

            <Field
              label="Notes"
              id="client-notes"
              as="textarea"
              rows={2}
              placeholder="Optional — injuries, goals, anything worth remembering"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {error && <Alert tone="error">{error}</Alert>}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add client'}
              </Button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div>
        {clients.length > 3 && (
          <div className="relative group mb-5 ml-auto w-fit">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors">
              {searchIcon}
            </span>
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-36 sm:w-52 rounded-full border border-stone-200 bg-white pl-10 pr-9 py-2 text-sm font-medium text-stone-900 placeholder:text-stone-400 transition-all hover:border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/8"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                {closeIcon}
              </button>
            )}
          </div>
        )}

        {loading && <SkeletonList rows={3} />}

        {!loading && clients.length === 0 && (
          <EmptyState
            icon={usersIcon}
            title="No clients yet"
            message="Add your first one to start tracking their metrics."
            action={<Button size="sm" onClick={() => setShowForm(true)}>Add client</Button>}
          />
        )}

        {!loading && clients.length > 0 && filtered.length === 0 && (
          <EmptyState icon={searchIcon} title="No matches" message={`No clients match "${query}".`} />
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((client, i) => (
              <button
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                className="group text-left rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200 hover:bg-stone-50 active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 focus-visible:ring-offset-2 animate-fade-up"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`w-12 h-12 rounded-full text-base font-medium flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${avatarTone(client.name)}`}>
                    {client.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="flex items-center justify-center w-7 h-7 rounded-full text-stone-300 shrink-0 transition-all duration-200 group-hover:bg-stone-900 group-hover:text-white group-hover:translate-x-0.5">
                    {arrowIcon}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 text-[17px] tracking-tight truncate">{client.name}</p>
                  {!client.email && !client.phone && (
                    <p className="text-sm text-stone-300 mt-1">No contact info</p>
                  )}
                </div>

                {(client.email || client.phone) && (
                  <dl className="space-y-2 -mt-1">
                    {client.email && (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-stone-300 shrink-0">{mailIconSm}</span>
                        <dd className="text-sm text-stone-500 truncate">{client.email}</dd>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-stone-300 shrink-0">{phoneIconSm}</span>
                        <dd className="text-sm text-stone-500 truncate">{client.phone}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {client.created_at && (
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mt-auto pt-4 border-t border-stone-100">
                    <span className="text-stone-300 shrink-0">{calendarIconSm}</span>
                    <span>Added {new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
