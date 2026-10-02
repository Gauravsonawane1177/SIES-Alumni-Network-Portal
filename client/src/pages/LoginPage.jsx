import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { Button, Card, Field, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(form);
      toast.success(data.message);
      const dest = data.data.user.role === 'ADMIN' ? '/admin' : '/dashboard';
      navigate(location.state?.from?.pathname || dest);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="font-display text-2xl text-maroon-800">Login</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Email">
              <input className={inputClass()} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password">
              <input className={inputClass()} type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-sm">
            <Link className="text-maroon-700 underline" to="/forgot-password">
              Forgot password?
            </Link>
          </p>
        </Card>
      </div>
    </PublicLayout>
  );
}
