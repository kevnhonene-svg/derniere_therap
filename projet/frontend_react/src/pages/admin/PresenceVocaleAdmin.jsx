import { useEffect, useState } from 'react'
import { AudioLines, LogIn, LogOut, Mic, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { captureVoiceprint } from '../../utils/voiceprint'

function PresenceVocaleAdmin({ onError }) {
  const [presences, setPresences] = useState([])
  const [phrase, setPhrase] = useState('Je confirme ma sortie de la salle')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.presencesVocales()
      setPresences(data.presences || [])
      if (data.phrase_reference) setPhrase(data.phrase_reference)
    } catch (err) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const scanVoice = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError("Le micro n'est pas disponible sur cet appareil.")
      return
    }
    setRecording(true)
    setMessage('')
    try {
      const voiceprint = await captureVoiceprint()
      const data = await api.scannerVoix({
        empreinte_vocale: voiceprint.vector,
        qualite: voiceprint.quality,
      })
      setMessage(data.message || 'Presence vocale mise a jour.')
      await load()
    } catch (err) {
      onError(err.message)
    } finally {
      setRecording(false)
    }
  }

  const sorties = presences.filter((presence) => presence.statut === 'sorti')
  const dedans = presences.filter((presence) => presence.statut === 'dans_salle')

  return (
    <section className="admin-panel voice-panel">
      <div className="admin-panel-head">
        <div>
          <span className="admin-kicker">IA vocale</span>
          <h1>Presence par voix</h1>
        </div>
        <button className="secondary" type="button" onClick={load} disabled={loading}>
          <RefreshCw size={17} />
          <span>{loading ? '...' : 'Actualiser'}</span>
        </button>
      </div>

      <div className="voice-capture">
        <div>
          <AudioLines size={28} />
          <strong>Phrase a prononcer</strong>
          <span>{phrase}</span>
        </div>
        <button type="button" onClick={scanVoice} disabled={recording}>
          {recording ? <span className="spinner" /> : <Mic size={24} />}
          <span>{recording ? 'Ecoute...' : 'Scanner voix'}</span>
          <small>Premiere voix: creation + sortie. Voix reconnue: entree ou sortie.</small>
        </button>
      </div>

      {message && <div className="ticket-validation-message">{message}</div>}

      <div className="voice-summary">
        <article>
          <strong>{presences.length}</strong>
          <span>Voix enregistrees</span>
        </article>
        <article>
          <strong>{sorties.length}</strong>
          <span>Sortis</span>
        </article>
        <article>
          <strong>{dedans.length}</strong>
          <span>Dans la salle</span>
        </article>
      </div>

      <div className="voice-list">
        {sorties.length === 0 && <div className="admin-empty">Aucune personne sortie par voix pour le moment.</div>}
        {sorties.map((presence) => (
          <article key={presence.id}>
            <div>
              <strong>{presence.identifiant}</strong>
              <span>{presence.phrase_reference}</span>
            </div>
            <small><LogOut size={15} /> {presence.statut_label}</small>
            <em>Sorties: {presence.total_sorties} | Entrees: {presence.total_entrees}</em>
            {presence.dernier_mouvement && (
              <p>
                Dernier: {presence.dernier_mouvement.type_mouvement_label}
                {' '}par {presence.dernier_mouvement.admin_nom || 'Admin'}
                {' '}({Math.round((presence.dernier_mouvement.score || 0) * 100)}%)
              </p>
            )}
          </article>
        ))}
      </div>

      {dedans.length > 0 && (
        <div className="voice-inside-note">
          <LogIn size={16} />
          <span>{dedans.length} voix reconnue(s) sont actuellement dans la salle et masquees de la liste principale.</span>
        </div>
      )}
    </section>
  )
}

export default PresenceVocaleAdmin
