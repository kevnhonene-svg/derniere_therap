/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Database, FileSpreadsheet, Grid3X3, RefreshCw, Settings, ShieldCheck, SlidersHorizontal, Users, Wine } from 'lucide-react'
import Header from '../../components/Header'
import { api } from '../../services/api'
import AdminStatsExport from './AdminStatsExport'
import BoissonAdmin from './BoissonAdmin'
import ConfigAdmin from './ConfigAdmin'
import InviteAdmin from './InviteAdmin'
import QuotaAdmin from './QuotaAdmin'
import TableAdmin from './TableAdmin'

const sections = [
  { id: 'invites', label: 'Invites', hint: 'Billets, tables et acces', icon: Users },
  { id: 'tables', label: 'Tables', hint: 'Occupation et placement', icon: Grid3X3 },
  { id: 'boissons', label: 'Boissons', hint: 'Stock et categories', icon: Wine },
  { id: 'quotas', label: 'Quotas', hint: 'Regles par billet', icon: SlidersHorizontal },
  { id: 'statistiques', label: 'Stats', hint: 'Exports XLSX filtres', icon: FileSpreadsheet },
  { id: 'configuration', label: 'Configuration', hint: 'Identite de l evenement', icon: Settings },
]

function AdminSpace({ config, setConfig, onLogout, onError }) {
  const [tab, setTab] = useState('invites')
  const [tables, setTables] = useState([])
  const [invites, setInvites] = useState([])
  const [boissons, setBoissons] = useState([])
  const [quotas, setQuotas] = useState([])
  const [indicationsQuotas, setIndicationsQuotas] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((err) => onError(err.message))
  }, [])

  const activeSection = sections.find((section) => section.id === tab) || sections[0]
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

  return (
    <>
      <Header config={config} session={{ user: { username: 'Superadmin' } }} onLogout={onLogout} />
      <main className="admin-space">
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
            <div className="admin-content-head">
              <div>
                <span className="admin-kicker">Module actif</span>
                <h2>{activeSection.label}</h2>
              </div>
              <span className="admin-status-pill">{activeSection.hint}</span>
            </div>
            {tab === 'invites' && <InviteAdmin tables={tables} invites={invites} reload={load} onError={onError} />}
            {tab === 'tables' && <TableAdmin tables={tables} reload={load} onError={onError} />}
            {tab === 'boissons' && <BoissonAdmin boissons={boissons} reload={load} onError={onError} />}
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
