import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabaseClient'
import AuthForm from './components/AuthForm'
import Landing from './components/Landing'
import Clients from './components/Clients'
import Logo from './components/ui/Logo'
import Button from './components/ui/Button'

function App() {
  const { session, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (loading) {
    
    return <div className="min-h-screen bg-stone-50" />
  }

  if (!session) {
    return showAuth
      ? <AuthForm onBack={() => setShowAuth(false)} />
      : <Landing onGetStarted={() => setShowAuth(true)} />
  }

  const initial = session.user.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-50/80 backdrop-blur-sm border-b border-stone-200/70">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-4xl mx-auto">
          <span className="flex items-center gap-2.5">
            <Logo size="sm" />
            <h1 className="text-lg font-semibold text-stone-900 tracking-tight">MoveMetric</h1>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 text-xs font-semibold flex items-center justify-center">
                {initial}
              </span>
              <span className="text-sm text-stone-500">{session.user.email}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <Clients />
    </div>
  )
}

export default App
