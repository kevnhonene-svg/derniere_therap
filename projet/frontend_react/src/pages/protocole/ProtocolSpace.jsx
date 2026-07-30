/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import ChatPanel from '../../components/ChatPanel'
import Header from '../../components/Header'
import { categories, categoryClass } from '../../constants'
import { api } from '../../services/api'

// ─── ICÔNES SVG ───
const Icons = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  glass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8a2 2 0 0 0 2-2v-6H6v6a2 2 0 0 0 2 2z" />
      <path d="M5 13h14" />
      <path d="M12 3v4" />
      <path d="M7 3h10" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  loading: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  quantity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

// ─── COMPOSANT BOUTON ACTION ───
function ActionButton({ icon, label, variant, onClick, disabled }) {
  const variants = {
    validee: 'btn-validate',
    livree: 'btn-deliver',
    en_attente: 'btn-wait',
  }
  
  return (
    <button
      type="button"
      className={`action-btn ${variants[variant] || ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <span className="btn-icon">{icon}</span>
      <span className="btn-label">{label}</span>
    </button>
  )
}

// ─── COMPOSANT BADGE STATUT ───
function StatusBadge({ status, label }) {
  const statusMap = {
    validee: { class: 'status-validated', icon: Icons.check },
    livree: { class: 'status-delivered', icon: Icons.truck },
    en_attente: { class: 'status-pending', icon: Icons.clock },
  }
  
  const config = statusMap[status] || statusMap.en_attente
  
  return (
    <div className={`status-badge ${config.class}`}>
      <span className="status-icon">{config.icon}</span>
      <span>{label}</span>
    </div>
  )
}

// ─── COMPOSANT LIGNE DE COMMANDE ───
function OrderListItem({ commande, onOpen }) {
  const totalBouteilles = commande.lignes.reduce((sum, ligne) => sum + ligne.quantite, 0)

  return (
    <button className="order-list-item" type="button" onClick={() => onOpen(commande.id)}>
      <span className="order-list-avatar">#{commande.id}</span>
      <span className="order-list-copy">
        <strong>{commande.invite.nom_complet}</strong>
        <span className="order-list-sub"><span className="order-qty-box">{totalBouteilles}</span><span>bouteille(s) commandee(s) - {commande.invite.categorie_billet_label}</span></span>
      </span>
      <span className="order-list-meta">
        <StatusBadge status={commande.statut} label={commande.statut_label} />
        {commande.invite.table && <small>Table {commande.invite.table}</small>}
      </span>
    </button>
  )
}
function OrderLine({ ligne }) {
  return (
    <li className="order-line">
      <span className="line-icon">{Icons.glass}</span>
      <span className="line-name">{ligne.boisson.nom}</span>
      <span className="line-qty">
        <span className="qty-icon">{Icons.quantity}</span>
        <span className="qty-label">Quantite commandee</span><span className="qty-value">{ligne.quantite}</span>
      </span>
    </li>
  )
}

// ─── COMPOSANT CARTE COMMANDE ───
function OrderCard({ commande, onUpdate }) {
  const isDelivered = commande.statut === 'livree'
  const isPending = commande.statut === 'en_attente'

  return (
    <article className={`order-card ${categoryClass[commande.invite.categorie_billet] || 'default'}`}>
      <div className="order-header">
        <div className="order-id">
          <span className="id-hash">#</span>
          <span className="id-number">{commande.id}</span>
        </div>
        <StatusBadge status={commande.statut} label={commande.statut_label} />
      </div>
      
      <div className="order-guest">
        <div className="guest-avatar">
          <span className="avatar-icon">{Icons.user}</span>
        </div>
        <div className="guest-info">
          <h3 className="guest-name">{commande.invite.nom_complet}</h3>
          <div className="guest-meta">
            <span className="meta-tag">
              <span className="meta-icon">{Icons.tag}</span>
              {commande.invite.categorie_billet_label}
            </span>
            {commande.invite.table && (
              <span className="meta-table">
                <span className="meta-icon">{Icons.table}</span>
                Table {commande.invite.table}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="order-divider" />

      <ul className="order-lines">
        {commande.lignes.map((ligne) => (
          <OrderLine key={ligne.id} ligne={ligne} />
        ))}
      </ul>

      <div className="order-actions">
        {isDelivered && <span className="order-locked">Commande livree: statut verrouille</span>}
        <ActionButton
          icon={Icons.truck}
          label="Livrer"
          variant="livree"
          onClick={() => onUpdate(commande.id, 'livree')}
          disabled={isDelivered}
        />
        <ActionButton
          icon={Icons.clock}
          label="Attente"
          variant="en_attente"
          onClick={() => onUpdate(commande.id, 'en_attente')}
          disabled={isDelivered || isPending}
        />
      </div>
    </article>
  )
}

// ─── COMPOSANT VIDE ───
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">{Icons.empty}</div>
      <h3>Aucune commande en attente</h3>
      <p>Les nouvelles commandes apparaîtront ici automatiquement</p>
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ───
function ProtocolSpace({ config, session, onLogout, onError }) {
  const [activeView, setActiveView] = useState('commandes')
  const [selectedCommande, setSelectedCommande] = useState(null)
  const [statusFilter, setStatusFilter] = useState('en_attente')
  const [ticketFilter, setTicketFilter] = useState('tous')
  const [tableFilter, setTableFilter] = useState('tous')
  const [commandes, setCommandes] = useState([])
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [selectedInvite, setSelectedInvite] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const load = async ({ markRead = false, inviteId = '' } = {}) => {
    setIsLoading(true)
    try {
      const [cmdData, msgData] = await Promise.all([
        api.commandes(),
        api.messages({ markRead, inviteId })
      ])
      setCommandes(cmdData.commandes)
      setSelectedCommande((current) => current && cmdData.commandes.some((commande) => commande.id === current) ? current : null)
      setMessages(msgData.messages)
      setSelectedInvite((current) => current && msgData.messages.some((msg) => String(msg.invite_id) === String(current)) ? current : '')
      setLastUpdate(new Date())
    } catch (err) {
      onError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) return
      load({ markRead: activeView === 'messages' && Boolean(selectedInvite), inviteId: selectedInvite }).catch((err) => onError(err.message))
    }, 3000)

    return () => window.clearInterval(interval)
  }, [activeView, selectedInvite])

  useEffect(() => {
    if (activeView !== 'messages' || !selectedInvite) return
    load({ markRead: true, inviteId: selectedInvite })
  }, [activeView, selectedInvite])

  const update = async (id, statut) => {
    try {
      await api.updateCommande(id, { statut })
      await load()
    } catch (err) {
      onError(err.message)
    }
  }

  const send = async () => {
    if (!reply.trim() || !selectedInvite) return
    await api.sendMessage({ invite_id: selectedInvite, contenu: reply })
    setReply('')
    await load({ markRead: true, inviteId: selectedInvite })
  }

  const pendingCount = commandes.filter(c => c.statut === 'en_attente').length
  const deliveredCount = commandes.filter(c => c.statut === 'livree').length
  const selectedOrder = commandes.find((commande) => commande.id === selectedCommande)
  const statusOptions = [
    ['en_attente', 'En attente'],
    ['validee', 'Validees'],
    ['livree', 'Livrees'],
    ['annulee', 'Annulees'],
    ['tous', 'Toutes'],
  ]
  const tableOptions = Array.from(
    new Map(
      commandes
        .filter((commande) => commande.invite.table)
        .map((commande) => [commande.invite.table, commande.invite.table])
    ).values()
  ).sort((a, b) => String(a).localeCompare(String(b)))
  const filteredCommandes = commandes.filter((commande) => {
    const matchStatus = statusFilter === 'tous' || commande.statut === statusFilter
    const matchTicket = ticketFilter === 'tous' || commande.invite.categorie_billet === ticketFilter
    const matchTable = tableFilter === 'tous' || String(commande.invite.table || '') === tableFilter
    return matchStatus && matchTicket && matchTable
  })
  const unreadClientMessages = messages.filter((message) => message.auteur === 'client' && !message.lu).length
  const protocolNavItems = [
    { key: 'commandes', label: 'Commandes', icon: Icons.glass, badge: pendingCount },
    { key: 'messages', label: 'Messages', icon: Icons.message, badge: unreadClientMessages },
  ]

  return (
    <>
      <Header config={config} session={session} onLogout={onLogout} />
      
      <section className="protocol-space">
        {/* ─── BARRE DE STATISTIQUES ─── */}
        <div className="stats-bar">
          <div className="stat-card stat-pending">
            <div className="stat-icon">{Icons.clock}</div>
            <div className="stat-content">
              <span className="stat-value">{pendingCount}</span>
              <span className="stat-label">En attente</span>
            </div>
          </div>
          <div className="stat-card stat-delivered">
            <div className="stat-icon">{Icons.truck}</div>
            <div className="stat-content">
              <span className="stat-value">{deliveredCount}</span>
              <span className="stat-label">Validées</span>
            </div>
          </div>
          <div className="stat-card stat-total">
            <div className="stat-icon">{Icons.glass}</div>
            <div className="stat-content">
              <span className="stat-value">{commandes.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          <div className="stat-card stat-refresh" onClick={load}>
            <div className={`stat-icon ${isLoading ? 'spinning' : ''}`}>{Icons.refresh}</div>
            <div className="stat-content">
              <span className="stat-label">Actualiser</span>
              <span className="stat-time">
                {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <nav className="protocol-view-tabs">
          {protocolNavItems.map((item) => (
            <button
              className={activeView === item.key ? 'active' : ''}
              key={item.key}
              type="button"
              onClick={() => { setActiveView(item.key); if (item.key === 'commandes') setSelectedCommande(null) }}
            >
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              {item.badge > 0 && <small>{item.badge}</small>}
            </button>
          ))}
        </nav>

        <div className="work-grid protocol single-view">
          {/* ─── PANNEAU COMMANDES ─── */}
          {activeView === 'commandes' && <div className="panel large orders-panel">
            <div className="panel-header">
              <div className="panel-title">
                <span className="title-icon">{Icons.glass}</span>
                <h1>Commandes à servir</h1>
                {commandes.length > 0 && (
                  <span className="panel-badge">{commandes.length}</span>
                )}
              </div>
            </div>
            
            {!selectedOrder && (
              <div className="order-filters">
                <label>
                  <span>Statut</span>
                  <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setSelectedCommande(null) }}>
                    {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Type de billet</span>
                  <select value={ticketFilter} onChange={(event) => { setTicketFilter(event.target.value); setSelectedCommande(null) }}>
                    <option value="tous">Tous les billets</option>
                    {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Table</span>
                  <select value={tableFilter} onChange={(event) => { setTableFilter(event.target.value); setSelectedCommande(null) }}>
                    <option value="tous">Toutes les tables</option>
                    {tableOptions.map((table) => <option key={table} value={table}>Table {table}</option>)}
                  </select>
                </label>
              </div>
            )}
            {selectedOrder ? (
              <div className="order-detail-view">
                <button className="order-back-button" type="button" onClick={() => setSelectedCommande(null)}>
                  <span>{Icons.back}</span>
                  Retour aux commandes
                </button>
                <OrderCard commande={selectedOrder} onUpdate={update} />
              </div>
            ) : (
              <div className="orders-grid order-list-grid">
                {filteredCommandes.length === 0 ? (
                  <EmptyState />
                ) : (
                  filteredCommandes.map((commande) => (
                    <OrderListItem
                      key={commande.id}
                      commande={commande}
                      onOpen={setSelectedCommande}
                    />
                  ))
                )}
              </div>
            )}
          </div>}

          {/* ─── PANNEAU CHAT ─── */}
          {activeView === 'messages' && <ChatPanel
            messages={messages}
            value={reply}
            setValue={setReply}
            send={send}
            selectedInvite={selectedInvite}
            setSelectedInvite={setSelectedInvite}
            currentRole="protocole"
          />}
        </div>

        <nav className="protocol-bottom-nav">
          {protocolNavItems.map((item) => (
            <button
              className={activeView === item.key ? 'active' : ''}
              key={item.key}
              type="button"
              onClick={() => { setActiveView(item.key); if (item.key === 'commandes') setSelectedCommande(null) }}
            >
              <span>{item.icon}</span>
              {item.badge > 0 && <small>{item.badge}</small>}
              <strong>{item.label}</strong>
            </button>
          ))}
        </nav>
      </section>

      {/* ─── STYLES CSS ─── */}
      <style>{`
        /* ═══════════════════════════════════════
           PROTOCOL SPACE - DESIGN EXTRAORDINAIRE
           ═══════════════════════════════════════ */

        :root {
          --primary: #6366f1;
          --primary-light: #818cf8;
          --primary-dark: #4f46e5;
          --success: #10b981;
          --success-light: #34d399;
          --warning: #f59e0b;
          --warning-light: #fbbf24;
          --danger: #ef4444;
          --info: #3b82f6;
          --dark: #0f172a;
          --darker: #020617;
          --card: #1e293b;
          --card-hover: #334155;
          --border: #334155;
          --text: #f1f5f9;
          --text-muted: #94a3b8;
          --text-dim: #64748b;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
          --shadow-glow: 0 0 20px rgb(99 102 241 / 0.3);
          --radius: 16px;
          --radius-sm: 12px;
          --radius-xs: 8px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .protocol-space {
          min-height: calc(100vh - 64px);
          background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 50%, #1a1a2e 100%);
          padding: 24px 24px 96px;
        }

        /* ─── BARRE DE STATISTIQUES ─── */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: linear-gradient(145deg, var(--card), #252f47);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          opacity: 0;
          transition: var(--transition);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-light);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-pending::before { background: linear-gradient(90deg, var(--warning), var(--warning-light)); }
        .stat-delivered::before { background: linear-gradient(90deg, var(--success), var(--success-light)); }
        .stat-total::before { background: linear-gradient(90deg, var(--primary), var(--primary-light)); }
        .stat-refresh::before { background: linear-gradient(90deg, var(--info), #60a5fa); }

        .stat-refresh {
          cursor: pointer;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon svg {
          width: 24px;
          height: 24px;
        }

        .stat-pending .stat-icon { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
        .stat-delivered .stat-icon { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .stat-total .stat-icon { background: rgba(99, 102, 241, 0.15); color: var(--primary-light); }
        .stat-refresh .stat-icon { background: rgba(59, 130, 246, 0.15); color: var(--info); }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-time {
          font-size: 11px;
          color: var(--text-dim);
          font-family: monospace;
        }

        .protocol-view-tabs {
          display: none;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .protocol-view-tabs button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 54px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: linear-gradient(145deg, var(--card), #252f47);
          color: var(--text-muted);
          font-weight: 800;
          transition: var(--transition);
        }

        .protocol-view-tabs button span {
          display: grid;
          width: 22px;
          height: 22px;
          place-items: center;
        }

        .protocol-view-tabs button svg {
          width: 21px;
          height: 21px;
        }

        .protocol-view-tabs button.active {
          border-color: var(--primary-light);
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: #fff;
          box-shadow: var(--shadow-glow);
        }

        .protocol-view-tabs small,
        .protocol-bottom-nav small {
          display: grid;
          min-width: 26px;
          height: 26px;
          place-items: center;
          border-radius: 999px;
          background: #25d366;
          color: #fff;
          font-size: 14px;
          font-weight: 900;
        }

        .protocol-bottom-nav {
          position: fixed;
          z-index: 30;
          left: 50%;
          bottom: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(150px, 220px));
          gap: 10px;
          width: min(480px, calc(100% - 24px));
          transform: translateX(-50%);
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 22px;
          background: rgba(15, 23, 42, 0.94);
          padding: 8px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(16px);
        }

        .protocol-bottom-nav button {
          position: relative;
          display: grid;
          place-items: center;
          gap: 4px;
          border-radius: 16px;
          background: transparent;
          color: var(--text-muted);
          padding: 9px 6px;
          font-size: 11px;
        }

        .protocol-bottom-nav button.active {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: #fff;
        }

        .protocol-bottom-nav button > span {
          display: grid;
          width: 22px;
          height: 22px;
          place-items: center;
        }

        .protocol-bottom-nav svg {
          width: 22px;
          height: 22px;
        }

        .protocol-bottom-nav small {
          position: absolute;
          top: 4px;
          right: 22%;
        }

        .spinning svg {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ─── GRILLE DE TRAVAIL ─── */
        .work-grid.protocol {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }

        .work-grid.protocol.single-view .chat {
          width: min(920px, 100%);
          margin: 0 auto;
        }

        @media (max-width: 1200px) {
          .work-grid.protocol {
            grid-template-columns: 1fr;
          }
        }

        /* ─── PANNEAU ─── */
        .panel {
          background: linear-gradient(145deg, var(--card), #1a2332);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .panel-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.05), transparent);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .title-icon svg {
          width: 20px;
          height: 20px;
          color: white;
        }

        .panel-title h1 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .panel-badge {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          min-width: 28px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        /* ─── GRILLE COMMANDES ─── */
        .order-filters {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 18px 20px 0;
        }

        .order-filters label {
          display: grid;
          gap: 7px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .order-filters select {
          min-height: 46px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: var(--radius-xs);
          background: #111827;
          color: var(--text);
          padding: 0 12px;
          font-weight: 700;
        }

        .order-filters select:focus {
          outline: 2px solid rgba(99, 102, 241, 0.32);
          border-color: var(--primary-light);
        }
        .orders-grid {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          max-height: calc(100vh - 280px);
          overflow-y: auto;
        }

        .orders-grid::-webkit-scrollbar {
          width: 6px;
        }

        .orders-grid::-webkit-scrollbar-track {
          background: transparent;
        }

        .orders-grid::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        /* ─── CARTE COMMANDE ─── */
        .order-list-grid {
          grid-template-columns: 1fr;
          gap: 8px;
          max-height: calc(100vh - 280px);
        }

        .order-list-item {
          position: relative;
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          width: 100%;
          min-height: 76px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: var(--radius-sm);
          background: linear-gradient(145deg, #252f47, #1e293b);
          color: var(--text);
          padding: 12px 14px;
          text-align: left;
          transition: var(--transition);
        }

        .order-list-item:hover {
          transform: translateY(-2px);
          border-color: var(--primary-light);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }

        .order-list-avatar {
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: #fff;
          font-family: monospace;
          font-weight: 900;
          box-shadow: 0 5px 14px rgba(99, 102, 241, 0.28);
        }

        .order-list-copy {
          display: grid;
          min-width: 0;
          gap: 5px;
        }

        .order-list-copy strong,
        .order-list-copy small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .order-list-copy strong {
          color: var(--text);
          font-size: 16px;
        }

        .order-list-sub {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .order-qty-box {
          display: grid;
          min-width: 38px;
          height: 34px;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: #fff;
          font-size: 20px;
          font-weight: 950;
          line-height: 1;
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.32);
        }

        .order-list-copy small,
        .order-list-meta small {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .order-list-meta {
          display: grid;
          justify-items: end;
          gap: 7px;
        }

        .order-detail-view {
          display: grid;
          gap: 14px;
          padding: 20px;
          max-width: 720px;
          margin: 0 auto;
        }

        .order-back-button {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          gap: 8px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text);
          padding: 10px 14px;
          font-weight: 800;
        }

        .order-back-button span,
        .order-back-button svg {
          width: 18px;
          height: 18px;
        }
        .order-card {
          background: linear-gradient(145deg, #252f47, #1e293b);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 20px;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
        }

        .order-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          transition: var(--transition);
        }

        .order-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          border-color: var(--primary-light);
        }

        /* Catégories billet - bande colorée gauche */
        .order-card.vip::after { background: linear-gradient(180deg, #f59e0b, #d97706); }
        .order-card.premium::after { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
        .order-card.standard::after { background: linear-gradient(180deg, #3b82f6, #2563eb); }
        .order-card.default::after { background: linear-gradient(180deg, var(--primary), var(--primary-dark)); }

        .order-card.vip { border-left-color: #f59e0b; }
        .order-card.premium { border-left-color: #8b5cf6; }
        .order-card.standard { border-left-color: #3b82f6; }

        /* En-tête carte */
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .order-id {
          display: flex;
          align-items: baseline;
          gap: 2px;
          font-family: 'SF Mono', monospace;
        }

        .id-hash {
          color: var(--text-dim);
          font-size: 14px;
        }

        .id-number {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary-light);
          text-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
        }

        /* Badge statut */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-icon svg {
          width: 14px;
          height: 14px;
        }

        .status-validated {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-delivered {
          background: rgba(59, 130, 246, 0.15);
          color: var(--info);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        /* Info invité */
        .order-guest {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .guest-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .avatar-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .guest-info {
          flex: 1;
          min-width: 0;
        }

        .guest-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .guest-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-tag, .meta-table {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: 1px solid rgba(251, 191, 36, 0.34);
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.92);
          color: #f8fafc;
          padding: 5px 10px;
          font-size: 13px;
          font-weight: 850;
        }

        .meta-icon svg {
          width: 12px;
          height: 12px;
        }

        /* Séparateur */
        .order-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
          margin: 0 -20px 16px -20px;
        }

        /* Lignes de commande */
        .order-lines {
          list-style: none;
          margin: 0 0 16px 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .order-line {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-xs);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: var(--transition);
        }

        .order-line:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .line-icon {
          color: var(--primary-light);
          opacity: 0.7;
        }

        .line-icon svg {
          width: 16px;
          height: 16px;
        }

        .line-name {
          flex: 1;
          font-size: 14px;
          color: var(--text);
          font-weight: 500;
        }

        .line-qty {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(249, 115, 22, 0.12));
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 8px 10px;
          border-radius: 12px;
        }

        .qty-icon {
          color: var(--primary-light);
        }

        .qty-icon svg {
          width: 12px;
          height: 12px;
        }

        .qty-label {
          color: #fbbf24;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .qty-value {
          display: grid;
          min-width: 42px;
          height: 36px;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: #fff;
          font-size: 22px;
          font-weight: 950;
          line-height: 1;
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.3);
        }

        /* Actions */
        .order-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .order-locked {
          grid-column: 1 / -1;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-xs);
          background: rgba(59, 130, 246, 0.12);
          color: var(--info);
          padding: 10px 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }

        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-icon svg {
          width: 20px;
          height: 20px;
          transition: var(--transition);
        }

        .btn-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-validate {
          border-color: rgba(16, 185, 129, 0.3);
          color: var(--success);
        }

        .btn-validate:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--success);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .btn-deliver {
          border-color: rgba(59, 130, 246, 0.3);
          color: var(--info);
        }

        .btn-deliver:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--info);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .btn-wait {
          border-color: rgba(245, 158, 11, 0.3);
          color: var(--warning);
        }

        .btn-wait:hover:not(:disabled) {
          background: rgba(245, 158, 11, 0.15);
          border-color: var(--warning);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        /* ─── ÉTAT VIDE ─── */
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          border: 2px dashed var(--border);
        }

        .empty-icon svg {
          width: 40px;
          height: 40px;
          color: var(--text-dim);
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--text-dim);
          margin: 0;
        }

        /* ─── ANIMATIONS ─── */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .order-card {
          animation: fadeInUp 0.4s ease-out forwards;
        }

        .order-card:nth-child(1) { animation-delay: 0.05s; }
        .order-card:nth-child(2) { animation-delay: 0.1s; }
        .order-card:nth-child(3) { animation-delay: 0.15s; }
        .order-card:nth-child(4) { animation-delay: 0.2s; }
        .order-card:nth-child(5) { animation-delay: 0.25s; }
        .order-card:nth-child(6) { animation-delay: 0.3s; }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.2); }
          50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
        }

        .stat-card.stat-refresh:hover .stat-icon {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
          .protocol-space {
            padding: 12px 12px 96px;
          }

.stats-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .orders-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }
          
          .order-actions {
            grid-template-columns: 1fr;
          }
          
          .action-btn {
            flex-direction: row;
            justify-content: center;
            padding: 10px;
          }
        }
      `}</style>
    </>
  )
}

export default ProtocolSpace
