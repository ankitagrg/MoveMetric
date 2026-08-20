import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { REMEMBER_ME_KEY, supabase } from '../../lib/supabaseClient'
import Field from '../ui/Field'
import Card from '../ui/Card'
import Alert from '../ui/Alert'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
      <path d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.86-1.86A10.4 10.4 0 0 0 19 10s-3-6.25-9-6.25c-1.32 0-2.51.3-3.55.79L3.28 2.22ZM7.5 6.5l1.36 1.36a2.5 2.5 0 0 1 3.28 3.28l1.36 1.36A4 4 0 0 0 7.5 6.5Z" />
      <path d="m5.06 5.94-1.6-1.6C1.9 5.55 1 7.5 1 7.5s2.5 6.25 9 6.25c1.06 0 2.02-.17 2.87-.46l-1.5-1.5a4 4 0 0 1-5.15-5.15L5.06 5.94Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
      <path d="M10 3.75c-6 0-9 6.25-9 6.25s3 6.25 9 6.25 9-6.25 9-6.25-3-6.25-9-6.25ZM10 13.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    </svg>
  )
}

export default function AuthForm({ mode: initialMode = 'login', onBack }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  function switchMode(next) {
    setMode(next)
    setError(null)
    setMessage(null)
    if (next === 'login') navigate('/login')
    else if (next === 'signup') navigate('/register')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (mode === 'reset') {
      setSubmitting(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      setSubmitting(false)
      if (error) {
        setError(error.message)
        return
      }
      setMessage('Check your email for a password reset link.')
      return
    }

    localStorage.setItem(REMEMBER_ME_KEY, mode === 'login' ? String(rememberMe) : 'true')

    setSubmitting(true)
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signup' && !data.session) {
      setMessage('Check your email to confirm your account.')
    }
  }

  const heading = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Get started' : 'Reset password'
  const subtitle =
    mode === 'login' ? 'Sign in to continue to MoveMetric.'
    : mode === 'signup' ? 'Create an account to get started.'
    : "Enter your email and we'll send you a reset link."

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 sm:px-6 py-16">
      <div className="w-full max-w-5xl">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            &larr; Back
          </button>
        )}

        <div className="relative rounded-3xl sm:rounded-[2.5rem] border border-stone-200 overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(ellipse 80% 80% at 20% 30%, var(--color-stone-100), var(--color-stone-50) 70%)' }}
          />

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center p-6 sm:p-10 lg:p-16">
            <div>
              <span className="inline-flex items-center gap-2.5">
                <Logo size="sm" />
                <span className="text-sm font-semibold text-stone-500 tracking-tight">MoveMetric</span>
              </span>

              <h1 className="mt-7 text-4xl sm:text-5xl font-bold tracking-tight text-balance">
                <span className="text-stone-900">Objective data,</span>
                <br />
                <span className="text-stone-400">every session.</span>
              </h1>

              <p className="mt-6 max-w-sm text-stone-500 leading-relaxed">
                Add a client, point a webcam at a set, and let MoveMetric count reps,
                time tempo, and grade the set &mdash; automatically.
              </p>
            </div>

            <Card className="w-full max-w-sm mx-auto p-8 sm:p-10 shadow-sm">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-stone-900">{heading}</h2>
                <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <Field
                  label="Email"
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="email@example.com"
                />

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('reset')}
                          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pr-12 text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        <EyeIcon hidden={showPassword} />
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <label className="flex items-center gap-2 text-sm text-stone-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                    />
                    Remember me
                  </label>
                )}

                {error && <Alert tone="error">{error}</Alert>}
                {message && <Alert tone="success">{message}</Alert>}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting
                    ? 'Please wait…'
                    : mode === 'login' ? 'Sign in →'
                    : mode === 'signup' ? 'Sign up →'
                    : 'Send reset link →'}
                </Button>
              </form>

              {mode === 'reset' ? (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="mt-6 w-full text-center text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  &larr; Back to login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="mt-6 w-full text-center text-sm text-stone-500 transition-colors"
                >
                  {mode === 'login' ? (
                    <>Don&apos;t have an account? <span className="text-measure-4 font-bold hover:opacity-80 transition-opacity">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="text-measure-4 font-bold hover:opacity-80 transition-opacity">Log in</span></>
                  )}
                </button>
              )}

              <p className="mt-8 text-center text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                Rep counting &middot; Tempo tracking &middot; Form grading
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
