import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import List from '../../components/List'
import { categories } from '../../constants'
import { api } from '../../services/api'

function QuotaAdmin({ quotas, indicationsQuotas = [], reload, onError }) {
  const [form, setForm] = useState({ categorie_billet: 'classique', nombre_bouteilles: 1, actif: true })
  const [open, setOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState(null)
  const [indicationForm, setIndicationForm] = useState({
    categorie_billet: 'classique',
    titre: 'Quota indicatif',
    nombre_bouteilles_indicatif: 1,
    description: '',
    actif: true,
  })
  const [indicationOpen, setIndicationOpen] = useState(false)
  const [editingIndication, setEditingIndication] = useState(null)

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

  const openCreateIndication = () => {
    setEditingIndication(null)
    setIndicationForm({
      categorie_billet: 'classique',
      titre: 'Quota indicatif',
      nombre_bouteilles_indicatif: 1,
      description: '',
      actif: true,
    })
    setIndicationOpen(true)
  }

  const openEditIndication = (indication) => {
    setEditingIndication(indication)
    setIndicationForm({
      categorie_billet: indication.categorie_billet || 'classique',
      titre: indication.titre || 'Quota indicatif',
      nombre_bouteilles_indicatif: indication.nombre_bouteilles_indicatif || 1,
      description: indication.description || '',
      actif: Boolean(indication.actif),
    })
    setIndicationOpen(true)
  }

  const submitIndication = async (event) => {
    event.preventDefault()
    try {
      await api.saveIndicationQuota({
        ...indicationForm,
        nombre_bouteilles_indicatif: Number(indicationForm.nombre_bouteilles_indicatif),
      })
      setEditingIndication(null)
      setIndicationOpen(false)
      await reload()
    } catch (err) { onError(err.message) }
  }

  return <>
    <CrudPanel title="Quotas par billet" open={open} setOpen={setOpen} onSubmit={submit} buttonLabel="Definir un quota" formTitle={editingQuota ? 'Modifier quota' : 'Quota billet'} onCreate={openCreate}>
      <div className="modal-fields">
        <label className="field-label">Type de billet<select value={form.categorie_billet} onChange={(e) => setForm({ ...form, categorie_billet: e.target.value })}>{categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field-label">Nombre de bouteilles<input required type="number" min="1" value={form.nombre_bouteilles} onChange={(e) => setForm({ ...form, nombre_bouteilles: e.target.value })} /></label>
        <label className="check-row"><input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Quota actif</label>
      </div>
      <List items={quotas.map((q) => ({ id: q.id, label: q.categorie_billet_label, meta: `${q.nombre_bouteilles} bouteille(s)${q.actif ? '' : ' - inactif'}`, raw: q }))} onEdit={openEdit} />
    </CrudPanel>

    <CrudPanel title="Quotas indicatifs" open={indicationOpen} setOpen={setIndicationOpen} onSubmit={submitIndication} buttonLabel="Definir une indication" formTitle={editingIndication ? 'Modifier indication' : 'Indication quota'} onCreate={openCreateIndication}>
      <div className="modal-fields">
        <label className="field-label">Type de billet<select value={indicationForm.categorie_billet} onChange={(e) => setIndicationForm({ ...indicationForm, categorie_billet: e.target.value })}>{categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field-label">Titre<input required value={indicationForm.titre} onChange={(e) => setIndicationForm({ ...indicationForm, titre: e.target.value })} /></label>
        <label className="field-label">Nombre indicatif<input required type="number" min="1" value={indicationForm.nombre_bouteilles_indicatif} onChange={(e) => setIndicationForm({ ...indicationForm, nombre_bouteilles_indicatif: e.target.value })} /></label>
        <label className="field-label">Description<textarea value={indicationForm.description} onChange={(e) => setIndicationForm({ ...indicationForm, description: e.target.value })} /></label>
        <label className="check-row"><input type="checkbox" checked={indicationForm.actif} onChange={(e) => setIndicationForm({ ...indicationForm, actif: e.target.checked })} /> Visible au client</label>
      </div>
      <List items={indicationsQuotas.map((q) => ({ id: q.id, label: q.categorie_billet_label, meta: `${q.titre}: ${q.nombre_bouteilles_indicatif} bouteille(s)${q.actif ? '' : ' - inactif'}`, raw: q }))} onEdit={openEditIndication} />
    </CrudPanel>
  </>
}

export default QuotaAdmin
