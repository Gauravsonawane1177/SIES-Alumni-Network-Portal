import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function AdminEventsPage() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/admin/events');
      setEvents(data.data.events);
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
      <h1 className="font-display text-3xl text-maroon-800">Event moderation</h1>
      {!events.length && <EmptyState title="No pending events" text="Alumni-created events wait here." />}
      {events.map((event) => (
        <Card key={event.id}>
          <h2 className="font-semibold">{event.title}</h2>
          <p className="text-sm">{event.organizer_name} · {new Date(event.event_date).toLocaleString()}</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={async () => { await api.put(`/admin/events/${event.id}/moderate`, { status: 'APPROVED' }); toast.success('Approved'); load(); }}>Approve</Button>
            <Button variant="ghost" onClick={async () => { await api.put(`/admin/events/${event.id}/moderate`, { status: 'REJECTED' }); load(); }}>Reject</Button>
            <Button variant="danger" onClick={async () => { await api.delete(`/admin/events/${event.id}`); load(); }}>Delete</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
