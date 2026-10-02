import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card } from '../components/ui';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <img
            src={user.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6B1C23&color=fff`}
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <h1 className="font-display text-3xl text-maroon-800">{user.full_name}</h1>
            <p>{user.email}</p>
            <div className="mt-2 flex gap-2">
              <Badge>{user.role}</Badge>
              {user.is_mentor && <Badge tone="gold">Mentor</Badge>}
            </div>
          </div>
        </div>
        <Link to="/profile/edit">
          <Button>Edit profile</Button>
        </Link>
      </div>
      <dl className="mt-6 grid gap-3 md:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Branch</dt><dd>{user.branch || '—'}</dd></div>
        <div><dt className="text-sm text-slate-500">Batch</dt><dd>{user.batch_year || '—'}</dd></div>
        <div><dt className="text-sm text-slate-500">Company</dt><dd>{user.company || '—'}</dd></div>
        <div><dt className="text-sm text-slate-500">Job title</dt><dd>{user.job_title || '—'}</dd></div>
        <div><dt className="text-sm text-slate-500">City</dt><dd>{user.city || '—'}</dd></div>
        <div><dt className="text-sm text-slate-500">Skills</dt><dd>{(user.skills || []).join(', ') || '—'}</dd></div>
      </dl>
      <p className="mt-4 text-slate-700">{user.bio}</p>
    </Card>
  );
}
