import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, Field, inputClass } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function EventCreatePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: 'SIES GST, Nerul',
    event_date: '',
    capacity: 50
  });

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/events', form);
      toast.success(data.message);
      navigate('/events');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <h1 className="font-display text-2xl text-maroon-800">Create event</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Title"><input className={inputClass()} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Location"><input className={inputClass()} required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Date and time"><input className={inputClass()} type="datetime-local" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></Field>
        <Field label="Capacity"><input className={inputClass()} type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
        <Field label="Description"><textarea className={inputClass()} minLength={20} required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Button type="submit">Publish / submit</Button>
      </form>
    </Card>
  );
}
