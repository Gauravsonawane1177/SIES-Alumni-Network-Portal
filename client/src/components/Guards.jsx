import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Restoring session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.status !== 'ACTIVE' && user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <h1 className="font-display text-2xl text-maroon-800">Account pending</h1>
        <p className="mt-3 text-slate-600">
          {user.status === 'PENDING'
            ? 'Your alumni account is waiting for administrator approval.'
            : 'Your account cannot access the portal in its current status.'}
        </p>
      </div>
    );
  }
  return children;
}

export function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user?.status === 'ACTIVE') return <Navigate to="/dashboard" replace />;
  return children;
}
