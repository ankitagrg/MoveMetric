import { useEffect, useRef, useState } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { supabase } from '../lib/supabaseClient'
import Logo from './ui/Logo'

const chevronIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3 h-3 text-stone-300 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5 13 10l-5.5 5.5" />
  </svg>
)

const chevronDownIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3 h-3 text-stone-400 shrink-0 transition-transform duration-150">
    <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
  </svg>
)

const signOutIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 17.5H4.5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h3M13.5 14l4-4-4-4M17.5 10h-10" />
  </svg>
)

function Breadcrumbs({ clientId, client }) {
  const location = useLocation()
  const onCapture = location.pathname.includes('/capture')
  // Only shown inside the capture flow ("Name > Measure"), where it's the
  // one thing telling you whose set you're mid-capture for. On the plain
  // profile page it would just repeat the big name heading right below it,
  // so it's suppressed there entirely — ClientDetailPage has its own Back
  // link for getting to the roster instead.
  if (!clientId || !onCapture) return null

  const crumbs = [
    { label: client?.name ?? 'Client', to: `/clients/${clientId}` },
    { label: 'Measure', to: null },
  ]

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

function UserMenu({ email }) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef(null)
  const initial = email?.[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    if (!open) return
    // Listen on "click" rather than "mousedown": mousedown fires and can
    // unmount the menu before the browser dispatches "click" on whatever
    // was pressed, which silently swallows clicks on the menu items
    // themselves (e.g. Sign out never firing). Using "click" here means
    // this listener runs after the menu item's own onClick has already
    // fired, since it's higher up the bubble path.
    function onOutsideClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onOutsideClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onOutsideClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('Sign out failed:', err)
    } finally {
      // Belt-and-suspenders: clear the session token directly and hard-nav
      // to "/" instead of trusting the onAuthStateChange → React re-render
      // chain to notice and redirect on its own — this way sign-out can
      // never appear to silently "do nothing", regardless of what state
      // signOut() left things in.
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => localStorage.removeItem(k))
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => sessionStorage.removeItem(k))
      window.location.href = '/'
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 sm:pr-3 transition-colors duration-150 hover:bg-stone-100 active:bg-stone-200"
      >
        <span className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 text-sm font-medium flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
          {initial}
        </span>
        <span className="hidden sm:inline text-sm font-medium text-stone-500 max-w-[14rem] truncate">{email}</span>
        <span className={open ? '-rotate-180' : ''}>{chevronDownIcon}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-soft-lg)] overflow-hidden animate-scale-in z-50"
        >
          <div className="px-4 py-2.5 sm:hidden">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Signed in as</p>
            <p className="text-sm font-medium text-stone-700 truncate mt-0.5">{email}</p>
          </div>
          {/* Fills the whole menu row edge-to-edge (no inset padding around
              it) so there's no dead zone between the visible box and the
              actual click target. */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-stone-600 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-60 disabled:pointer-events-none"
          >
            {signOutIcon}
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Layout({ session }) {
  const clientsState = useClients()
  const { clientId } = useParams()
  const client = clientId ? clientsState.clients.find((c) => c.id === clientId) : null

  return (
    <div className="min-h-screen app-shell-bg">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-sm border-b border-stone-100">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5 max-w-5xl mx-auto">
          <Link to="/clients" className="flex items-center gap-3 group transition-opacity duration-150 hover:opacity-70 active:opacity-50">
            <Logo size="md" />
            <h1 className="text-xl font-medium text-stone-900 tracking-tight">MoveMetric</h1>
          </Link>
          <UserMenu email={session.user.email} />
        </div>
      </header>
      <Breadcrumbs clientId={clientId} client={client} />
      <Outlet context={clientsState} />
    </div>
  )
}
