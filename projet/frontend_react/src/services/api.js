const API_BASE = '/api'

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData
  const hasBody = Object.prototype.hasOwnProperty.call(options, 'body')
  const body = isForm || typeof options.body === 'string' ? options.body : JSON.stringify(options.body || {})
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
    ...options,
    body: hasBody ? body : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    const message = typeof data.error === 'string' ? data.error : 'Operation impossible'
    if (response.status === 403 && message.includes('superadmin')) {
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
    throw new Error(message)
  }
  return data
}

async function download(path, filename = 'export_admin.xlsx') {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include' })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(typeof data.error === 'string' ? data.error : 'Telechargement impossible')
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = match?.[1] || filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

export const api = {
  getConfig: () => request('/comptes/configuration/'),
  me: () => request('/comptes/me/'),
  loginBillet: (payload) => request('/comptes/login-billet/', { method: 'POST', body: payload }),
  loginAdmin: (payload) => request('/comptes/login-admin/', { method: 'POST', body: payload }),
  logout: () => request('/comptes/logout/', { method: 'POST' }),
  tables: () => request('/comptes/tables/'),
  tablesDisponibles: () => request('/comptes/tables/disponibles/'),
  createTable: (payload) => request('/comptes/tables/', { method: 'POST', body: payload }),
  updateTable: (id, payload) => request(`/comptes/tables/${id}/`, { method: 'PATCH', body: payload }),
  deleteTable: (id) => request(`/comptes/tables/${id}/`, { method: 'DELETE', body: {} }),
  invites: () => request('/comptes/invites/'),
  createInvite: (payload) => request('/comptes/invites/', { method: 'POST', body: payload }),
  updateInvite: (id, payload) => request(`/comptes/invites/${id}/`, { method: 'PATCH', body: payload }),
  deleteInvite: (id) => request(`/comptes/invites/${id}/`, { method: 'DELETE', body: {} }),
  saveConfig: (payload) => request('/comptes/configuration/admin/', { method: 'POST', body: payload }),
  exportXlsx: (params) => download(`/comptes/exports/xlsx/?${params.toString()}`),
  exportRepartitionTables: () => download('/comptes/exports/repartition-tables/', 'repartition_tables.xlsx'),
  boissons: (q = '') => request(`/stock/boissons/${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  boissonsAdmin: () => request('/stock/boissons/admin/'),
  createBoisson: (formData) => request('/stock/boissons/admin/', { method: 'POST', body: formData }),
  updateBoisson: (id, formData) => request(`/stock/boissons/admin/${id}/`, { method: 'PATCH', body: formData }),
  deleteBoisson: (id) => request(`/stock/boissons/admin/${id}/`, { method: 'DELETE', body: {} }),
  quota: () => request('/commandes/quota/'),
  quotas: () => request('/commandes/quotas/'),
  saveQuota: (payload) => request('/commandes/quotas/', { method: 'POST', body: payload }),
  deleteQuota: (id) => request(`/commandes/quotas/${id}/`, { method: 'DELETE', body: {} }),
  indicationsQuotas: () => request('/commandes/quotas/indications/'),
  saveIndicationQuota: (payload) => request('/commandes/quotas/indications/', { method: 'POST', body: payload }),
  deleteIndicationQuota: (id) => request(`/commandes/quotas/indications/${id}/`, { method: 'DELETE', body: {} }),
  commandes: () => request('/commandes/'),
  createCommande: (payload) => request('/commandes/', { method: 'POST', body: payload }),
  updateCommande: (id, payload) => request(`/commandes/${id}/statut/`, { method: 'POST', body: payload }),
  rechercherBillet: (code) => request(`/validation-billets/rechercher/?code=${encodeURIComponent(code)}`),
  validerBillet: (payload) => request('/validation-billets/valider/', { method: 'POST', body: payload }),
  notificationsValidations: () => request('/validation-billets/notifications/'),
  presencesBiometriques: () => request('/presence-biometrique/'),
  optionsPresenceEnregistrement: () => request('/presence-biometrique/enregistrement/options/', { method: 'POST', body: {} }),
  confirmerPresenceEnregistrement: (payload) => request('/presence-biometrique/enregistrement/confirmer/', { method: 'POST', body: payload }),
  optionsPresenceAction: () => request('/presence-biometrique/action/options/', { method: 'POST', body: {} }),
  confirmerPresenceAction: (payload) => request('/presence-biometrique/action/confirmer/', { method: 'POST', body: payload }),
  messages: ({ markRead = false, inviteId = '' } = {}) => {
    const params = new URLSearchParams()
    if (markRead) params.set('mark_read', '1')
    if (inviteId) params.set('invite_id', inviteId)
    return request(`/messages/${params.toString() ? `?${params}` : ''}`)
  },
  sendMessage: (payload) => request('/messages/', { method: 'POST', body: payload }),
}
