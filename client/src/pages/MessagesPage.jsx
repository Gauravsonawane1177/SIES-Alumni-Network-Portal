import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { Card, EmptyState, ErrorState, Spinner, inputClass, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function MessagesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [online, setOnline] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const socket = useMemo(() => connectSocket(), []);

  async function loadConvos() {
    const { data } = await api.get('/messages/conversations');
    setConversations(data.data.conversations);
  }

  async function openThread(otherId) {
    setActive(otherId);
    const { data } = await api.get(`/messages/${otherId}`);
    setThread(data.data.messages);
  }

  useEffect(() => {
    Promise.all([loadConvos(), api.get('/connections?status=ACCEPTED')])
      .then(([, c]) => setConnections(c.data.data.connections))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onMessage(message) {
      if (message.sender_id === active || message.receiver_id === active) {
        setThread((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
      loadConvos();
    }
    function onPresence({ userId, online: isOn }) {
      setOnline((prev) => ({ ...prev, [userId]: isOn }));
    }
    socket.on('receive_message', onMessage);
    socket.on('presence', onPresence);
    return () => {
      socket.off('receive_message', onMessage);
      socket.off('presence', onPresence);
    };
  }, [socket, active]);

  async function send(e) {
    e.preventDefault();
    if (!active || !text.trim()) return;
    socket.emit('send_message', { to: active, content: text.trim() }, (ack) => {
      if (!ack?.success) toast.error(ack?.message || 'Could not send');
    });
    setText('');
  }

  const partnerOptions = connections.map((c) => {
    const id = c.requester_id === user.id ? c.addressee_id : c.requester_id;
    const name = c.requester_id === user.id ? c.addressee_name : c.requester_name;
    return { id, name };
  });

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <Card>
        <h1 className="font-display text-xl text-maroon-800">Messages</h1>
        <label className="mt-3 block text-sm">
          Start a chat
          <select className={`${inputClass()} mt-1`} onChange={(e) => e.target.value && openThread(e.target.value)} defaultValue="">
            <option value="">Select a connection</option>
            {partnerOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <ul className="mt-4 space-y-2">
          {conversations.map((c) => (
            <li key={c.other_id}>
              <button type="button" className="w-full rounded-lg px-2 py-2 text-left hover:bg-maroon-50" onClick={() => openThread(c.other_id)}>
                <div className="flex justify-between">
                  <span className="font-medium">{c.full_name}</span>
                  {c.unread_count > 0 && <span className="text-xs text-maroon-700">{c.unread_count}</span>}
                </div>
                <p className="truncate text-xs text-slate-500">{c.last_content}</p>
              </button>
            </li>
          ))}
          {!conversations.length && <EmptyState title="No conversations" text="Message an accepted connection." />}
        </ul>
      </Card>
      <Card className="flex min-h-[480px] flex-col">
        {!active && <p className="text-slate-500">Select a conversation to begin.</p>}
        {active && (
          <>
            <p className="mb-3 text-sm text-slate-500">{online[active] ? 'Online' : 'Offline'}</p>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {thread.map((m) => (
                <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender_id === user.id ? 'ml-auto bg-maroon-700 text-white' : 'bg-slate-100'}`}>
                  <p>{m.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={send}>
              <input className={inputClass()} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
              <Button type="submit">Send</Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
