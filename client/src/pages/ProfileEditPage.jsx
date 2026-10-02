import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Field, inputClass } from '../components/ui';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProfileEditPage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    branch: user.branch || '',
    batch_year: user.batch_year || '',
    graduation_year: user.graduation_year || '',
    company: user.company || '',
    job_title: user.job_title || '',
    city: user.city || '',
    bio: user.bio || '',
    skills: (user.skills || []).join(', '),
    linkedin_url: user.linkedin_url || '',
    github_url: user.github_url || '',
    profile_photo: user.profile_photo || '',
    is_mentor: Boolean(user.is_mentor)
  });
  const [busy, setBusy] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/users/me/profile', {
        ...form,
        batch_year: form.batch_year || null,
        graduation_year: form.graduation_year || null,
        profile_photo: form.profile_photo || null
      });
      await refresh();
      toast.success('Profile updated');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h1 className="font-display text-2xl text-maroon-800">Edit profile</h1>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Full name"><input className={inputClass()} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field>
        <Field label="Phone"><input className={inputClass()} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Branch"><input className={inputClass()} value={form.branch} onChange={(e) => set('branch', e.target.value)} /></Field>
        <Field label="Batch year"><input className={inputClass()} type="number" value={form.batch_year} onChange={(e) => set('batch_year', e.target.value)} /></Field>
        <Field label="Graduation year"><input className={inputClass()} type="number" value={form.graduation_year} onChange={(e) => set('graduation_year', e.target.value)} /></Field>
        <Field label="City"><input className={inputClass()} value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="Company"><input className={inputClass()} value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field label="Job title"><input className={inputClass()} value={form.job_title} onChange={(e) => set('job_title', e.target.value)} /></Field>
        <Field label="Photo URL"><input className={inputClass()} value={form.profile_photo} onChange={(e) => set('profile_photo', e.target.value)} /></Field>
        <Field label="Skills (comma separated)"><input className={inputClass()} value={form.skills} onChange={(e) => set('skills', e.target.value)} /></Field>
        <Field label="LinkedIn URL"><input className={inputClass()} value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} /></Field>
        <Field label="GitHub URL"><input className={inputClass()} value={form.github_url} onChange={(e) => set('github_url', e.target.value)} /></Field>
        <Field label="Bio"><textarea className={inputClass()} rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
        {user.role === 'ALUMNI' && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_mentor} onChange={(e) => set('is_mentor', e.target.checked)} />
            Available as a mentor
          </label>
        )}
        <div className="md:col-span-2">
          <Button disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </Card>
  );
}
