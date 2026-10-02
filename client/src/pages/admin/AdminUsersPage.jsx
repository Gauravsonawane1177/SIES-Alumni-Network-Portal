import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button, Card, ErrorState, Spinner, inputClass } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { q, role, status } });
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

  async function setUserStatus(id, next) {
    try {
      await api.put(`/admin/users/${id}/status`, { status: next });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-maroon-800">Users</h1>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input className={inputClass()} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputClass()} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option>STUDENT</option>
          <option>ALUMNI</option>
          <option>ADMIN</option>
        </select>
        <select className={inputClass()} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>PENDING</option>
          <option>REJECTED</option>
          <option>SUSPENDED</option>
        </select>
        <Button type="submit">Filter</Button>
      </form>
      {loading ? <Spinner /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                  <td className="space-x-2 py-2">
                    <Button variant="ghost" onClick={() => setUserStatus(u.id, 'SUSPENDED')}>Suspend</Button>
                    <Button onClick={() => setUserStatus(u.id, 'ACTIVE')}>Activate</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
