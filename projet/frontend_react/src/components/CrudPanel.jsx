function CrudPanel({ title, open, setOpen, onSubmit, children, buttonLabel, formTitle, onCreate }) {
  const childrenArray = Array.isArray(children) ? children : [children]
  const formFields = childrenArray[0]
  const listContent = childrenArray.slice(1)

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
          <form className="modal-box admin-modal" onSubmit={onSubmit}>
            <button className="close" type="button" onClick={() => setOpen(false)}>x</button>
            <h2>{formTitle}</h2>
            {formFields}
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setOpen(false)}>Annuler</button>
              <button type="submit">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default CrudPanel
