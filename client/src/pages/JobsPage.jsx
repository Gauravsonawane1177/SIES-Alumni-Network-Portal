import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Badge, Card, EmptyState, ErrorState, Spinner, inputClass, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const typeLabels = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract'
};

const statusLabels = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  CLOSED: 'Closed'
};

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs', { params: q ? { q } : {} });
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

  return (
    <div className="page-section">
      <header className="page-header">
        <div>
          <h1>Jobs</h1>
          <p className="page-subtitle">Explore opportunities from alumni and industry partners.</p>
        </div>
        {user.role === 'ALUMNI' && (
          <Link to="/jobs/create" className="inline-flex items-center justify-center rounded-xl bg-maroon-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-maroon-800">
            Post job
          </Link>
        )}
      </header>

      <Card className="p-4">
        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <div className="flex-1">
            <input className={inputClass()} placeholder="Search jobs, companies, or skills" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !jobs.length && <EmptyState title="No jobs" text="Approved jobs will appear here." />}

      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id} className="p-4">
            <div className="job-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Link to={`/jobs/${job.id}`} className="job-title">{job.title}</Link>
                </div>
                <Badge tone={job.status === 'APPROVED' ? 'green' : job.status === 'PENDING' ? 'gold' : 'gray'}>
                  {statusLabels[job.status] || job.status}
                </Badge>
              </div>

              <div className="job-meta">
                <span>{job.company}</span>
                <span>{job.location}</span>
                <span>{typeLabels[job.job_type] || job.job_type}</span>
              </div>

              <div className="job-meta">
                {job.experience_required && <span>{job.experience_required}</span>}
                {Array.isArray(job.skills) && job.skills.length > 0 && <span>{job.skills.slice(0, 2).join(', ')}</span>}
              </div>

              <div className="job-card-footer">
                <Link to={`/jobs/${job.id}`} className="inline-flex items-center rounded-xl border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm font-semibold text-maroon-800 transition hover:bg-maroon-100">
                  View Details
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
