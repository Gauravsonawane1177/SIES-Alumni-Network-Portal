import { useState } from 'react';
import PublicLayout from '../layouts/PublicLayout';
import { Button, Card, Field, inputClass } from '../components/ui';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setInfo(data.data.reset_url ? `Development reset link: ${data.data.reset_url}` : data.message);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="font-display text-2xl text-maroon-800">Forgot password</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Account email">
              <input className={inputClass()} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button className="w-full">Send reset instructions</Button>
          </form>
          {info && <p className="mt-4 break-all text-sm text-slate-700">{info}</p>}
        </Card>
      </div>
    </PublicLayout>
  );
}
