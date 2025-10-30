import { useEffect, useMemo, useRef, useState } from 'react';
import ChatWidget from '../ChatWidget';

type Conversation = {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string }>;
  lastMessage?: { text?: string; at?: string };
  unreadCount?: number;
};

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [me, setMe] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token') || '';

  // carica profilo per evidenziare il partecipante corrente
  useEffect(() => {
    if (!open) return;
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setMe(d?.user?._id || ''))
      .catch(() => {});
  }, [open, token]);

  // chiudi cliccando fuori
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  // carica lista conversazioni
  const loadConversations = () => {
    return fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
          if (!activeId && data.length > 0) setActiveId(data[0]._id);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!open) return;
    loadConversations();
  }, [open]);

  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0), [conversations]);

  const openConversation = async (id: string) => {
    setActiveId(id);
    try {
      await fetch(`/api/chat/conversations/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setConversations((prev) => prev.map((x) => (x._id === id ? { ...x, unreadCount: 0 } : x)));
    } catch {}
  };

  return (
    <div style={{ position: 'relative' }}>
      <button aria-label="Apri chat" onClick={() => setOpen((v) => !v)} title="Chat" className="icon-button" style={{ position: 'relative' }}>
        💬
        {totalUnread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 10, padding: '0 4px' }}>{totalUnread}</span>
        )}
      </button>
      {open && (
        <div ref={containerRef} className="popover" style={{ position: 'absolute', right: 0, top: '120%', width: 760, height: 520, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 30, display: 'grid', gridTemplateColumns: '280px 1fr' }}>
          {/* colonna sinistra: lista conversazioni */}
          <div style={{ borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>Le tue chat</div>
              <button className="icon-button" onClick={() => setOpen(false)} title="Chiudi">✖</button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: 16, color: '#666' }}>Nessuna conversazione</div>
              ) : (
                conversations.map((c) => {
                  const otherNames = c.participants?.filter((p) => p._id !== me).map((p) => p.name).join(', ') || c.participants?.map((p) => p.name).join(', ');
                  const active = c._id === activeId;
                  return (
                    <div
                      key={c._id}
                      onClick={() => openConversation(c._id)}
                      style={{ padding: 12, cursor: 'pointer', borderBottom: '1px solid #f5f5f5', display: 'flex', flexDirection: 'column', gap: 4, background: active ? '#f3f4f6' : 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{otherNames}</div>
                        {c.unreadCount ? (
                          <span style={{ background: '#2d72d9', color: '#fff', borderRadius: 10, fontSize: 10, padding: '0 6px' }}>{c.unreadCount}</span>
                        ) : null}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage?.text || 'Nuova conversazione'}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* colonna destra: thread messaggi */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conversations.find((x) => x._id === activeId)?.participants?.filter((p) => p._id !== me).map((p) => p.name).join(', ') || 'Seleziona una conversazione'}
              </strong>
            </div>
            <div style={{ padding: 10, flex: 1, minHeight: 0 }}>
              {activeId ? (
                <div style={{ height: '100%' }}>
                  <ChatWidget conversationId={activeId} />
                </div>
              ) : (
                <div style={{ color: '#6b7280' }}>Seleziona una conversazione per vedere i messaggi</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
