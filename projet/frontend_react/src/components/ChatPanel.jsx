import { useMemo } from 'react'
import { ArrowLeft, CheckCheck, Send } from 'lucide-react'

function ChatPanel({ messages, value, setValue, send, selectedInvite, setSelectedInvite, sending = false, currentRole = 'client' }) {
  const hasConversationList = Boolean(setSelectedInvite)
  const conversations = useMemo(() => {
    const grouped = new Map()
    messages.forEach((msg) => {
      const current = grouped.get(msg.invite_id) || {
        inviteId: msg.invite_id,
        inviteNom: msg.invite_nom,
        inviteTable: msg.invite_table,
        lastMessage: null,
        unreadCount: 0,
      }
      current.lastMessage = msg
      current.inviteTable = msg.invite_table || current.inviteTable
      if (msg.auteur !== currentRole && !msg.lu) current.unreadCount += 1
      grouped.set(msg.invite_id, current)
    })

    return Array.from(grouped.values()).sort((a, b) => {
      const aTime = a.lastMessage?.cree_le ? new Date(a.lastMessage.cree_le).getTime() : 0
      const bTime = b.lastMessage?.cree_le ? new Date(b.lastMessage.cree_le).getTime() : 0
      return bTime - aTime
    })
  }, [currentRole, messages])
  const selectedConversation = conversations.find((conversation) => String(conversation.inviteId) === String(selectedInvite))
  const visible = hasConversationList
    ? selectedInvite ? messages.filter((m) => String(m.invite_id) === String(selectedInvite)) : []
    : messages
  const showConversationList = hasConversationList && !selectedInvite
  const submit = (event) => {
    event.preventDefault()
    send()
  }

  return (
    <aside className="panel chat">
      <h2>Messages</h2>
      {showConversationList && (
        <div className="conversation-list conversation-list-full">
          <div className="conversation-list-head">
            <strong>Discussions</strong>
            <span>{conversations.length} conversation(s)</span>
          </div>
          {conversations.length === 0 && <span className="conversation-empty">Aucune conversation pour le moment</span>}
          {conversations.map((conversation) => {
            const sentAt = conversation.lastMessage?.cree_le
              ? new Date(conversation.lastMessage.cree_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : ''
            const previewPrefix = conversation.lastMessage?.auteur === currentRole ? 'Vous: ' : ''

            return (
              <button
                className="conversation-item"
                key={conversation.inviteId}
                type="button"
                onClick={() => setSelectedInvite(conversation.inviteId)}
              >
                <span className="conversation-avatar">{conversation.inviteNom?.charAt(0) || '?'}</span>
                <span className="conversation-copy">
                  <strong>{conversation.inviteNom}</strong>
                  <em>{conversation.inviteTable || 'Sans table'}</em>
                  <small>{previewPrefix}{conversation.lastMessage?.contenu}</small>
                </span>
                <span className="conversation-meta">
                  <small>{sentAt}</small>
                  {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {hasConversationList && selectedInvite && (
        <div className="chat-conversation-header">
          <button type="button" onClick={() => setSelectedInvite('')} aria-label="Retour aux conversations">
            <ArrowLeft size={20} />
          </button>
          <span className="conversation-avatar">{selectedConversation?.inviteNom?.charAt(0) || '?'}</span>
          <strong>{selectedConversation?.inviteNom || 'Conversation'} - {selectedConversation?.inviteTable || 'Sans table'}</strong>
        </div>
      )}
      {(!hasConversationList || selectedInvite) && (
        <>
          <div className="chat-log">
            {visible.length === 0 && (
              <p className="chat-empty">
                Vos messages restent prives dans cet espace. Seuls vous et le protocole pouvez suivre cette conversation therapeutique.
              </p>
            )}
            {visible.map((msg) => {
              const isOwn = msg.auteur === currentRole
              const authorLabel = isOwn ? 'Vous' : msg.auteur_label
              const sentAt = msg.cree_le ? new Date(msg.cree_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''

              return (
                <p className={`chat-bubble ${isOwn ? 'mine' : 'theirs'}`} key={msg.id}>
                  <span className="chat-author">{authorLabel}</span>
                  <span className="chat-text">{msg.contenu}</span>
                  <span className="chat-meta">
                    {sentAt}
                    {isOwn && <CheckCheck className={msg.lu ? 'read' : ''} size={17} strokeWidth={2.4} />}
                  </span>
                </p>
              )
            })}
          </div>
          <form className="chat-send" onSubmit={submit}>
            <input disabled={sending} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Message" />
            <button className="chat-send-button loading-button" type="submit" disabled={sending || !value.trim()} aria-label="Envoyer le message">
              {sending && <span className="spinner" />}
              {!sending && <Send size={20} fill="currentColor" />}
            </button>
          </form>
        </>
      )}
    </aside>
  )
}

export default ChatPanel
