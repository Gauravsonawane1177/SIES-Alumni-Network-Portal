import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { Button, Card, Field, inputClass } from '../components/ui';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const token = params.get('token') || '';

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="font-display text-2xl text-maroon-800">Reset password</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="New password">
              <input className={inputClass()} type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button className="w-full" disabled={!token}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </PublicLayout>
  );
}
