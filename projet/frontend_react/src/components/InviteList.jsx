function InviteList({ invites, onEdit, onDelete }) {
  if (!invites.length) {
    return <div className="admin-empty">Aucun invite enregistre pour le moment.</div>
  }

  return (
    <div className="list invite-list">
      {invites.map((invite) => (
        <article className="invite-row" key={invite.id}>
          <div className="invite-main">
            <div className="invite-avatar">{(invite.nom_complet || '?').slice(0, 1)}</div>
            <div>
              <strong>{invite.nom_complet}</strong>
              <span>{invite.code_billet} - {invite.categorie_billet_label}</span>
              <small>{invite.table?.nom || 'Sans table'}{invite.est_protocole ? ' - Protocole' : ''}{invite.actif ? '' : ' - Inactif'}</small>
            </div>
          </div>
          <div className="row-actions">
            <button className="secondary" type="button" onClick={() => onEdit(invite)}>Modifier</button>
            <button className="danger" type="button" onClick={() => onDelete(invite)}>Supprimer</button>
          </div>
        </article>
      ))}
    </div>
  )
}

export default InviteList
