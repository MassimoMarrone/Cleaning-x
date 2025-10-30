import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Message = { _id?: string; text: string; sender: string; createdAt?: string };

interface ChatWidgetProps {
  conversationId: string;
}

export default function ChatWidget({ conversationId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const token = localStorage.getItem('token') || '';
  const listRef = useRef<HTMLDivElement | null>(null);
  const [me, setMe] = useState<string>('');
  const [typing, setTyping] = useState<boolean>(false);
  const typingTimeout = useRef<any>(null);

  const socket = useMemo(() => {
    return io('http://localhost:8080', { auth: { token } });
  }, [token]);

  useEffect(() => {
    // recupero profilo per marcare i miei messaggi
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setMe(d?.user?._id || ''))
      .catch(() => {});

    // Carica messaggi esistenti
    const tokenHeader = token ? { Authorization: `Bearer ${token}` } : {} as any;
    fetch(`/api/chat/conversations/${conversationId}/messages`, { headers: { 'Content-Type': 'application/json', ...tokenHeader } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch(() => {});

    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('conversation:join', conversationId);
    });
    socket.on('message:new', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // chat aperta: segna subito come letto
      fetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    });
    socket.on('message:typing', ({ typing }) => setTyping(Boolean(typing)));
    return () => {
      socket.off('message:new');
      socket.off('message:typing');
      socket.disconnect();
    };
  }, [socket, conversationId]);

  useEffect(() => {
    // autoscroll su nuovo messaggio
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    if (!input.trim()) return;
    socketRef.current?.emit('message:send', { conversationId, text: input.trim() });
    setInput('');
    // mark read dopo invio, opzionale
    fetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  };

  const onChange = (v: string) => {
    setInput(v);
    // typing indicator (debounced)
    socketRef.current?.emit('message:typing', { conversationId, typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('message:typing', { conversationId, typing: false });
    }, 800);
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, background: '#fafafa' }}>
      <div ref={listRef} style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 8, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={m._id || i} style={{ display: 'flex', justifyContent: m.sender && me && String(m.sender) === String(me) ? 'flex-end' : 'flex-start', margin: '6px 0' }}>
            <div style={{ maxWidth: '80%', background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '8px 10px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      {typing && <div style={{ color: '#6b7280', fontSize: 12, margin: '4px 0' }}>Sta scrivendo…</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => onChange(e.target.value)} placeholder="Scrivi un messaggio" style={{ flex: 1 }} />
        <button onClick={send}>Invia</button>
      </div>
    </div>
  );
}
