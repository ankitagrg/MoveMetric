import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Button from './ui/Button'
import Field from './ui/Field'
import Card from './ui/Card'
import Alert from './ui/Alert'
import Logo from './ui/Logo'

export default function AuthForm({ onBack }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signup') {
      setMessage('Check your email to confirm your account.')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(var(--color-stone-300) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 60% 60% at center, black 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at center, black 30%, transparent 85%)',
        }}
      />
      <div className="w-full max-w-sm">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            &larr; Back
          </button>
        )}

        <Card className="p-8">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">MoveMetric</h1>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            {mode === 'login' ? 'Welcome back — sign in to continue.' : 'Create an account to get started.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field
              label="Email"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Field
              label="Password"
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {error && <Alert tone="error">{error}</Alert>}
            {message && <Alert tone="success">{message}</Alert>}

            <Button type="submit" disabled={submitting} size="lg" className="w-full">
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </Button>
          </form>
        </Card>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setMessage(null)
          }}
          className="mt-6 w-full text-center text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
