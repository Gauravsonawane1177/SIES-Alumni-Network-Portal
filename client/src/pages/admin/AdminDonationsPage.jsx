import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button, Card, ErrorState, Field, Spinner, inputClass } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function AdminDonationsPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_amount: 100000,
    start_date: '',
    end_date: ''
  });

  async function load() {
    try {
      const { data } = await api.get('/admin/donations');
      setCampaigns(data.data.campaigns);
      setDonations(data.data.donations);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!campaigns) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-maroon-800">Donation management</h1>
      <Card>
        <h2 className="font-display text-xl">Create campaign</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.post('/admin/campaigns', form);
              toast.success('Campaign created');
              load();
            } catch (err) {
              toast.error(err.message);
            }
          }}
        >
          <Field label="Title"><input className={inputClass()} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Target"><input className={inputClass()} type="number" required value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} /></Field>
          <Field label="Start"><input className={inputClass()} type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="End"><input className={inputClass()} type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Field label="Description"><textarea className={inputClass()} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Campaigns</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[600px] text-left text-sm">
            <thead><tr><th>Title</th><th>Target</th><th>Collected</th><th>Status</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t">
                  <td>{c.title}</td>
                  <td>₹{c.target_amount}</td>
                  <td>₹{c.collected_amount}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Donations</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[700px] text-left text-sm">
            <thead><tr><th>Donor</th><th>Campaign</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-t">
                  <td>{d.full_name}</td>
                  <td>{d.campaign_title}</td>
                  <td>₹{d.amount}</td>
                  <td>{d.status}</td>
                  <td>{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
