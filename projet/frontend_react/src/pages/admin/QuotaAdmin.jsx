import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import List from '../../components/List'
import { categories } from '../../constants'
import { api } from '../../services/api'

function QuotaAdmin({ quotas, reload, onError }) {
  const [form, setForm] = useState({ categorie_billet: 'classique', nombre_bouteilles: 1, actif: true })
  const [open, setOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState(null)

  const openCreate = () => {
    setEditingQuota(null)
    setForm({ categorie_billet: 'classique', nombre_bouteilles: 1, actif: true })
    setOpen(true)
  }

  const openEdit = (quota) => {
    setEditingQuota(quota)
    setForm({
      categorie_billet: quota.categorie_billet || 'classique',
      nombre_bouteilles: quota.nombre_bouteilles || 1,
      actif: Boolean(quota.actif),
    })
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      await api.saveQuota({ ...form, nombre_bouteilles: Number(form.nombre_bouteilles) })
      setEditingQuota(null)
      setForm({ categorie_billet: 'classique', nombre_bouteilles: 1, actif: true })
      setOpen(false)
      await reload()
    } catch (err) { onError(err.message) }
  }
  return <CrudPanel title="Quotas par billet" open={open} setOpen={setOpen} onSubmit={submit} buttonLabel="Definir un quota" formTitle={editingQuota ? 'Modifier quota' : 'Quota billet'} onCreate={openCreate}>
    <div className="modal-fields">
      <label className="field-label">Type de billet<select value={form.categorie_billet} onChange={(e) => setForm({ ...form, categorie_billet: e.target.value })}>{categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="field-label">Nombre de bouteilles<input required type="number" min="1" value={form.nombre_bouteilles} onChange={(e) => setForm({ ...form, nombre_bouteilles: e.target.value })} /></label>
      <label className="check-row"><input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Quota actif</label>
    </div>
    <List items={quotas.map((q) => ({ id: q.id, label: q.categorie_billet_label, meta: `${q.nombre_bouteilles} bouteille(s)${q.actif ? '' : ' - inactif'}`, raw: q }))} onEdit={openEdit} />
  </CrudPanel>
}

export default QuotaAdmin
