import { useState } from 'react'
import { CheckCircle2, Search, Ticket, UserCheck, XCircle } from 'lucide-react'
import { api } from '../../services/api'

function ValidationBilletAdmin({ onError }) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)

  const search = async (event) => {
    event.preventDefault()
    if (!code.trim()) return onError('Veuillez entrer le code billet.')
    setLoading(true)
    setMessage('')
    setAlertMessage('')
    try {
      const data = await api.rechercherBillet(code.trim())
      setResult(data)
    } catch (err) {
      setResult(null)
      setAlertMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const validate = async () => {
    if (!code.trim()) return onError('Veuillez entrer le code billet.')
    setValidating(true)
    setMessage('')
    setAlertMessage('')
    try {
      const data = await api.validerBillet({ code_billet: code.trim() })
      setResult(data)
      setMessage(data.message || 'Billet valide avec succes.')
      onError(data.message || 'Billet valide avec succes.')
    } catch (err) {
      setAlertMessage(err.message)
    } finally {
      setValidating(false)
    }
  }

  const statusClass = result?.statut === 'utilise' ? 'used' : 'valid'
  const invite = result?.invite
  const formatProgress = (value) => String(value ?? 0).replace('.', ',')

  return (
    <section className="admin-panel validation-panel">
      <div className="admin-panel-head">
        <div>
          <span className="admin-kicker">Controle entree</span>
          <h1>Validation des billets</h1>
        </div>
      </div>

      <form className="ticket-validation-search" onSubmit={search}>
        <label className="field-label">
          Code billet
          <span className="ticket-input-wrap">
            <Ticket size={20} />
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Entrer ou scanner le code billet" />
          </span>
        </label>
        <button className="loading-button" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : <Search size={18} />}
          {loading ? 'Verification...' : 'Verifier'}
        </button>
      </form>

      {!result && (
        <div className="ticket-empty-state">
          <Ticket size={34} />
          <strong>En attente du code billet</strong>
          <span>Tapez le code donne par l'invite pour afficher ses informations avant validation.</span>
        </div>
      )}

      {result && (
        <div className={`ticket-validation-card ${statusClass}`}>
          <div className="ticket-validation-status">
            {result.statut === 'utilise' ? <XCircle size={28} /> : <CheckCircle2 size={28} />}
            <div>
              <strong>{result.statut === 'utilise' ? 'Code totalement utilise' : 'Code valide'}</strong>
              <span>{formatProgress(result.restant)} entree(s) restante(s) sur {result.capacite}</span>
            </div>
          </div>

          <div className="ticket-guest-grid">
            <div>
              <span>Invite</span>
              <strong>{invite.nom_complet}</strong>
            </div>
            <div>
              <span>Type billet</span>
              <strong>{invite.categorie_billet_label}</strong>
            </div>
            <div>
              <span>Table affectee</span>
              <strong>{invite.table?.nom || 'Sans table'}</strong>
            </div>
            <div>
              <span>Validation</span>
              <strong>{formatProgress(result.deja_valide)}/{result.capacite}</strong>
            </div>
          </div>

          {result.validations.length > 0 && (
            <div className="ticket-validation-history">
              <span>Historique</span>
              {result.validations.map((item) => (
                <small key={item.id}>
                  Personne {item.numero_personne}: 1ere validation par {item.valide_par_nom || 'Admin'} le {new Date(item.cree_le).toLocaleString('fr-FR')}
                  {item.est_complete
                    ? ` | 2e validation par ${item.confirme_par_nom || 'Admin'} le ${new Date(item.confirme_le).toLocaleString('fr-FR')}`
                    : ' | En attente du 2e admin'}
                </small>
              ))}
            </div>
          )}

          {message && <div className="ticket-validation-message">{message}</div>}

          <button className="ticket-validate-button loading-button" type="button" onClick={validate} disabled={validating || result.restant <= 0}>
            {validating ? <span className="spinner" /> : <UserCheck size={20} />}
            {validating ? 'Validation...' : 'Valider la personne'}
          </button>
        </div>
      )}

      {alertMessage && (
        <div className="modal">
          <div className="modal-box admin-alert-modal ticket-alert-modal">
            <button className="close" type="button" onClick={() => setAlertMessage('')}>x</button>
            <h2>Validation refusee</h2>
            <p>{alertMessage}</p>
            <button type="button" onClick={() => setAlertMessage('')}>Compris</button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ValidationBilletAdmin
