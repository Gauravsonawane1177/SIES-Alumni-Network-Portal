import { useEffect, useState } from 'react';
import api from '../services/api';
import ProfileCard from '../components/ProfileCard';
import { Button, EmptyState, ErrorState, Field, Spinner, inputClass } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const empty = { q: '', company: '', job_title: '', skills: '', city: '', role: '', branch: '', batch_year: '', mentor: '' };

export default function DirectoryPage({ mentorOnly = false }) {
  const toast = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ ...empty, mentor: mentorOnly ? 'true' : '' });
  const [data, setData] = useState({ users: [], pagination: { page: 1, pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(page = 1) {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, page, mentor: mentorOnly ? 'true' : filters.mentor };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data: res } = await api.get('/users', { params });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorOnly]);

  async function connect(id) {
    try {
      await api.post('/connections', { addressee_id: id });
      toast.success('Connection request sent');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-maroon-800">{mentorOnly ? 'Mentors' : 'Directory'}</h1>
      <form
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
      >
        <Field label="Search name"><input className={inputClass()} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></Field>
        <Field label="Company"><input className={inputClass()} value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })} /></Field>
        <Field label="Job title"><input className={inputClass()} value={filters.job_title} onChange={(e) => setFilters({ ...filters, job_title: e.target.value })} /></Field>
        <Field label="Skills"><input className={inputClass()} value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} /></Field>
        <Field label="City"><input className={inputClass()} value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} /></Field>
        <Field label="Role">
          <select className={inputClass()} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">Any</option>
            <option value="STUDENT">Student</option>
            <option value="ALUMNI">Alumni</option>
          </select>
        </Field>
        <Field label="Branch"><input className={inputClass()} value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} /></Field>
        <Field label="Batch year"><input className={inputClass()} value={filters.batch_year} onChange={(e) => setFilters({ ...filters, batch_year: e.target.value })} /></Field>
        {!mentorOnly && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.mentor === 'true'} onChange={(e) => setFilters({ ...filters, mentor: e.target.checked ? 'true' : '' })} />
            Mentors only
          </label>
        )}
        <div className="flex items-end">
          <Button type="submit">Search</Button>
        </div>
      </form>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !data.users.length && <EmptyState title="No members found" text="Try a different search." />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.users.map((member) => (
          <ProfileCard
            key={member.id}
            user={member}
            onConnect={member.id === user.id ? null : connect}
          />
        ))}
      </div>
      {data.pagination.pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: data.pagination.pages }, (_, i) => (
            <Button key={i} variant={data.pagination.page === i + 1 ? 'primary' : 'ghost'} onClick={() => load(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
