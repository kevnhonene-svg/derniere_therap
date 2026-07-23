import { useState } from 'react'
import CrudPanel from '../../components/CrudPanel'
import { api } from '../../services/api'

function ConfigAdmin({ config, setConfig, onError }) {
  const [form, setForm] = useState(config)
  const [open, setOpen] = useState(false)

  const openConfig = () => {
    setForm(config)
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    try { const data = await api.saveConfig(form); setConfig(data.configuration); setOpen(false) } catch (err) { onError(err.message) }
  }
  return <CrudPanel title="Configuration" open={open} setOpen={setOpen} onSubmit={submit} buttonLabel="Modifier la configuration" formTitle="Configuration generale" onCreate={openConfig}>
    <div className="modal-fields">
      <label className="field-label">Nom de l application<input required value={form.nom_application || ''} onChange={(e) => setForm({ ...form, nom_application: e.target.value })} /></label>
      <label className="field-label">Nom de l evenement<input required value={form.nom_evenement || ''} onChange={(e) => setForm({ ...form, nom_evenement: e.target.value })} /></label>
      <label className="field-label field-wide">Sous-titre<input value={form.sous_titre || ''} onChange={(e) => setForm({ ...form, sous_titre: e.target.value })} /></label>
      <label className="field-label field-wide">Notice client<textarea value={form.notice_client || ''} onChange={(e) => setForm({ ...form, notice_client: e.target.value })} /></label>
    </div>
  </CrudPanel>
}

export default ConfigAdmin
