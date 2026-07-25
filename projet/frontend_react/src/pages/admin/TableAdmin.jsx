import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import List from '../../components/List'
import { api } from '../../services/api'

function TableAdmin({ tables, reload, onError }) {
  const [form, setForm] = useState({ nom: '', nombre_places: 8, active: true })
  const [open, setOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)

  const openCreate = () => {
    setEditingTable(null)
    setForm({ nom: '', nombre_places: 8, active: true })
    setOpen(true)
  }

  const openEdit = (table) => {
    setEditingTable(table)
    setForm({
      nom: table.nom || '',
      nombre_places: table.nombre_places || 1,
      active: Boolean(table.active),
    })
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      const payload = { ...form, nombre_places: Number(form.nombre_places) }
      if (editingTable) {
        await api.updateTable(editingTable.id, payload)
      } else {
        await api.createTable(payload)
      }
      setEditingTable(null)
      setForm({ nom: '', nombre_places: 8, active: true })
      setOpen(false)
      await reload()
    } catch (err) { onError(err.message) }
  }

  const deleteTable = async (table) => {
    const ok = window.confirm(
      `Voulez-vous vraiment supprimer la table "${table.nom}" ?\n\nCette action est definitive.`
    )
    if (!ok) return
    try {
      await api.deleteTable(table.id)
      await reload()
    } catch (err) { onError(err.message) }
  }

  return <CrudPanel title="Tables" open={open} setOpen={setOpen} onSubmit={submit} buttonLabel="Ajouter une table" formTitle={editingTable ? 'Modifier table' : 'Nouvelle table'} onCreate={openCreate}>
    <div className="modal-fields">
      <label className="field-label">Nom de la table<input required placeholder="TABLE_1" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></label>
      <label className="field-label">Nombre de places<input required type="number" min="1" value={form.nombre_places} onChange={(e) => setForm({ ...form, nombre_places: e.target.value })} /></label>
      <label className="check-row"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Table active</label>
    </div>
    <List items={tables.map((t) => ({ id: t.id, label: t.nom, meta: `${t.places_occupees}/${t.nombre_places} places${t.active ? '' : ' - inactive'}`, raw: t }))} onEdit={openEdit} onDelete={deleteTable} />
  </CrudPanel>
}

export default TableAdmin
