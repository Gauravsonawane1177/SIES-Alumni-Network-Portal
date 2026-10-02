import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../components/ui';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.data.notifications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="font-display text-3xl text-maroon-800">Notifications</h1>
        <Button
          variant="ghost"
          onClick={async () => {
            await api.put('/notifications/read-all');
            load();
          }}
        >
          Mark all read
        </Button>
      </div>
      {!items.length && <EmptyState title="No notifications" text="You are all caught up." />}
      {items.map((n) => (
        <Card key={n.id} className={n.is_read ? 'opacity-70' : ''}>
          <h2 className="font-semibold">{n.title}</h2>
          <p className="text-sm text-slate-600">{n.body}</p>
          <div className="mt-2 flex gap-3 text-sm">
            {n.link && <Link className="text-maroon-700" to={n.link}>Open</Link>}
            {!n.is_read && (
              <button
                type="button"
                className="underline"
                onClick={async () => {
                  await api.put(`/notifications/${n.id}/read`);
                  load();
                }}
              >
                Mark read
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
