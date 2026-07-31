/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, ClipboardList, Database, FileSpreadsheet, Grid3X3, Images, RefreshCw, Settings, ShieldCheck, SlidersHorizontal, TicketCheck, Users, Wine } from 'lucide-react'
import Header from '../../components/Header'
import { api } from '../../services/api'
import AdminStatsExport from './AdminStatsExport'
import BoissonAdmin from './BoissonAdmin'
import ConfigAdmin from './ConfigAdmin'
import GalerieAdmin from './GalerieAdmin'
import InviteAdmin from './InviteAdmin'
import PresenceVocaleAdmin from './PresenceVocaleAdmin'
import QuotaAdmin from './QuotaAdmin'
import TableAdmin from './TableAdmin'
import ValidationBilletAdmin from './ValidationBilletAdmin'

const sections = [
  { id: 'validation', label: 'Validation', hint: 'Controle des billets', icon: TicketCheck },
  { id: 'voix', label: 'Voix', hint: 'Presence vocale IA', icon: AudioLines },
  { id: 'invites', label: 'Invites', hint: 'Billets, tables et acces', icon: Users },
  { id: 'tables', label: 'Tables', hint: 'Occupation et placement', icon: Grid3X3 },
  { id: 'boissons', label: 'Boissons', hint: 'Stock et categories', icon: Wine },
  { id: 'galerie', label: 'Galerie', hint: 'Albums et photos', icon: Images },
  { id: 'quotas', label: 'Quotas', hint: 'Regles par billet', icon: SlidersHorizontal },
  { id: 'statistiques', label: 'Stats', hint: 'Exports XLSX filtres', icon: FileSpreadsheet },
  { id: 'configuration', label: 'Configuration', hint: 'Identite de l evenement', icon: Settings },
]

