import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthForm from './components/auth/AuthForm'
import Landing from './components/marketing/Landing'
import Layout from './components/Layout'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import CapturePage from './pages/CapturePage'
import Logo from './components/ui/Logo'

function App() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Logo className="animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<AuthForm mode="login" onBack={() => navigate('/')} />} />
        <Route path="/register" element={<AuthForm mode="signup" onBack={() => navigate('/')} />} />
        <Route path="/" element={<Landing onGetStarted={() => navigate('/login')} />} />
        {/* Any other path (e.g. a stale /clients/:id/capture link left over
            from a session that just expired) gets bounced to the actual
            Landing URL instead of rendering Landing's content underneath an
            unrelated address bar. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout session={session} />}>
        <Route index element={<Navigate to="/clients" replace />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />
        <Route path="clients/:clientId/capture" element={<CapturePage />} />
        <Route path="clients/:clientId/capture/live" element={<CapturePage />} />
        <Route path="clients/:clientId/capture/results" element={<CapturePage />} />
        <Route path="*" element={<Navigate to="/clients" replace />} />
      </Route>
    </Routes>
  )
}

export default App
