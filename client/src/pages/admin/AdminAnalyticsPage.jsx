import AdminDashboardPage from './AdminDashboardPage';

export default function AdminAnalyticsPage() {
  return (
    <div>
      <p className="mb-4 text-slate-600">Analytics charts are sourced live from PostgreSQL via /api/admin/analytics.</p>
      <AdminDashboardPage />
    </div>
  );
}
