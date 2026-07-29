import { useMemo, useState } from 'react'
import { BarChart3, Download, Eye, FileSpreadsheet, Filter, Grid3X3, X } from 'lucide-react'
import { categories, categoryClass } from '../../constants'
import { api } from '../../services/api'

const modules = [
  ['all', 'Toutes les donnees'],
  ['invites', 'Invites'],
  ['tables', 'Tables'],
  ['boissons', 'Boissons'],
  ['quotas', 'Quotas'],
  ['commandes', 'Commandes'],
  ['messages', 'Messages'],
]

const statusOptions = [
  ['en_attente', 'En attente'],
  ['livree', 'Livree'],
  ['annulee', 'Annulee'],
]

function AdminStatsExport({ tables, invites, boissons, quotas, onError }) {
  const [exporting, setExporting] = useState(false)
  const [exportingTables, setExportingTables] = useState(false)
  const [showTablePlan, setShowTablePlan] = useState(false)
  const [filters, setFilters] = useState({
    module: 'all',
    search: '',
    categorie_billet: '',
    table_id: '',
    actif: '',
    est_protocole: '',
    has_table: '',
    active: '',
    full: '',
    stock: '',
    statut: '',
    auteur: '',
    lu: '',
    date_from: '',
    date_to: '',
  })

  const exportStats = useMemo(() => {
    const assigned = invites.filter((invite) => invite.table).length
    const protocols = invites.filter((invite) => invite.est_protocole).length
    const lowStock = boissons.filter((drink) => Number(drink.quantite_stock || 0) <= Number(drink.seuil_alerte || 0)).length
    return [
      { label: 'Invites exportables', value: invites.length, detail: `${assigned} avec table` },
      { label: 'Protocoles', value: protocols, detail: 'contacts operationnels' },
      { label: 'Boissons', value: boissons.length, detail: `${lowStock} stock faible` },
      { label: 'Quotas', value: quotas.length, detail: 'regles disponibles' },
    ]
  }, [boissons, invites, quotas])

  const tablePlan = useMemo(() => {
    const placeCount = (invite) => ['vip_couple', 'vip_premium'].includes(invite.categorie_billet) ? 2 : 1
    const grouped = tables
      .map((table) => {
        const occupants = invites
          .filter((invite) => invite.table?.id === table.id)
          .sort((a, b) => a.nom_complet.localeCompare(b.nom_complet))
          .map((invite) => ({ ...invite, places_table: placeCount(invite) }))
        const occupied = occupants.reduce((total, invite) => total + invite.places_table, 0)
        return {
          ...table,
          occupants,
          places_occupees_vue: occupied,
          places_restantes_vue: Math.max(Number(table.nombre_places || 0) - occupied, 0),
        }
      })
      .sort((a, b) => a.nom.localeCompare(b.nom))

    const sansTable = invites
      .filter((invite) => !invite.table)
      .sort((a, b) => a.nom_complet.localeCompare(b.nom_complet))
      .map((invite) => ({ ...invite, places_table: placeCount(invite) }))

    return { tables: grouped, sansTable }
  }, [invites, tables])

  const setValue = (name, value) => setFilters((current) => ({ ...current, [name]: value }))

  const submit = async (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') params.set(key, value)
    })
    setExporting(true)
    try {
      await api.exportXlsx(params)
    } catch (err) {
      onError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const exportTablePlan = async () => {
    setExportingTables(true)
    try {
      await api.exportRepartitionTables()
    } catch (err) {
      onError(err.message)
    } finally {
      setExportingTables(false)
    }
  }

  return (
    <section className="admin-panel export-panel">
      <div className="admin-panel-head">
        <div>
          <span className="admin-kicker">Statistiques</span>
          <h1>Exports XLSX</h1>
        </div>
        <span className="export-badge"><FileSpreadsheet size={17} /> Generation backend</span>
      </div>

      <div className="export-stats">
        {exportStats.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>

      <div className="table-plan-export">
        <div>
          <span className="admin-kicker">Plan de salle</span>
          <h2>Repartition des tables</h2>
          <p>Consultez ou generez un fichier separe avec chaque table, ses codes billets, ses occupants et les places restantes.</p>
        </div>
        <div className="table-plan-actions">
          <button className="secondary" type="button" onClick={() => setShowTablePlan(true)}>
            <Eye size={18} />
            <span>Voir repartition</span>
          </button>
          <button className="admin-primary" type="button" onClick={exportTablePlan} disabled={exportingTables}>
            {exportingTables ? <BarChart3 size={18} /> : <Grid3X3 size={18} />}
            <span>{exportingTables ? 'Generation...' : 'Exporter tables'}</span>
          </button>
        </div>
      </div>

      {showTablePlan && (
        <div className="table-plan-view">
          <div className="table-plan-view-head">
            <div>
              <span className="admin-kicker">Affichage direct</span>
              <h2>Repartition des tables</h2>
            </div>
            <button className="secondary" type="button" onClick={() => setShowTablePlan(false)}>
              <X size={18} />
              <span>Fermer</span>
            </button>
          </div>

          <div className="table-plan-grid">
            {tablePlan.tables.map((table) => (
              <article className={`table-plan-card ${table.active ? '' : 'inactive'}`} key={table.id}>
                <header>
                  <div>
                    <strong>{table.nom}</strong>
                    <span>{table.occupants.length} invite(s)</span>
                  </div>
                  <small>{table.places_occupees_vue}/{table.nombre_places} places</small>
                </header>
                <div className="table-plan-meter">
                  <span style={{ width: `${Math.min((table.places_occupees_vue / Math.max(Number(table.nombre_places || 1), 1)) * 100, 100)}%` }} />
                </div>
                <div className="table-plan-summary">
                  <span>Occupees: {table.places_occupees_vue}</span>
                  <span>Restantes: {table.places_restantes_vue}</span>
                </div>

                {table.occupants.length > 0 ? (
                  <div className="table-occupants">
                    {table.occupants.map((invite) => (
                      <div className="table-occupant-row" key={invite.id}>
                        <div>
                          <strong>{invite.nom_complet}</strong>
                          <span>{invite.code_billet}</span>
                        </div>
                        <small className={categoryClass[invite.categorie_billet] || ''}>{invite.categorie_billet_label}</small>
                        <em>{invite.places_table} place(s)</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="table-plan-empty">Aucun invite affecte.</p>
                )}
              </article>
            ))}
          </div>

          {tablePlan.sansTable.length > 0 && (
            <section className="table-plan-unassigned">
              <h3>Invites sans table</h3>
              <div className="table-occupants">
                {tablePlan.sansTable.map((invite) => (
                  <div className="table-occupant-row" key={invite.id}>
                    <div>
                      <strong>{invite.nom_complet}</strong>
                      <span>{invite.code_billet}</span>
                    </div>
                    <small className={categoryClass[invite.categorie_billet] || ''}>{invite.categorie_billet_label}</small>
                    <em>{invite.places_table} place(s)</em>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <form className="export-form" onSubmit={submit}>
        <div className="export-form-title">
          <Filter size={18} />
          <span>Filtres d export</span>
        </div>

        <label className="field-label">Donnees a exporter
          <select value={filters.module} onChange={(e) => setValue('module', e.target.value)}>
            {modules.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="field-label">Recherche globale
          <input type="search" placeholder="Nom, code billet, table, note, message..." value={filters.search} onChange={(e) => setValue('search', e.target.value)} />
        </label>

        <label className="field-label">Type de billet
          <select value={filters.categorie_billet} onChange={(e) => setValue('categorie_billet', e.target.value)}>
            <option value="">Tous</option>
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="field-label">Table assignee
          <select value={filters.table_id} onChange={(e) => setValue('table_id', e.target.value)}>
            <option value="">Toutes</option>
            {tables.map((table) => <option key={table.id} value={table.id}>{table.nom}</option>)}
          </select>
        </label>

        <label className="field-label">Invite actif
          <select value={filters.actif} onChange={(e) => setValue('actif', e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </label>

        <label className="field-label">Role protocole
          <select value={filters.est_protocole} onChange={(e) => setValue('est_protocole', e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Protocoles</option>
            <option value="false">Clients simples</option>
          </select>
        </label>

        <label className="field-label">Presence table
          <select value={filters.has_table} onChange={(e) => setValue('has_table', e.target.value)}>
            <option value="">Tous</option>
            <option value="oui">Avec table</option>
            <option value="non">Sans table</option>
          </select>
        </label>

        <label className="field-label">Table active
          <select value={filters.active} onChange={(e) => setValue('active', e.target.value)}>
            <option value="">Toutes</option>
            <option value="true">Actives</option>
            <option value="false">Inactives</option>
          </select>
        </label>

        <label className="field-label">Occupation table
          <select value={filters.full} onChange={(e) => setValue('full', e.target.value)}>
            <option value="">Toutes</option>
            <option value="oui">Pleines</option>
            <option value="non">Disponibles</option>
          </select>
        </label>

        <label className="field-label">Stock boisson
          <select value={filters.stock} onChange={(e) => setValue('stock', e.target.value)}>
            <option value="">Tous</option>
            <option value="disponible">Disponible</option>
            <option value="faible">Stock faible</option>
            <option value="rupture">Rupture</option>
          </select>
        </label>

        <label className="field-label">Statut commande
          <select value={filters.statut} onChange={(e) => setValue('statut', e.target.value)}>
            <option value="">Tous</option>
            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="field-label">Auteur message
          <select value={filters.auteur} onChange={(e) => setValue('auteur', e.target.value)}>
            <option value="">Tous</option>
            <option value="client">Client</option>
            <option value="protocole">Protocole</option>
          </select>
        </label>

        <label className="field-label">Lecture message
          <select value={filters.lu} onChange={(e) => setValue('lu', e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Lus</option>
            <option value="false">Non lus</option>
          </select>
        </label>

        <label className="field-label">Date debut
          <input type="date" value={filters.date_from} onChange={(e) => setValue('date_from', e.target.value)} />
        </label>

        <label className="field-label">Date fin
          <input type="date" value={filters.date_to} onChange={(e) => setValue('date_to', e.target.value)} />
        </label>

        <div className="export-actions">
          <button className="secondary" type="button" onClick={() => setFilters({
            module: 'all',
            search: '',
            categorie_billet: '',
            table_id: '',
            actif: '',
            est_protocole: '',
            has_table: '',
            active: '',
            full: '',
            stock: '',
            statut: '',
            auteur: '',
            lu: '',
            date_from: '',
            date_to: '',
          })}>Reinitialiser</button>
          <button className="admin-primary" type="submit" disabled={exporting}>
            {exporting ? <BarChart3 size={18} /> : <Download size={18} />}
            <span>{exporting ? 'Generation...' : 'Exporter en XLSX'}</span>
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminStatsExport
