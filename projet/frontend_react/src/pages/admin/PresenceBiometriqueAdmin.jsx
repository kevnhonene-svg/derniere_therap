import { useEffect, useState } from 'react'
import { Fingerprint, LogIn, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { api } from '../../services/api'
import {
  bufferToBase64Url,
  prepareCreationOptions,
  prepareRequestOptions,
  webAuthnAvailable,
} from '../../utils/webauthn'

function PresenceBiometriqueAdmin({ onError }) {
  const [presences, setPresences] = useState([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.presencesBiometriques()
      setPresences(data.presences || [])
    } catch (err) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const ensureAvailable = () => {
    if (!webAuthnAvailable()) {
      throw new Error("La biometrie securisee n'est pas disponible sur cet appareil ou ce navigateur.")
    }
  }

  const registerInitialExit = async () => {
    try {
      ensureAvailable()
      setWorking('scan')
      setMessage('')
      const options = await api.optionsPresenceEnregistrement()
      const credential = await navigator.credentials.create({
        publicKey: prepareCreationOptions(options.publicKey),
      })
      const data = await api.confirmerPresenceEnregistrement({
        credential_id: bufferToBase64Url(credential.rawId),
        nom_appareil: navigator.userAgent.slice(0, 160),
        sortie_initiale: true,
      })
      setMessage(data.message || `${data.presence.identifiant}: sortie enregistree.`)
      await load()
    } catch (err) {
      onError(err.message)
    } finally {
      setWorking('')
    }
  }

  const scanPresence = async () => {
    try {
      ensureAvailable()
      setWorking('scan')
      setMessage('')
      if (presences.length === 0) {
        await registerInitialExit()
        return
      }
      const options = await api.optionsPresenceAction()
      const credential = await navigator.credentials.get({
        publicKey: prepareRequestOptions(options.publicKey),
      })
      const data = await api.confirmerPresenceAction({
        credential_id: bufferToBase64Url(credential.rawId),
        nom_appareil: navigator.userAgent.slice(0, 160),
      })
      setMessage(data.message || 'Mouvement enregistre.')
      await load()
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.message.includes('inconnue') || err.message.includes('Aucune empreinte')) {
        await registerInitialExit()
        return
      }
      onError(err.message)
    } finally {
      setWorking('')
    }
  }

  const countInside = presences.filter((presence) => presence.statut === 'dans_salle').length
  const countOutside = presences.filter((presence) => presence.statut === 'sorti').length
  const visiblePresences = presences.filter((presence) => presence.statut === 'sorti')

  return (
    <section className="admin-panel biometric-panel">
      <div className="admin-panel-head">
        <div>
          <span className="admin-kicker">Module separe</span>
          <h1>Presence biometrique</h1>
        </div>
        <button className="secondary" type="button" onClick={load} disabled={loading}>
          <RefreshCw size={17} />
          <span>{loading ? '...' : 'Actualiser'}</span>
        </button>
      </div>

      <div className="biometric-actions">
        <button className="biometric-main-action" type="button" onClick={scanPresence} disabled={Boolean(working)}>
          {working === 'scan' ? <span className="spinner" /> : <ShieldCheck size={24} />}
          <span>Scanner empreinte</span>
          <small>Le telephone demande l empreinte. Premiere fois: PRES est cree et sortie marquee. Ensuite: entree/sortie automatique.</small>
        </button>
      </div>

      {message && <div className="ticket-validation-message">{message}</div>}

      <div className="biometric-summary">
        <article>
          <strong>{presences.length}</strong>
          <span>Enregistrements</span>
        </article>
        <article>
          <strong>{countInside}</strong>
          <span>Dans la salle</span>
        </article>
        <article>
          <strong>{countOutside}</strong>
          <span>Sortis</span>
        </article>
      </div>

      <div className="biometric-list">
        {visiblePresences.length === 0 && (
          <div className="admin-empty">Aucune personne sortie pour le moment.</div>
        )}
        {visiblePresences.map((presence) => {
          const inside = presence.statut === 'dans_salle'
          const Icon = inside ? LogIn : LogOut
          return (
            <article className={inside ? 'inside' : 'outside'} key={presence.id}>
              <div className="biometric-presence-main">
                <span className="biometric-icon"><Fingerprint size={18} /></span>
                <div>
                  <strong>{presence.identifiant}</strong>
                  <small>{presence.nom_appareil || 'Appareil securise'}</small>
                </div>
              </div>
              <span className="biometric-status"><Icon size={16} /> {presence.statut_label}</span>
              <div className="biometric-counts">
                <span>Sorties: {presence.total_sorties}</span>
                <span>Entrees: {presence.total_entrees}</span>
              </div>
              {presence.dernier_mouvement && (
                <small className="biometric-last">
                  Dernier: {presence.dernier_mouvement.type_mouvement_label} par {presence.dernier_mouvement.admin_nom || 'Admin'}
                </small>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default PresenceBiometriqueAdmin
