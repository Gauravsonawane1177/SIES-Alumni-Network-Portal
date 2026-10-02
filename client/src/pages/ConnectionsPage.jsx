import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/connections');
      setRows(data.data.connections);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id, action) {
    try {
      await api.put(`/connections/${id}/${action}`);
      toast.success(`Request ${action}ed`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const incoming = rows.filter((c) => c.addressee_id === user.id && c.status === 'PENDING');
  const accepted = rows.filter((c) => c.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-maroon-800">Connections</h1>
      <Card>
        <h2 className="font-display text-xl">Incoming requests</h2>
        {!incoming.length && <EmptyState title="No pending requests" text="When someone connects, they appear here." />}
        <ul className="mt-3 space-y-3">
          {incoming.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3">
              <span>{c.requester_name}</span>
              <div className="flex gap-2">
                <Button onClick={() => act(c.id, 'accept')}>Accept</Button>
                <Button variant="ghost" onClick={() => act(c.id, 'reject')}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Your network</h2>
        {!accepted.length && <p className="mt-2 text-slate-500">No accepted connections yet.</p>}
        <ul className="mt-3 space-y-2">
          {accepted.map((c) => {
            const otherId = c.requester_id === user.id ? c.addressee_id : c.requester_id;
            const otherName = c.requester_id === user.id ? c.addressee_name : c.requester_name;
            return (
              <li key={c.id} className="flex justify-between">
                <Link className="text-maroon-700" to={`/users/${otherId}`}>{otherName}</Link>
                <Link to="/messages">Message</Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
