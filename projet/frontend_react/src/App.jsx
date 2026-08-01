import { useEffect, useState } from 'react'
import GaleriePublic from './pages/galerie/GaleriePublic'
import PwaInstallPrompt from './components/PwaInstallPrompt'
import { api } from './services/api'
import './App.css'

function App() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const expireSession = () => {
      setError('Session admin expiree. Reconnectez-vous.')
    }

    window.addEventListener('session-expired', expireSession)
    api.getConfig()
      .then((cfg) => {
        setConfig(cfg.configuration)
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

  if (loading) return <main className="screen center">Chargement...</main>

  return (
    <main className="app-shell">
      <PwaInstallPrompt />
      {error && <div className="toast">{error}</div>}
      <GaleriePublic config={config} onError={setError} />
    </main>
  )
}

export default App
