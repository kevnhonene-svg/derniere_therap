function List({ items, onEdit }) {
  if (!items.length) {
    return <div className="admin-empty">Aucune donnee disponible pour le moment.</div>
  }

  return (
    <div className="list admin-simple-list">
      {items.map((item) => (
        <span key={item.id || item.label || item}>
          <b>{item.label || item}</b>
          {item.meta && <small>{item.meta}</small>}
          {onEdit && <button className="secondary" type="button" onClick={() => onEdit(item.raw || item)}>Modifier</button>}
        </span>
      ))}
    </div>
  )
}

export default List
