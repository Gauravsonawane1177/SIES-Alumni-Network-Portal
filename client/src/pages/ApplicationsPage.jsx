import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, EmptyState, ErrorState, Spinner } from '../components/ui';

export default function ApplicationsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/jobs/mine/applications')
      .then(({ data }) => setRows(data.data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-maroon-800">My applications</h1>
      {!rows.length && <EmptyState title="No applications" text="Apply to an approved job to track it here." />}
      {rows.map((a) => (
        <Card key={a.id}>
          <Link className="font-semibold text-maroon-800" to={`/jobs/${a.job_id}`}>
            {a.title}
          </Link>
          <p className="text-sm text-slate-600">{a.company} · {a.status}</p>
        </Card>
      ))}
    </div>
  );
}
