import { useState } from 'react'

function CrudPanel({ title, open, setOpen, onSubmit, children, buttonLabel, formTitle, onCreate }) {
  const [saving, setSaving] = useState(false)
  const childrenArray = Array.isArray(children) ? children : [children]
  const formFields = childrenArray[0]
  const listContent = childrenArray.slice(1)

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await onSubmit(event)
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    if (!saving) setOpen(false)
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <span className="admin-kicker">Gestion</span>
          <h1>{title}</h1>
        </div>
        <button className="admin-primary" type="button" onClick={onCreate || (() => setOpen(true))}>{buttonLabel}</button>
      </div>
      {listContent}
      {open && (
        <div className="modal">
          <form className="modal-box admin-modal" onSubmit={submit}>
            <button className="close" type="button" onClick={close} disabled={saving}>x</button>
            <h2>{formTitle}</h2>
            {formFields}
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={close} disabled={saving}>Annuler</button>
              <button className="loading-button" type="submit" disabled={saving}>
                {saving && <span className="spinner" />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default CrudPanel
