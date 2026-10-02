import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api from '../../services/api';
import { Card, ErrorState, Spinner } from '../../components/ui';

const COLORS = ['#6B1C23', '#C9A227', '#8B2E36', '#A8861B', '#3B0E13'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/analytics')])
      .then(([s, a]) => {
        setStats(s.data.data.stats);
        setCharts(a.data.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats || !charts) return <Spinner />;

  const cards = [
    ['Total users', stats.total_users],
    ['Students', stats.total_students],
    ['Alumni', stats.total_alumni],
    ['Pending alumni', stats.pending_alumni],
    ['Jobs', stats.total_jobs],
    ['Events', stats.total_events],
    ['Donations (₹)', stats.total_donations],
    ['Connections', stats.total_connections]
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-maroon-800">Admin dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-display text-3xl text-maroon-800">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-xl">Users by role</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.users_by_role} dataKey="count" nameKey="role" label>
                {charts.users_by_role.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">Users by branch</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.users_by_branch}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6B1C23" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">Users by batch</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.users_by_batch}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="batch_year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#C9A227" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">Monthly registrations</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.monthly_registrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B2E36" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">Jobs posted</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.jobs_posted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6B1C23" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">Events</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.events}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#54151B" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">Donations</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.donations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#A8861B" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Link className="text-maroon-700 underline" to="/admin/analytics">
        Open analytics page
      </Link>
    </div>
  );
}
