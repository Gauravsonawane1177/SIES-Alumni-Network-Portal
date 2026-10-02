import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Badge, Card, EmptyState, ErrorState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/events')
      .then(({ data }) => setEvents(data.data.events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="font-display text-3xl text-maroon-800">Events</h1>
        {(user.role === 'ALUMNI' || user.role === 'ADMIN') && (
          <Link className="rounded-lg bg-maroon-700 px-4 py-2 text-sm font-semibold text-white" to="/events/create">
            Create event
          </Link>
        )}
      </div>
      {!events.length && <EmptyState title="No events" text="Approved events will appear here." />}
      {events.map((event) => (
        <Card key={event.id}>
          <div className="flex justify-between">
            <Link className="font-display text-xl text-maroon-800" to={`/events/${event.id}`}>
              {event.title}
            </Link>
            <Badge>{event.status}</Badge>
          </div>
          <p className="text-slate-600">{new Date(event.event_date).toLocaleString()} · {event.location}</p>
          <p className="text-sm">{event.rsvp_count}/{event.capacity} seats filled</p>
        </Card>
      ))}
    </div>
  );
}
