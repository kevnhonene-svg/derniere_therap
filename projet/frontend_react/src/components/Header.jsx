import { useState } from 'react'
import { LogOut, User } from 'lucide-react'

function getInitials(label = 'COFFA') {
  return label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function Header({ config, session, onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const appName = config.nom_application || 'COFFA'
  const identity = session.invite?.nom_complet || session.user?.username || 'Superadmin'

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark" aria-hidden="true">{getInitials(appName)}</div>
        <div className="brand-copy">
          <strong>{appName}</strong>
          {config.sous_titre && <span>{config.sous_titre}</span>}
        </div>
      </div>

      <div className="identity">
        <div className="identity-chip">
          <User size={17} />
          <span>{identity}</span>
        </div>
        <button className="logout-btn" type="button" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? <span className="spinner" /> : <LogOut size={17} />}
          <span>{isLoggingOut ? 'Sortie...' : 'Sortir'}</span>
        </button>
      </div>
    </header>
  )
}

export default Header
