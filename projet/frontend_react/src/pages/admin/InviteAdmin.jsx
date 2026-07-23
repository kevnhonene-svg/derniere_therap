import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import InviteList from '../../components/InviteList'
import { categories } from '../../constants'
import { api } from '../../services/api'

function InviteAdmin({ tables, invites, reload, onError }) {
  const emptyForm = { nom: '', postnom: '', prenom: '', telephone: '', email: '', code_billet: '', categorie_billet: 'classique', table_id: '', est_protocole: false, actif: true }
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [editingInvite, setEditingInvite] = useState(null)
  const [search, setSearch] = useState('')
  const [codeAlert, setCodeAlert] = useState(false)

  const filteredInvites = invites.filter((invite) => {
    const value = [
      invite.nom_complet,
      invite.code_billet,
      invite.telephone,
      invite.email,
      invite.categorie_billet_label,
      invite.table?.nom,
    ].join(' ').toLowerCase()
    return value.includes(search.trim().toLowerCase())
  })

  const openCreate = () => {
    setEditingInvite(null)
    setForm(emptyForm)
    setCodeAlert(false)
    setOpen(true)
  }

  const openEdit = (invite) => {
    setEditingInvite(invite)
    setCodeAlert(false)
    setForm({
      nom: invite.nom || '',
      postnom: invite.postnom || '',
      prenom: invite.prenom || '',
      telephone: invite.telephone || '',
      email: invite.email || '',
      code_billet: invite.code_billet || '',
      categorie_billet: invite.categorie_billet || 'classique',
      table_id: invite.table?.id || '',
      est_protocole: Boolean(invite.est_protocole),
      actif: Boolean(invite.actif),
    })
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      const payload = { ...form, table_id: form.table_id || null }
      const codeExists = invites.some((invite) => (
        invite.code_billet?.trim().toLowerCase() === payload.code_billet.trim().toLowerCase()
        && invite.id !== editingInvite?.id
      ))
      if (codeExists) {
        setCodeAlert(true)
        return
      }
      if (editingInvite) {
        await api.updateInvite(editingInvite.id, payload)
      } else {
        await api.createInvite(payload)
      }
      setEditingInvite(null)
      setForm(emptyForm)
      setOpen(false)
      await reload()
    } catch (err) {
      onError(err.message)
    }
  }

  const tableOptions = tables
    .filter((table) => !table.est_pleine || String(table.id) === String(form.table_id))
    .map((table) => {
      return {
        ...table,
        label: `${table.nom} (${table.places_occupees}/${table.nombre_places} personnes)`,
      }
    })

  const remove = async (invite) => {
    const ok = window.confirm(`Voulez-vous vraiment supprimer cet invite ?\n\nNom: ${invite.nom_complet}\nCode billet: ${invite.code_billet}\n\nCette action est definitive.`)
    if (!ok) return
    try {
      await api.deleteInvite(invite.id)
      await reload()
    } catch (err) {
      onError(err.message)
    }
  }

  return <CrudPanel title="Invites" open={open} setOpen={setOpen} onSubmit={submit} buttonLabel="Ajouter un invite" formTitle={editingInvite ? 'Modifier invite' : 'Nouvel invite'} onCreate={openCreate}>
    <div className="modal-fields">
      {codeAlert && (
        <div className="admin-inline-alert">
          <strong>Code billet deja utilise</strong>
          <span>Ce code billet existe deja. Veuillez saisir un autre code avant d enregistrer cet invite.</span>
        </div>
      )}
      <label className="field-label">Nom<input required placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></label>
      <label className="field-label">Postnom<input placeholder="Postnom" value={form.postnom} onChange={(e) => setForm({ ...form, postnom: e.target.value })} /></label>
      <label className="field-label">Prenom<input placeholder="Prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></label>
      <label className="field-label">Telephone<input placeholder="Telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></label>
      <label className="field-label">Email<input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="field-label">Code billet<input required placeholder="Code billet" value={form.code_billet} onChange={(e) => { setCodeAlert(false); setForm({ ...form, code_billet: e.target.value }) }} /></label>
      <label className="field-label">Type de billet<select value={form.categorie_billet} onChange={(e) => setForm({ ...form, categorie_billet: e.target.value })}>{categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="field-label">Table<select value={form.table_id} onChange={(e) => setForm({ ...form, table_id: e.target.value })}><option value="">Sans table</option>{tableOptions.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
      <label className="check-row"><input type="checkbox" checked={form.est_protocole} onChange={(e) => setForm({ ...form, est_protocole: e.target.checked })} /> Protocole</label>
      <label className="check-row"><input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Actif</label>
    </div>
    <div className="admin-list-tools">
      <input type="search" placeholder="Rechercher un invite, code billet, telephone, table..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <span>{filteredInvites.length}/{invites.length}</span>
    </div>
    <InviteList invites={filteredInvites} onEdit={openEdit} onDelete={remove} />
  </CrudPanel>
}

export default InviteAdmin
