import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabaseClient'
import AuthForm from './components/AuthForm'
import Landing from './components/Landing'
import Clients from './components/Clients'

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

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <h1 className="text-lg font-semibold text-stone-900 tracking-tight">MoveMetric</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500 hidden sm:inline">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
      </header>
      <Clients />
    </div>
  )
}

export default App
