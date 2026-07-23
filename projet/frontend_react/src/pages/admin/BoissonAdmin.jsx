import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import List from '../../components/List'
import { api } from '../../services/api'

function BoissonAdmin({ boissons, reload, onError }) {
  const [form, setForm] = useState({ nom: '', quantite_stock: 0, categorie: '', description: '', prix_indicatif: 0, seuil_alerte: 5, actif: true })
  const [open, setOpen] = useState(false)
  const [editingBoisson, setEditingBoisson] = useState(null)

  const emptyForm = { nom: '', quantite_stock: 0, categorie: '', description: '', prix_indicatif: 0, seuil_alerte: 5, actif: true }

  const openCreate = () => {
    setEditingBoisson(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (boisson) => {
    setEditingBoisson(boisson)
    setForm({
      nom: boisson.nom || '',
      quantite_stock: boisson.quantite_stock || 0,
      categorie: boisson.categorie || '',
      description: boisson.description || '',
      prix_indicatif: boisson.prix_indicatif || 0,
      seuil_alerte: boisson.seuil_alerte || 5,
      actif: Boolean(boisson.actif),
    })
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const data = new FormData(formElement)
    data.set('actif', form.actif ? 'true' : 'false')
    const photo = data.get('photo')
    if (photo instanceof File && !photo.name) {
      data.delete('photo')
    }
    try {
      if (editingBoisson) {
        await api.updateBoisson(editingBoisson.id, data)
      } else {
        await api.createBoisson(data)
      }
      setEditingBoisson(null)
      setForm(emptyForm)
      formElement.reset()
      setOpen(false)
      await reload()
    } catch (err) { onError(err.message) }
  }
  return <CrudPanel title="Boissons" open={open} setOpen={setOpen} onSubmit={submit} buttonLabel="Ajouter une boisson" formTitle={editingBoisson ? 'Modifier boisson' : 'Nouvelle boisson'} onCreate={openCreate}>
    <div className="modal-fields">
      <label className="field-label">Nom de la boisson<input required name="nom" placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></label>
      <label className="field-label">Categorie<input name="categorie" placeholder="Categorie" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} /></label>
      <label className="field-label">Stock disponible<input required name="quantite_stock" type="number" min="0" placeholder="Stock" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: e.target.value })} /></label>
      <label className="field-label">Prix indicatif<input name="prix_indicatif" type="number" min="0" step="0.01" value={form.prix_indicatif} onChange={(e) => setForm({ ...form, prix_indicatif: e.target.value })} /></label>
      <label className="field-label">Seuil d alerte<input name="seuil_alerte" type="number" min="0" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} /></label>
      <label className="field-label field-wide">Description<textarea name="description" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label className="field-label field-wide">Photo<input name="photo" type="file" accept="image/*" /></label>
      <label className="check-row"><input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Boisson active</label>
    </div>
    <List items={boissons.map((b) => ({ id: b.id, label: b.nom, meta: `stock ${b.quantite_stock}${b.categorie ? ` - ${b.categorie}` : ''}${b.actif ? '' : ' - inactive'}`, raw: b }))} onEdit={openEdit} />
  </CrudPanel>
}

export default BoissonAdmin
