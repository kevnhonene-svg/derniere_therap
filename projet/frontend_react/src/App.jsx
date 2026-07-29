import { useEffect, useState } from 'react'
import AdminSpace from './pages/admin/AdminSpace'
import Gate from './pages/auth/Gate'
import ClientSpace from './pages/client/ClientSpace'
import ProtocolSpace from './pages/protocole/ProtocolSpace'
import PwaInstallPrompt from './components/PwaInstallPrompt'
import { api } from './services/api'
import './App.css'

function App() {
  const [config, setConfig] = useState({})
  const [session, setSession] = useState({ role: 'anonymous' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshSession = async (loginData) => {
    if (loginData?.role) {
      setSession({ role: loginData.role, invite: loginData.invite, user: loginData.user })
      return
    }
    const me = await api.me()
    setSession({ role: me.role, invite: me.invite, user: me.user })
  }

  useEffect(() => {
    const expireSession = () => {
      setSession({ role: 'anonymous' })
      setError('Session admin expiree. Reconnectez-vous.')
    }

    window.addEventListener('session-expired', expireSession)
    Promise.all([api.getConfig(), api.me()])
      .then(([cfg, me]) => {
        setConfig(cfg.configuration)
        setSession({ role: me.role, invite: me.invite, user: me.user })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    return () => window.removeEventListener('session-expired', expireSession)
  }, [])

  useEffect(() => {
    if (!error) return undefined

    const timer = window.setTimeout(() => {
      setError('')
    }, 4000)

    return () => window.clearTimeout(timer)
  }, [error])

  const logout = async () => {
    await api.logout()
    setSession({ role: 'anonymous' })
  }

  if (loading) return <main className="screen center">Chargement...</main>

  return (
    <main className="app-shell">
      <PwaInstallPrompt />
      {error && <div className="toast">{error}</div>}
      {session.role === 'anonymous' && (
        <Gate config={config} onLogin={refreshSession} onError={setError} />
      )}
      {session.role === 'client' && (
        <ClientSpace config={config} session={session} onLogout={logout} onError={setError} />
      )}
      {session.role === 'protocole' && (
        <ProtocolSpace config={config} session={session} onLogout={logout} onError={setError} />
      )}
      {session.role === 'superadmin' && (
        <AdminSpace config={config} session={session} setConfig={setConfig} onLogout={logout} onError={setError} />
      )}
    </main>
  )
}

export default App