function AdminSpace({ config, session, setConfig, onLogout, onError }) {
  const [tab, setTab] = useState('invites')
  const [tables, setTables] = useState([])
  const [invites, setInvites] = useState([])
  const [boissons, setBoissons] = useState([])
  const [quotas, setQuotas] = useState([])
  const [indicationsQuotas, setIndicationsQuotas] = useState([])
  const [loading, setLoading] = useState(false)
  const [validationNotifications, setValidationNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const syncingRef = useRef(false)
  const notificationIdsRef = useRef(new Set())
  const notificationsReadyRef = useRef(false)

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const audio = new AudioContext()
      const gain = audio.createGain()
      gain.connect(audio.destination)
      gain.gain.setValueAtTime(0.0001, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 2.6)

      ;[0, 0.45, 0.9, 1.35, 1.8, 2.25].forEach((delay) => {
        const oscillator = audio.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(820, audio.currentTime + delay)
        oscillator.frequency.exponentialRampToValueAtTime(1040, audio.currentTime + delay + 0.16)
        oscillator.connect(gain)
        oscillator.start(audio.currentTime + delay)
        oscillator.stop(audio.currentTime + delay + 0.28)
      })
      window.setTimeout(() => audio.close().catch(() => {}), 2900)
    } catch {
      // Le navigateur peut bloquer le son tant qu'aucune interaction utilisateur n'a eu lieu.
    }
  }

  const loadValidationNotifications = async () => {
    const data = await api.notificationsValidations()
    const notifications = data.notifications || []
    const nextIds = new Set(notifications.map((item) => item.id))
    const newItems = notifications.filter((item) => !notificationIdsRef.current.has(item.id))
    setValidationNotifications(notifications)

    if (notificationsReadyRef.current && newItems.length > 0) {
      setShowNotifications(true)
      playNotificationSound()
    }

    notificationIdsRef.current = nextIds
    notificationsReadyRef.current = true
  }

  const load = async ({ silent = false } = {}) => {
    if (syncingRef.current) return
    syncingRef.current = true
    if (!silent) setLoading(true)
    try {
      const [tableData, inviteData, drinkData, quotaData, indicationQuotaData] = await Promise.all([
        api.tables(),
        api.invites(),
        api.boissonsAdmin(),
        api.quotas(),
        api.indicationsQuotas(),
      ])
      setTables(tableData.tables)
      setInvites(inviteData.invites)
      setBoissons(drinkData.boissons)
      setQuotas(quotaData.quotas)
      setIndicationsQuotas(indicationQuotaData.indications)
    } finally {
      syncingRef.current = false
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((err) => onError(err.message))
    loadValidationNotifications().catch(() => {})

    const interval = window.setInterval(() => {
      if (document.hidden) return
      load({ silent: true }).catch(() => {})
      loadValidationNotifications().catch(() => {})
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  const activeSection = sections.find((section) => section.id === tab) || sections[0]
  const compactAdminView = ['validation', 'voix'].includes(tab)
  const tableSeats = useMemo(() => tables.reduce((acc, table) => acc + Number(table.nombre_places || 0), 0), [tables])
  const occupiedSeats = useMemo(() => tables.reduce((acc, table) => acc + Number(table.places_occupees || 0), 0), [tables])
  const totalStock = useMemo(() => boissons.reduce((acc, drink) => acc + Number(drink.quantite_stock || 0), 0), [boissons])
  const protocols = useMemo(() => invites.filter((invite) => invite.est_protocole).length, [invites])

  const stats = [
    { label: 'Invites', value: invites.length, note: `${protocols} protocoles`, icon: Users },
    { label: 'Tables', value: tables.length, note: `${occupiedSeats}/${tableSeats} places`, icon: Grid3X3 },
    { label: 'Stock boissons', value: totalStock, note: `${boissons.length} references`, icon: Database },
    { label: 'Quotas actifs', value: quotas.length, note: 'Regles billets', icon: ShieldCheck },
  ]

  const groupedValidationNotifications = useMemo(() => {
    const groups = new Map()
    validationNotifications.forEach((item) => {
      const key = item.code_billet
      const current = groups.get(key) || { ...item, personnes: [], admins: new Set() }
      current.personnes.push(item.numero_personne)
      if (item.admin) current.admins.add(item.admin)
      groups.set(key, current)
    })
    return Array.from(groups.values()).map((item) => ({
      ...item,
      personnes: [...new Set(item.personnes)].sort((a, b) => a - b),
      admins: Array.from(item.admins),
    }))
  }, [validationNotifications])

  return (
    <>
      <Header config={config} session={session} onLogout={onLogout} />
      <main className="admin-space">
        {compactAdminView ? (
          <div className="validation-quick-refresh">
            <button className="admin-refresh" type="button" onClick={() => load().catch((err) => onError(err.message))} disabled={loading}>
              <RefreshCw size={18} />
              <span>{loading ? '...' : 'Actualiser'}</span>
            </button>
          </div>
        ) : (
          <section className="admin-hero">
            <div>
              <span className="admin-kicker">Espace administrateur</span>
              <h1>{config?.nom_evenement || 'Administration evenement'}</h1>
              <p>Pilotez les invites, tables, stocks, quotas et parametres depuis un espace clair et organise.</p>
            </div>
            <button className="admin-refresh" type="button" onClick={() => load().catch((err) => onError(err.message))} disabled={loading}>
              <RefreshCw size={18} />
              <span>{loading ? 'Synchronisation...' : 'Actualiser'}</span>
            </button>
          </section>
        )}

        {validationNotifications.length > 0 && (
          <section className="validation-notification-card">
            <button type="button" onClick={() => setShowNotifications((value) => !value)}>
              <TicketCheck size={19} />
              <span>{validationNotifications.length} validation(s) a confirmer</span>
            </button>
            {showNotifications && (
              <div className="validation-notification-list">
                {groupedValidationNotifications.map((item) => (
                  <article key={item.code_billet}>
                    <strong>{item.code_billet}</strong>
                    <span>{item.invite_nom}</span>
                    <small>
                      Table: {item.table} | {item.categorie_billet} | Personne(s) {item.personnes.join(', ')}
                    </small>
                    <em>Premiere validation par {item.admins.join(', ') || 'Admin'}</em>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!compactAdminView && (
          <section className="admin-stats" aria-label="Resume administration">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <article className="admin-stat-card" key={stat.label}>
                  <span className="admin-stat-icon"><Icon size={19} /></span>
                  <div>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                    <small>{stat.note}</small>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        <section className="admin-workspace">
          <aside className="admin-sidebar" aria-label="Navigation admin">
            <div className="admin-sidebar-head">
              <ClipboardList size={18} />
              <span>Gestion</span>
            </div>
            <nav className="admin-nav">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button className={tab === section.id ? 'active' : ''} type="button" onClick={() => setTab(section.id)} key={section.id}>
                    <Icon size={18} />
                    <span>
                      <strong>{section.label}</strong>
                      <small>{section.hint}</small>
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <div className="admin-content">
            {!compactAdminView && (
              <div className="admin-content-head">
                <div>
                  <span className="admin-kicker">Module actif</span>
                  <h2>{activeSection.label}</h2>
                </div>
                <span className="admin-status-pill">{activeSection.hint}</span>
              </div>
            )}
            {tab === 'validation' && <ValidationBilletAdmin invites={invites} onError={onError} />}
            {tab === 'voix' && <PresenceVocaleAdmin onError={onError} />}
            {tab === 'invites' && <InviteAdmin tables={tables} invites={invites} reload={load} onError={onError} />}
            {tab === 'tables' && <TableAdmin tables={tables} reload={load} onError={onError} />}
            {tab === 'boissons' && <BoissonAdmin boissons={boissons} reload={load} onError={onError} />}
            {tab === 'galerie' && <GalerieAdmin onError={onError} />}
            {tab === 'quotas' && <QuotaAdmin quotas={quotas} indicationsQuotas={indicationsQuotas} reload={load} onError={onError} />}
            {tab === 'statistiques' && <AdminStatsExport tables={tables} invites={invites} boissons={boissons} quotas={quotas} onError={onError} />}
            {tab === 'configuration' && <ConfigAdmin config={config} setConfig={setConfig} onError={onError} />}
          </div>
        </section>
      </main>
    </>
  )
}

export default AdminSpace
