import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, ErrorState, Spinner } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function EventDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get(`/events/${id}`);
      setPayload(data.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!payload) return <Spinner />;
  const { event, has_rsvp, remaining_seats } = payload;

  return (
    <Card>
      <h1 className="font-display text-3xl text-maroon-800">{event.title}</h1>
      <p className="mt-2">{new Date(event.event_date).toLocaleString()} · {event.location}</p>
      <p className="mt-4 whitespace-pre-wrap">{event.description}</p>
      <p className="mt-3 text-sm">{remaining_seats} seats remaining ({event.rsvp_count}/{event.capacity})</p>
      {event.status === 'APPROVED' && (
        <div className="mt-4">
          {has_rsvp ? (
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await api.delete(`/events/${id}/rsvp`);
                  toast.success('RSVP cancelled');
                  load();
                } catch (err) {
                  toast.error(err.message);
                }
              }}
            >
              Cancel RSVP
            </Button>
          ) : (
            <Button
              disabled={remaining_seats <= 0}
              onClick={async () => {
                try {
                  await api.post(`/events/${id}/rsvp`);
                  toast.success('RSVP confirmed');
                  load();
                } catch (err) {
                  toast.error(err.message);
                }
              }}
            >
              {remaining_seats <= 0 ? 'Event full' : 'RSVP'}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
