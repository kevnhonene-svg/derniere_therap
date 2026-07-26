/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import ChatPanel from '../../components/ChatPanel'
import Header from '../../components/Header'
import { api } from '../../services/api'
import {
  AlertCircle,
  Beer,
  Coffee,
  GlassWater,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShoppingCart,
  User,
  Wine,
  XCircle,
} from 'lucide-react'

function ClientSpace({ config, session, onLogout, onError }) {
  const [activeView, setActiveView] = useState('accueil')
  const [boissons, setBoissons] = useState([])
  const [quota, setQuota] = useState({ restant: 0, utilise: 0 })
  const [cart, setCart] = useState({})
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(() => localStorage.getItem('notice-vue') !== 'oui')
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const load = async ({ silent = false, markRead = false } = {}) => {
    if (!silent) setIsLoading(true)
    try {
      const shouldRefreshDrinks = !silent || activeView === 'boissons'
      const [drinkData, quotaData, msgData] = await Promise.all([
        shouldRefreshDrinks ? api.boissons(search) : Promise.resolve(null),
        api.quota(),
        api.messages({ markRead }),
      ])
      if (drinkData) setBoissons(drinkData.boissons)
      setQuota(quotaData)
      setMessages(msgData.messages)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    load().catch((err) => onError(err.message))
  }, [search])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) return
      load({ silent: true, markRead: activeView === 'messages' }).catch((err) => onError(err.message))
    }, 4000)

    return () => window.clearInterval(interval)
  }, [activeView, search])

  useEffect(() => {
    if (activeView !== 'messages') return
    load({ silent: true, markRead: true }).catch((err) => onError(err.message))
  }, [activeView])

  const totalCart = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const unreadProtocolMessages = messages.filter((msg) => msg.auteur === 'protocole' && !msg.lu).length
  const cartItems = Object.entries(cart)
    .map(([id, quantite]) => ({
      boisson: boissons.find((item) => String(item.id) === String(id)),
      quantite,
    }))
    .filter((item) => item.boisson)

  const navItems = [
    { key: 'accueil', label: 'Accueil', icon: User },
    { key: 'boissons', label: 'Boissons', icon: Package },
    { key: 'panier', label: 'Panier', icon: ShoppingCart, badge: totalCart },
    { key: 'messages', label: 'Messages', icon: MessageCircle, badge: unreadProtocolMessages },
  ]

  const add = (id) => {
    if (totalCart >= quota.restant) {
      return onError(`Vous avez encore ${quota.restant} bouteille(s) possible(s).`)
    }
    setCart((old) => ({ ...old, [id]: (old[id] || 0) + 1 }))
  }

  const remove = (id) => {
    setCart((old) => {
      const next = { ...old }
      if (next[id] > 1) next[id] -= 1
      else delete next[id]
      return next
    })
  }

  const order = async () => {
    setIsOrdering(true)
    try {
      const lignes = Object.entries(cart).map(([boisson_id, quantite]) => ({ boisson_id, quantite }))
      await api.createCommande({ lignes })
      setCart({})
      await load({ markRead: activeView === 'messages' })
      onError('Commande validée avec succès.')
      setActiveView('accueil')
    } catch (err) {
      onError(err.message)
    } finally {
      setIsOrdering(false)
    }
  }

  const send = async () => {
    if (!message.trim()) return
    setIsSending(true)
    try {
      await api.sendMessage({ contenu: message })
      setMessage('')
      const msgData = await api.messages({ markRead: activeView === 'messages' })
      setMessages(msgData.messages)
    } catch (err) {
      onError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  const getDrinkIcon = (categorie) => {
    const icons = {
      bière: Beer,
      vin: Wine,
      eau: GlassWater,
      soft: Coffee,
      spiritueux: Wine,
    }
    const Icon = icons[categorie?.toLowerCase()] || Coffee
    return <Icon size={24} />
  }

  return (
    <div className="client-space">
      <Header config={config} session={session} onLogout={onLogout} />

      {notice && (
        <div className="notice-banner">
          <div className="notice-content">
            <AlertCircle size={24} className="notice-icon" />
            <p>{config.notice_client}</p>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('notice-vue', 'oui')
                setNotice(false)
              }}
              className="notice-btn"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      <div className="client-layout">
        <aside className="client-sidebar">
          <div className="sidebar-card">
            <p className="sidebar-label">Espace client</p>
            <strong>{session.invite.nom_complet}</strong>
            <span>{session.invite.categorie_billet_label}</span>
          </div>
          <nav className="client-nav">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={`client-nav-button ${activeView === item.key ? 'active' : ''}`}
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge > 0 && <small>{item.badge}</small>}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="client-content">
          {activeView === 'accueil' && (
            <section className="dashboard-section">
              <div className="section-heading">
                <p>Bienvenue</p>
                <h1>{config.nom_application}</h1>
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-card user-info">
                  <div className="card-icon"><User size={32} /></div>
                  <div className="card-content">
                    <p className="card-label">{session.invite.categorie_billet_label}</p>
                    <h2 className="card-title">{config.nom_evenement}</h2>
                    <p className="card-subtitle">{config.sous_titre}</p>
                  </div>
                </div>

                <div className="dashboard-card quota-info">
                  <div className="card-icon"><Package size={32} /></div>
                  <div className="card-content">
                    <p className="card-label">Votre quota</p>
                    <div className="quota-stats">
                      <div className="quota-item">
                        <span className="quota-value">{quota.restant}</span>
                        <span className="quota-label">Restantes</span>
                      </div>
                      <div className="quota-divider" />
                      <div className="quota-item">
                        <span className="quota-value">{quota.utilise}</span>
                        <span className="quota-label">Utilisées</span>
                      </div>
                    </div>
                    <div className="quota-progress">
                      <div
                        className="quota-progress-bar"
                        style={{ width: `${quota.utilise + quota.restant ? (quota.utilise / (quota.utilise + quota.restant)) * 100 : 0}%` }}
                      />
                    </div>
                    {quota.indication_quota && (
                      <div className="quota-indication">
                        <span>{quota.indication_quota.titre}</span>
                        <strong>{quota.indication_quota.nombre_bouteilles_indicatif} bouteille(s)</strong>
                        {quota.indication_quota.description && <p>{quota.indication_quota.description}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dashboard-card cart-info">
                  <div className="card-icon"><ShoppingCart size={32} /></div>
                  <div className="card-content">
                    <p className="card-label">Votre panier</p>
                    <div className="cart-summary">
                      <span className="cart-count">{totalCart}</span>
                      <span className="cart-label">bouteille(s) sélectionnée(s)</span>
                    </div>
                    <button type="button" disabled={!totalCart} onClick={() => setActiveView('panier')} className="order-btn">
                      Voir le panier
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeView === 'boissons' && (
            <section className="catalogue-section">
              <div  className="catalogue-header sticky-search-header">

                <div className="search-wrapper">
                  <Search size={20} className="search-icon" />
                  <input
                    disabled={isLoading}
                    className="search-input"
                    placeholder="Rechercher une boisson..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
               
              </div>

              <div className="drink-grid">
                {isLoading && <div className="catalogue-state"><span className="spinner" />Chargement des boissons...</div>}
                {!isLoading && boissons.length === 0 && <div className="catalogue-state empty">Aucune boisson disponible pour le moment.</div>}
                {!isLoading && boissons.map((boisson) => {
                  const inCart = cart[boisson.id] || 0
                  return (
                    <article className="drink-card" key={boisson.id}>
                      <div className="drink-image">
                        {boisson.photo ? <img src={boisson.photo} alt={boisson.nom} /> : <div className="drink-placeholder">{getDrinkIcon(boisson.categorie)}</div>}
                        <span className={`drink-status ${boisson.est_disponible ? 'available' : 'unavailable'}`}>
                          {boisson.est_disponible ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>
                      <div className="drink-content">
                        <h3 className="drink-name">{boisson.nom}</h3>
                        <p className="drink-description">{boisson.description || boisson.categorie}</p>
                        <div className="drink-footer">
                          <div className="drink-actions">
                            {inCart > 0 && <button type="button" onClick={() => remove(boisson.id)} className="qty-btn remove"><XCircle size={20} /></button>}
                            <span className="qty-display">{inCart > 0 && inCart}</span>
                            <button type="button" disabled={!boisson.est_disponible || totalCart >= quota.restant} onClick={() => add(boisson.id)} className="add-btn">
                              <Plus size={20} />
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {activeView === 'panier' && (
            <section className="cart-section">
              <div className="catalogue-header">
                <h2 className="section-title">Votre panier</h2>
                <button type="button" className="ghost-btn" onClick={() => setActiveView('boissons')}>Ajouter des boissons</button>
              </div>
              <div className="cart-panel">
                <div className="cart-total-card">
                  <span>{totalCart} bouteille(s) dans le panier</span>
                  <button type="button" disabled={!totalCart || isOrdering} onClick={order} className="order-btn">
                    {isOrdering && <span className="spinner" />}
                    {isOrdering ? 'Commande en cours...' : 'Confirmer la commande'}
                  </button>
                </div>
                {cartItems.length === 0 && <div className="catalogue-state empty">Votre panier est vide.</div>}
                {cartItems.map(({ boisson, quantite }) => (
                  <article className="cart-line" key={boisson.id}>
                    <div className="cart-line-icon">{getDrinkIcon(boisson.categorie)}</div>
                    <div>
                      <strong>{boisson.nom}</strong>
                      <span>{boisson.categorie || 'Boisson'}</span>
                    </div>
                    <div className="cart-line-actions">
                      <button type="button" className="qty-btn remove" onClick={() => remove(boisson.id)}><XCircle size={20} /></button>
                      <strong>{quantite}</strong>
                      <button type="button" className="add-btn icon-only" disabled={totalCart >= quota.restant} onClick={() => add(boisson.id)}><Plus size={20} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeView === 'messages' && (
            <section className="chat-section">
              <div className="chat-container">
                <div className="chat-header">
                  <MessageCircle size={24} />
                  <h3>Messages en direct avec le service protocolaire</h3>
                  <span className="chat-badge">{unreadProtocolMessages || messages.length}</span>
                </div>
                <ChatPanel messages={messages} value={message} setValue={setMessage} send={send} sending={isSending} currentRole={session.role} />
              </div>
            </section>
          )}
        </div>
      </div>

      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button className={activeView === item.key ? 'active' : ''} key={item.key} type="button" onClick={() => setActiveView(item.key)}>
              <Icon size={22} />
              {item.badge > 0 && <small>{item.badge}</small>}
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <style jsx>{`
        .client-space { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: clamp(12px, 2vw, 22px); scroll-behavior: smooth; }
        .client-layout { display: grid; grid-template-columns: clamp(230px, 21vw, 280px) minmax(0, 1fr); gap: clamp(16px, 2vw, 26px); width: min(1320px, 100%); margin: 0 auto; align-items: start; }
        .client-sidebar { position: sticky; top: 84px; display: grid; gap: 14px; min-width: 0; }
        .sidebar-card, .client-nav { background: rgba(255,255,255,.92); border: 1px solid rgba(255,255,255,.8); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,.08); backdrop-filter: blur(14px); }
        .sidebar-card { padding: 18px; display: grid; gap: 4px; }
        .sidebar-card strong { color: #2d3748; font-size: 18px; }
        .sidebar-card span, .sidebar-label { color: #718096; margin: 0; }
        .sidebar-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .client-nav { display: grid; gap: 6px; padding: 10px; }
        .client-nav-button { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; border: none; border-radius: 14px; background: transparent; color: #4a5568; padding: 12px; text-align: left; cursor: pointer; transition: background .2s, color .2s, transform .2s; }
        .client-nav-button:hover, .client-nav-button.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; transform: translateX(2px); }
        .client-nav-button small, .mobile-bottom-nav small { min-width: 20px; height: 20px; border-radius: 999px; background: #fc8181; color: white; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
        .client-content { min-width: 0; display: grid; gap: clamp(16px, 2vw, 24px); }
        .section-heading { margin-bottom: clamp(14px, 2vw, 20px); }
        .section-heading p { margin: 0 0 4px; color: #667eea; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; }
        .section-heading h1 { margin: 0; color: #2d3748; font-size: clamp(24px, 3vw, 34px); line-height: 1.12; }
        .mobile-bottom-nav { display: none; }
        .notice-banner { width: min(1320px, 100%); margin: 0 auto clamp(16px, 2vw, 24px); background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 4px; box-shadow: 0 10px 40px rgba(102,126,234,.3); }
        .notice-content { background: rgba(255,255,255,.95); border-radius: 12px; padding: clamp(14px, 2vw, 18px) clamp(16px, 2.4vw, 24px); display: flex; align-items: center; gap: 16px; backdrop-filter: blur(10px); }
        .notice-icon { color: #667eea; flex-shrink: 0; }
        .notice-content p { flex: 1; margin: 0; color: #2d3748; font-weight: 500; }
        .notice-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 8px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: transform .2s; }
        .notice-btn:hover { transform: scale(1.05); }
        .dashboard-section, .catalogue-section, .cart-section { margin: 0; min-width: 0; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr)); gap: clamp(14px, 2vw, 22px); }
        .dashboard-card { min-width: 0; background: white; border-radius: 20px; padding: clamp(18px, 2.2vw, 24px); display: flex; align-items: flex-start; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.08); transition: transform .22s ease, box-shadow .22s ease; }
        .dashboard-card:hover, .drink-card:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(0,0,0,.12); }
        .card-icon, .cart-line-icon { background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); color: #667eea; display: grid; place-items: center; }
        .card-icon { padding: 12px; border-radius: 14px; }
        .card-content { flex: 1; }
        .card-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a0aec0; font-weight: 600; margin: 0 0 4px; }
        .card-title { font-size: clamp(18px, 2vw, 21px); font-weight: 700; color: #2d3748; margin: 0 0 4px; overflow-wrap: anywhere; }
        .card-subtitle, .cart-label, .drink-description, .drink-stock, .cart-line span { color: #718096; }
        .quota-stats { display: flex; align-items: center; gap: 12px; margin: 8px 0 12px; }
        .quota-item { display: flex; flex-direction: column; align-items: center; }
        .quota-value, .cart-count { font-size: 28px; font-weight: 700; color: #2d3748; }
        .cart-count { font-size: 32px; color: #667eea; }
        .quota-label { font-size: 12px; color: #a0aec0; }
        .quota-divider { width: 2px; height: 30px; background: #e2e8f0; }
        .quota-progress { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-top: 8px; }
        .quota-progress-bar { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 3px; transition: width .5s ease; }
        .quota-indication { margin-top: 12px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; color: #4a5568; font-size: 13px; }
        .quota-indication span, .quota-indication strong { display: block; }
        .quota-indication span { color: #a0aec0; font-size: 11px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; }
        .quota-indication strong { color: #2d3748; margin-top: 2px; }
        .quota-indication p { margin: 6px 0 0; color: #718096; line-height: 1.35; }
        .cart-summary { display: flex; align-items: baseline; gap: 8px; margin: 8px 0 12px; }
        .order-btn, .add-btn { border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform .2s, opacity .2s; }
        .order-btn { width: 100%; padding: 12px; border-radius: 12px; }
        .add-btn { padding: 6px 16px; border-radius: 8px; font-size: 13px; }
        .order-btn:hover:not(:disabled), .add-btn:hover:not(:disabled) { transform: scale(1.02); }
        .order-btn:disabled, .add-btn:disabled { opacity: .5; cursor: not-allowed; }
        .catalogue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: clamp(16px, 2vw, 24px); flex-wrap: wrap; gap: 16px; min-width: 0; }
        .sticky-search-header { position: sticky; top: 82px; z-index: 18; margin-top: 0; margin-bottom: 12px; padding: 0 0 8px; background: transparent; backdrop-filter: none; }
        .section-title { font-size: clamp(20px, 2.4vw, 25px); font-weight: 700; color: #2d3748; margin: 0; line-height: 1.16; }
        .search-wrapper { position: relative; display: flex; align-items: center; flex: 1 1 100%; width: 100%; max-width: 100%; min-width: min(100%, 240px); margin-left: 0; }
        .search-icon { position: absolute; left: 13px; top: 50%; z-index: 1; transform: translateY(-50%); color: #a0aec0; pointer-events: none; }
        .search-input { box-sizing: border-box; display: block; width: 100%; height: 46px; padding: 0 12px 0 42px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; line-height: 46px; transition: border-color .2s; background: white; }
        .search-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,.1); }
        .drink-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: clamp(14px, 2vw, 24px); }
        .catalogue-state { grid-column: 1 / -1; min-height: 160px; background: white; border-radius: 20px; color: #718096; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .catalogue-state .spinner { border-color: rgba(102,126,234,.2); border-top-color: #667eea; }
        .catalogue-state.empty { color: #a0aec0; }
        .drink-card, .cart-line, .cart-total-card, .chat-container { background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .drink-card { min-width: 0; overflow: hidden; transition: transform .22s ease, box-shadow .22s ease; }
        .drink-image { position: relative; height: clamp(150px, 18vw, 190px); background: #f7fafc; display: flex; align-items: center; justify-content: center; }
        .drink-image img { width: 100%; height: 100%; object-fit: cover; }
        .drink-placeholder { color: #a0aec0; display: flex; align-items: center; justify-content: center; }
        .drink-status { position: absolute; top: 12px; right: 12px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
        .drink-status.available { background: #48bb78; color: white; }
        .drink-status.unavailable { background: #fc8181; color: white; }
        .drink-content { padding: 16px; }
        .drink-name { font-size: 18px; font-weight: 600; color: #2d3748; margin: 0 0 4px; }
        .drink-description { font-size: 14px; margin: 0 0 12px; }
        .drink-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .drink-stock, .drink-actions, .cart-line-actions { display: flex; align-items: center; gap: 8px; }
        .drink-stock { font-size: 13px; }
        .qty-btn { border: none; background: none; color: #fc8181; cursor: pointer; padding: 4px; display: flex; transition: transform .2s; }
        .qty-btn:hover { transform: scale(1.2); }
        .qty-display { font-weight: 600; color: #2d3748; min-width: 20px; text-align: center; }
        .cart-panel { display: grid; gap: 14px; }
        .cart-line, .cart-total-card { padding: 16px; }
        .cart-line { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 14px; min-width: 0; }
        .cart-line-icon { width: 46px; height: 46px; border-radius: 14px; }
        .cart-line strong, .cart-line span { display: block; }
        .cart-line span { font-size: 14px; }
        .icon-only { padding: 7px; }
        .ghost-btn { border: 2px solid #e2e8f0; background: white; color: #667eea; border-radius: 12px; font-weight: 700; padding: 10px 14px; }
        .cart-total-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 260px); gap: 14px; align-items: center; }
        .cart-total-card span { color: #2d3748; font-weight: 700; }
        .chat-section { margin: 0; }
        .chat-container { overflow: hidden; }
        .chat-header { padding: 16px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; gap: 12px; }
        .chat-header h3 { margin: 0; flex: 1; font-weight: 600; }
        .chat-badge { background: rgba(255,255,255,.2); padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        @media (max-width: 900px) {
          .client-space { padding: 12px 12px 96px; }
          .client-layout { display: block; }
          .client-sidebar { display: none; }
          .mobile-bottom-nav { position: fixed; z-index: 20; left: 12px; right: 12px; bottom: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 8px; border-radius: 22px; background: rgba(255,255,255,.94); box-shadow: 0 18px 50px rgba(0,0,0,.2); backdrop-filter: blur(16px); }
          .mobile-bottom-nav button { position: relative; display: grid; place-items: center; gap: 3px; border: none; border-radius: 16px; background: transparent; color: #718096; padding: 8px 4px; font-size: 11px; font-weight: 700; }
          .mobile-bottom-nav button.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .mobile-bottom-nav small { position: absolute; top: 2px; right: 16%; }
          .dashboard-card { flex-direction: column; }
          .dashboard-grid, .drink-grid, .cart-line, .cart-total-card { grid-template-columns: 1fr; }
          .catalogue-header { flex-direction: column; align-items: stretch; }
          .sticky-search-header { top: 62px; margin-top: 0; margin-bottom: 10px; padding: 0 0 8px; }
          .search-wrapper { width: 100%; max-width: 100%; margin-left: 0; }
          .cart-line-actions { justify-content: flex-start; }
        }
      `}</style>
    </div>
  )
}

export default ClientSpace
