import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Badge, Button, Card, ErrorState, Field, Spinner, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ resume_url: '', cover_letter: '' });
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data.data.job);
      setApplied(data.data.already_applied);
      if (user.role === 'ADMIN' || user.id === data.data.job.posted_by) {
        const a = await api.get(`/jobs/${id}/applications`);
        setApps(a.data.data.applications);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!job) return <Spinner />;

  return (
    <div className="space-y-4">
      <Card>
        <Badge>{job.status}</Badge>
        <h1 className="mt-2 font-display text-3xl text-maroon-800">{job.title}</h1>
        <p>{job.company} · {job.location} · {job.job_type}</p>
        <p className="mt-4 whitespace-pre-wrap">{job.description}</p>
        <p className="mt-2 text-sm">Skills: {(job.skills || []).join(', ')}</p>
      </Card>
      {user.role === 'STUDENT' && job.status === 'APPROVED' && (
        <Card>
          <h2 className="font-display text-xl">Apply</h2>
          {applied ? (
            <p className="mt-2 text-emerald-700">You have already applied.</p>
          ) : (
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.post(`/jobs/${id}/apply`, form);
                  toast.success('Application submitted');
                  setApplied(true);
                } catch (err) {
                  toast.error(err.message);
                }
              }}
            >
              <Field label="Resume URL">
                <input className={inputClass()} required value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} />
              </Field>
              <Field label="Cover letter">
                <textarea className={inputClass()} required minLength={20} rows={5} value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} />
              </Field>
              <Button type="submit">Submit application</Button>
            </form>
          )}
        </Card>
      )}
      {user.role !== 'STUDENT' && (
        <Card>
          <h2 className="font-display text-xl">Applications</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
