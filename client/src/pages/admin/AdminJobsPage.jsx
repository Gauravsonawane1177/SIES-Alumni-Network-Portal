import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function AdminJobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/admin/jobs');
      setJobs(data.data.jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function moderate(id, status) {
    try {
      await api.put(`/admin/jobs/${id}/moderate`, { status });
      toast.success(`Job ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-maroon-800">Job moderation</h1>
      {!jobs.length && <EmptyState title="No pending jobs" text="Alumni job posts wait here for approval." />}
      {jobs.map((job) => (
        <Card key={job.id}>
          <h2 className="font-semibold">{job.title}</h2>
          <p className="text-sm">{job.company} · {job.poster_name}</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => moderate(job.id, 'APPROVED')}>Approve</Button>
            <Button variant="ghost" onClick={() => moderate(job.id, 'REJECTED')}>Reject</Button>
            <Button variant="danger" onClick={async () => { await api.delete(`/admin/jobs/${job.id}`); load(); }}>Delete</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
