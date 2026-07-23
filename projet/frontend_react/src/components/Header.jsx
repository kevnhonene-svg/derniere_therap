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
  const appName = config.nom_application || 'COFFA'
  const identity = session.invite?.nom_complet || session.user?.username || 'Superadmin'

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
        <button className="logout-btn" type="button" onClick={onLogout}>
          <LogOut size={17} />
          <span>Sortir</span>
        </button>
      </div>
    </header>
  )
}

export default Header
