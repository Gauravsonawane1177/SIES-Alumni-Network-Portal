import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function AdminVerificationPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/admin/verification');
      setUsers(data.data.users);
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
      await api.put(`/admin/verification/${id}/${action}`);
      toast.success(`Alumni ${action}d`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-maroon-800">Alumni verification</h1>
      {!users.length && <EmptyState title="No pending alumni" text="New alumni registrations appear here." />}
      {users.map((u) => (
        <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{u.full_name}</p>
            <p className="text-sm text-slate-600">{u.email} · {u.company} · {u.batch_year}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => act(u.id, 'approve')}>Approve</Button>
            <Button variant="danger" onClick={() => act(u.id, 'reject')}>Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
