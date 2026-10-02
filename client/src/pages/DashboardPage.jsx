import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorState, Spinner } from '../components/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/jobs'), api.get('/events')])
      .then(([j, e]) => {
        setJobs(j.data.data.jobs.slice(0, 4));
        setEvents(e.data.data.events.slice(0, 4));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page-section">
      <header className="page-header">
        <div>
          <h1>Welcome, {user.full_name}</h1>
          <p className="page-subtitle">
            {user.role === 'STUDENT' && 'Explore mentors, jobs, events, and the alumni directory.'}
            {user.role === 'ALUMNI' && 'Post opportunities, host events, and mentor students.'}
            {user.role === 'ADMIN' && 'Overview of community activity, approvals, and campaigns.'}
          </p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="card-heading">Latest jobs</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div>
                  <Link to={`/jobs/${job.id}`} className="job-title">{job.title}</Link>
                </div>
                <div className="job-meta">
                  <span>{job.company}</span>
                  <span>{job.location}</span>
                  <span>{job.job_type}</span>
                </div>
              </div>
            ))}
            {!jobs.length && <p className="text-slate-500">No jobs yet.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="card-heading">Upcoming events</h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="job-card">
                <Link to={`/events/${event.id}`} className="job-title">{event.title}</Link>
                <div className="job-meta">
                  <span>{event.location}</span>
                  <span>{new Date(event.event_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {!events.length && <p className="text-slate-500">No events yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
