import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, Field, inputClass } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function JobCreatePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    job_type: 'FULL_TIME',
    experience_required: '',
    skills: '',
    application_url: '',
    deadline: ''
  });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/jobs', form);
      toast.success(data.message);
      navigate('/jobs');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <h1 className="font-display text-2xl text-maroon-800">Post a job</h1>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Title"><input className={inputClass()} required value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Company"><input className={inputClass()} required value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field label="Location"><input className={inputClass()} value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Type">
          <select className={inputClass()} value={form.job_type} onChange={(e) => set('job_type', e.target.value)}>
            <option>FULL_TIME</option>
            <option>PART_TIME</option>
            <option>INTERNSHIP</option>
            <option>CONTRACT</option>
          </select>
        </Field>
        <Field label="Experience"><input className={inputClass()} value={form.experience_required} onChange={(e) => set('experience_required', e.target.value)} /></Field>
        <Field label="Skills"><input className={inputClass()} value={form.skills} onChange={(e) => set('skills', e.target.value)} /></Field>
        <Field label="External URL"><input className={inputClass()} value={form.application_url} onChange={(e) => set('application_url', e.target.value)} /></Field>
        <Field label="Deadline"><input className={inputClass()} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></Field>
        <div className="md:col-span-2">
          <Field label="Description"><textarea className={inputClass()} required minLength={20} rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        </div>
        <Button type="submit">Submit for approval</Button>
      </form>
    </Card>
  );
}
