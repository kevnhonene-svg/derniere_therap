import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import List from '../../components/List'
import { api } from '../../services/api'

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const PHOTO_MAX_DIMENSION = 1200

const compressPhoto = (file) => new Promise((resolve, reject) => {
  if (!(file instanceof File) || !file.name || !file.type.startsWith('image/')) {
    resolve(file)
    return
  }

  const image = new Image()
  const url = URL.createObjectURL(file)

  image.onload = () => {
    URL.revokeObjectURL(url)
    const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Compression de la photo impossible'))
        return
      }
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
      resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }))
    }, 'image/webp', 0.82)
  }

  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('Photo invalide'))
  }

  image.src = url
})

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
    try {
      const formData = new FormData(formElement)
      formData.set('actif', form.actif ? 'true' : 'false')
      const photo = formData.get('photo')
      let data = Object.fromEntries(formData.entries())
      data.actif = form.actif

      if (photo instanceof File && !photo.name) {
        delete data.photo
      } else if (photo instanceof File) {
        const compressedPhoto = await compressPhoto(photo)
        if (compressedPhoto.size > MAX_PHOTO_SIZE) {
          onError('La photo est trop lourde. Choisissez une image plus legere.')
          return
        }
        data = formData
        data.set('photo', compressedPhoto)
      }

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

  const remove = async (boisson) => {
    const ok = window.confirm(`Voulez-vous vraiment supprimer cette boisson ?\n\nNom: ${boisson.nom}\n\nCette action est definitive.`)
    if (!ok) return
    try {
      await api.deleteBoisson(boisson.id)
      await reload()
    } catch (err) {
      onError(err.message)
    }
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
    <List items={boissons.map((b) => ({ id: b.id, label: b.nom, meta: `stock ${b.quantite_stock}${b.categorie ? ` - ${b.categorie}` : ''}${b.actif ? '' : ' - inactive'}`, raw: b }))} onEdit={openEdit} onDelete={remove} />
  </CrudPanel>
}

export default BoissonAdmin
