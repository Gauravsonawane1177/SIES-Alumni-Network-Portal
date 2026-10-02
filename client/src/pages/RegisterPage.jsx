import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { Button, Card, Field, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    branch: 'CE',
    batch_year: 2024,
    city: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await register(form);
      toast.success(data.message);
      if (form.role === 'ALUMNI') navigate('/login');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <h1 className="font-display text-2xl text-maroon-800">Create an account</h1>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Full name">
              <input className={inputClass()} required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={inputClass()} type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Password">
              <input className={inputClass()} type="password" minLength={8} required value={form.password} onChange={(e) => set('password', e.target.value)} />
            </Field>
            <Field label="I am a">
              <select className={inputClass()} value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="STUDENT">Student</option>
                <option value="ALUMNI">Alumni</option>
              </select>
            </Field>
            <Field label="Branch">
              <input className={inputClass()} value={form.branch} onChange={(e) => set('branch', e.target.value)} />
            </Field>
            <Field label="Batch year">
              <input className={inputClass()} type="number" value={form.batch_year} onChange={(e) => set('batch_year', e.target.value)} />
            </Field>
            <Field label="City">
              <input className={inputClass()} value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
            {error && <p className="md:col-span-2 text-sm text-red-700">{error}</p>}
            <div className="md:col-span-2">
              <Button disabled={busy} className="w-full">
                {busy ? 'Submitting…' : 'Register'}
              </Button>
            </div>
          </form>
          {form.role === 'ALUMNI' && (
            <p className="mt-4 text-sm text-slate-600">Alumni accounts require administrator approval before login.</p>
          )}
        </Card>
      </div>
    </PublicLayout>
  );
}
