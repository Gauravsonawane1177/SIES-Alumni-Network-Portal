import { Link } from 'react-router-dom';
import { Badge } from './ui';

export default function ProfileCard({ user, onConnect, connectDisabled }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <img
          src={user.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'M')}&background=6B1C23&color=fff`}
          alt=""
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-maroon-800">{user.full_name}</h3>
          <p className="text-sm text-slate-600">{user.role}</p>
          {user.is_mentor && <Badge tone="gold">Mentor</Badge>}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {user.branch || 'Branch N/A'} · {user.batch_year || 'Batch N/A'}
      </p>
      <p className="text-sm">{user.job_title ? `${user.job_title} at ${user.company || '—'}` : user.company || 'Student'}</p>
      <p className="text-sm text-slate-500">{user.city}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(user.skills || []).slice(0, 4).map((s) => (
          <Badge key={s} tone="gray">
            {s}
          </Badge>
        ))}
      </div>
      <div className="mt-auto flex gap-2 pt-4">
        <Link className="rounded-lg bg-maroon-700 px-3 py-2 text-sm font-semibold text-white" to={`/users/${user.id}`}>
          View Profile
        </Link>
        {onConnect && (
          <button
            type="button"
            disabled={connectDisabled}
            onClick={() => onConnect(user.id)}
            className="rounded-lg border border-maroon-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Connect
          </button>
        )}
      </div>
    </article>
  );
}
