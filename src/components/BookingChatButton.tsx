import { useEffect, useRef, useState } from 'react';
import ChatWidget from './ChatWidget';

type Props = {
  otherUserId: string;
  bookingId?: string;
};

export default function BookingChatButton({ otherUserId, bookingId }: Props) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  const ensureConversation = async () => {
    if (conversationId) return true;
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ otherUserId, bookingId }),
    });
    if (!res.ok) return false;
    const convo = await res.json();
    setConversationId(convo._id);
    return true;
  };

  const handleClick = async () => {
    const ok = await ensureConversation();
    if (ok) {
      setOpen((v) => !v);
      try {
        const token = localStorage.getItem('token') || '';
        const cid = conversationId || '';
        if (cid) {
          await fetch(`/api/chat/conversations/${cid}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        }
      } catch {}
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="btn-secondary" onClick={handleClick} title="Chatta">
        💬 Chatta
      </button>
      {open && conversationId && (
        <div style={{ position: 'absolute', zIndex: 30, right: 0, top: '110%', width: 360, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Chat</strong>
            <button className="icon-button" onClick={() => setOpen(false)} title="Chiudi">✖</button>
          </div>
          <div style={{ padding: 8 }}>
            <ChatWidget conversationId={conversationId} />
          </div>
        </div>
      )}
    </div>
  );
}
