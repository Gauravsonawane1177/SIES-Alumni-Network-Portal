import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, EmptyState, ErrorState, Spinner } from '../components/ui';

export default function GivingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/donations/campaigns'), api.get('/donations/mine')])
      .then(([c, m]) => {
        setCampaigns(c.data.data.campaigns);
        setMine(m.data.data.donations);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-maroon-800">Giving</h1>
      {!campaigns.length && <EmptyState title="No campaigns" text="Active donation campaigns will appear here." />}
      {campaigns.map((c) => {
        const pct = Math.min(100, Math.round((Number(c.collected_amount) / Number(c.target_amount)) * 100));
        return (
          <Card key={c.id}>
            <Link className="font-display text-xl text-maroon-800" to={`/giving/${c.id}`}>
              {c.title}
            </Link>
            <p className="mt-2 text-slate-600">{c.description}</p>
            <div className="mt-3 h-2 rounded bg-maroon-50">
              <div className="h-2 rounded bg-gold-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm">₹{Number(c.collected_amount).toLocaleString()} of ₹{Number(c.target_amount).toLocaleString()}</p>
          </Card>
        );
      })}
      <Card>
        <h2 className="font-display text-xl">Your donations</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {mine.map((d) => (
            <li key={d.id} className="flex justify-between">
              <span>{d.campaign_title} · ₹{d.amount} · {d.status}</span>
              {d.status === 'PAID' && (
                <button
                  type="button"
                  className="text-maroon-700 underline"
                  onClick={async () => {
                    const res = await api.get(`/donations/${d.id}/receipt`, { responseType: 'blob' });
                    const url = URL.createObjectURL(res.data);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${d.receipt_number || 'receipt'}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Receipt
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
