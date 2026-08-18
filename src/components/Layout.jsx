import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { supabase } from '../lib/supabaseClient'
import Logo from './ui/Logo'
import Button from './ui/Button'

const chevronIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3 h-3 text-stone-300 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5 13 10l-5.5 5.5" />
  </svg>
)

function Breadcrumbs({ clientId, client }) {
  const location = useLocation()
  if (!clientId) return null

  const crumbs = [
    { label: 'Clients', to: '/clients' },
    { label: client?.name ?? 'Client', to: `/clients/${clientId}` },
  ]
  if (location.pathname.includes('/capture')) {
    crumbs.push({ label: 'Measure', to: null })
  }

  return (
    <div className="border-b border-stone-100 bg-white/60 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-sm font-medium text-stone-400 overflow-x-auto">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && chevronIcon}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-stone-900 transition-colors truncate max-w-[10rem]">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-stone-700 truncate max-w-[10rem]">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Layout({ session }) {
  const clientsState = useClients()
  const initial = session.user.email?.[0]?.toUpperCase() ?? '?'
  const { clientId } = useParams()
  const client = clientId ? clientsState.clients.find((c) => c.id === clientId) : null

  return (
    <div className="min-h-screen app-shell-bg">
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5 max-w-5xl mx-auto">
          <Link to="/clients" className="flex items-center gap-3 group">
            <Logo size="md" />
            <h1 className="text-xl font-medium text-stone-900 tracking-tight">MoveMetric</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 text-sm font-medium flex items-center justify-center">
                {initial}
              </span>
              <span className="text-sm font-medium text-stone-500">{session.user.email}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <Breadcrumbs clientId={clientId} client={client} />
      <Outlet context={clientsState} />
    </div>
  )
}
