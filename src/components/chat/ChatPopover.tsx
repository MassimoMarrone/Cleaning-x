import { useEffect, useRef, useState } from 'react';
import ChatWidget from '../ChatWidget';

type Conversation = {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string }>;
  lastMessage?: { text?: string; at?: string };
  unreadCount?: number;
};

export default function ChatPopover() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setConversations(data))
      .catch(() => {});
  }, [open, token]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button aria-label="Apri chat" onClick={() => setOpen((v) => !v)} title="Chat" className="icon-button" style={{ position: 'relative' }}>
        💬
        {totalUnread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 10, padding: '0 4px' }}>{totalUnread}</span>
        )}
      </button>
      {open && (
        <div className="popover" style={{ position: 'absolute', right: 0, top: '120%', width: 380, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 30 }}>
          {!activeConvo ? (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>Le tue chat</div>
                <button className="icon-button" onClick={() => setOpen(false)} title="Chiudi">✖</button>
              </div>
              {conversations.length === 0 ? (
                <div style={{ padding: 16, color: '#666' }}>Nessuna conversazione</div>
              ) : conversations.map((c) => (
                <div
                  key={c._id}
                  onClick={async () => {
                    setActiveConvo(c);
                    // segna come letta e aggiorna badge localmente
                    try {
                      await fetch(`/api/chat/conversations/${c._id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                      setConversations((prev) => prev.map((x) => (x._id === c._id ? { ...x, unreadCount: 0 } : x)));
                    } catch {}
                  }}
                  style={{ padding: 12, cursor: 'pointer', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.participants?.map((p) => p.name).join(', ')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage?.text || 'Nuova conversazione'}</div>
                  </div>
                  {c.unreadCount ? (
                    <span style={{ background: '#2d72d9', color: '#fff', borderRadius: 10, fontSize: 10, padding: '0 6px' }}>{c.unreadCount}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderBottom: '1px solid #eee' }}>
                <button onClick={() => setActiveConvo(null)} className="icon-button" title="Indietro">⬅️</button>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeConvo.participants?.map((p) => p.name).join(', ')}
                </div>
              </div>
              <div style={{ padding: 8 }}>
                <ChatWidget conversationId={activeConvo._id} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
