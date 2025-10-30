import { useEffect, useState } from 'react';
import ChatWidget from '../components/ChatWidget';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Per test: crea o recupera conversazione con un utente fittizio da query/localStorage
    const token = localStorage.getItem('token') || '';
    const otherUserId = localStorage.getItem('chat_other_user');
    if (!otherUserId) return;
    fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ otherUserId }),
    })
      .then((r) => r.json())
      .then((convo) => setConversationId(convo._id))
      .catch(() => {});
  }, []);

  if (!conversationId) return <div>Seleziona un utente per iniziare una chat (imposta localStorage.chat_other_user)</div>;
  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2>Chat</h2>
      <ChatWidget conversationId={conversationId} />
    </div>
  );
}
