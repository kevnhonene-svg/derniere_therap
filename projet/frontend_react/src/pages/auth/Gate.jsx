import { useState } from 'react'
import { api } from '../../services/api'

function Gate({ config, onLogin, onError, onOpenGallery }) {
  const [code, setCode] = useState('')
  const [ticketLoading, setTicketLoading] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [admin, setAdmin] = useState({ username: '', password: '' })
  const [adminLoading, setAdminLoading] = useState(false)

  const loginTicket = async (event) => {
    event.preventDefault()
    setTicketLoading(true)
    try {
      const loginData = await api.loginBillet({ code_billet: code })
      await onLogin(loginData)
    } catch (err) {
      onError(err.message)
    } finally {
      setTicketLoading(false)
    }
  }

  const loginAdmin = async (event) => {
    event.preventDefault()
    setAdminLoading(true)
    try {
      const loginData = await api.loginAdmin(admin)
      await onLogin(loginData)
    } catch {
      onError("Cet acces est strictement reserve au superadmin.")
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <section className="gate">
      <button className="admin-corner" type="button" onClick={() => setAdminOpen(true)}>
        Admin
      </button>
      <div className="gate-panel">
        <p className="eyebrow">{config.sous_titre}</p>
        <h1>{config.nom_application || 'COFFA'}</h1>
        <p className="lead">{config.nom_evenement}</p>
        {config.notice_client && <p className="gate-notice">{config.notice_client}</p>}
        <button className="gallery-entry-btn" type="button" onClick={onOpenGallery}>
          Galerie officielle
        </button>
        <form className="ticket-form" onSubmit={loginTicket}>
          <label>
            Code billet
            <input disabled={ticketLoading} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Entrez votre code" />
          </label>
          <button className="loading-button" type="submit" disabled={ticketLoading}>
            {ticketLoading && <span className="spinner" />}
            {ticketLoading ? 'Verification...' : 'Entrer'}
          </button>
        </form>
      </div>
      {adminOpen && (
        <div className="modal">
          <form className="modal-box" onSubmit={loginAdmin}>
            <button className="close" type="button" onClick={() => setAdminOpen(false)}>x</button>
            <h2>Acces superadmin</h2>
            <input disabled={adminLoading} placeholder="Nom utilisateur" value={admin.username} onChange={(e) => setAdmin({ ...admin, username: e.target.value })} />
            <input disabled={adminLoading} placeholder="Mot de passe" type="password" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} />
            <button className="loading-button" type="submit" disabled={adminLoading}>
              {adminLoading && <span className="spinner" />}
              {adminLoading ? 'Connexion...' : 'Connexion'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

export default Gate
