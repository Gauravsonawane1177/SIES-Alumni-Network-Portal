import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function MentorshipPage() {
  const { user, refresh } = useAuth();
  const toast = useToast();

  async function toggle() {
    try {
      await api.put('/users/me/profile', { is_mentor: !user.is_mentor });
      await refresh();
      toast.success(user.is_mentor ? 'Mentorship listing removed' : 'You are now listed as a mentor');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <h1 className="font-display text-3xl text-maroon-800">Mentorship</h1>
      <p className="mt-3 text-slate-600">
        Alumni can opt in as mentors. Students find mentors in the directory using the mentor filter.
      </p>
      <p className="mt-4">Current status: {user.is_mentor ? 'Listed as mentor' : 'Not listed'}</p>
      <Button className="mt-4" onClick={toggle}>
        {user.is_mentor ? 'Stop mentoring' : 'Become a mentor'}
      </Button>
    </Card>
  );
}
