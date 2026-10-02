import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Badge, Button, Card, ErrorState, Spinner } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/users/${id}`)
      .then(({ data }) => setProfile(data.data.user))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!profile) return <Spinner />;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-maroon-800">{profile.full_name}</h1>
          <div className="mt-2 flex gap-2">
            <Badge>{profile.role}</Badge>
            {profile.is_mentor && <Badge tone="gold">Mentor</Badge>}
          </div>
          <p className="mt-3">{profile.job_title} {profile.company && `at ${profile.company}`}</p>
          <p className="text-slate-600">{profile.branch} · {profile.batch_year} · {profile.city}</p>
        </div>
        {profile.id !== user.id && (
          <Button
            onClick={async () => {
              try {
                await api.post('/connections', { addressee_id: profile.id });
                toast.success('Request sent');
              } catch (err) {
                toast.error(err.message);
              }
            }}
          >
            Connect
          </Button>
        )}
      </div>
      <p className="mt-4">{profile.bio}</p>
      <p className="mt-2 text-sm">Skills: {(profile.skills || []).join(', ') || '—'}</p>
    </Card>
  );
}
