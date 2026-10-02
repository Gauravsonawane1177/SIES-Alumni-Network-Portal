import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, PublicOnly, RoleGuard } from './components/Guards';
import { Spinner } from './components/ui';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import DirectoryPage from './pages/DirectoryPage';
import UserProfilePage from './pages/UserProfilePage';
import ConnectionsPage from './pages/ConnectionsPage';
import MessagesPage from './pages/MessagesPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import JobCreatePage from './pages/JobCreatePage';
import ApplicationsPage from './pages/ApplicationsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventCreatePage from './pages/EventCreatePage';
import GivingPage from './pages/GivingPage';
import GivingDetailPage from './pages/GivingDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import MentorshipPage from './pages/MentorshipPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVerificationPage from './pages/admin/AdminVerificationPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminDonationsPage from './pages/admin/AdminDonationsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

function MemberShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user?.status === 'ACTIVE' && user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.status === 'ACTIVE') return <Navigate to="/dashboard" replace />;
  return <HomePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<MemberShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/mentors" element={<DirectoryPage mentorOnly />} />
              <Route path="/users/:id" element={<UserProfilePage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/create" element={<RoleGuard roles={['ALUMNI']}><JobCreatePage /></RoleGuard>} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/applications" element={<RoleGuard roles={['STUDENT']}><ApplicationsPage /></RoleGuard>} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/create" element={<RoleGuard roles={['ALUMNI', 'ADMIN']}><EventCreatePage /></RoleGuard>} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/giving" element={<GivingPage />} />
              <Route path="/giving/:id" element={<GivingDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/mentorship" element={<RoleGuard roles={['ALUMNI']}><MentorshipPage /></RoleGuard>} />
              <Route path="/admin" element={<RoleGuard roles={['ADMIN']}><AdminDashboardPage /></RoleGuard>} />
              <Route path="/admin/users" element={<RoleGuard roles={['ADMIN']}><AdminUsersPage /></RoleGuard>} />
              <Route path="/admin/verification" element={<RoleGuard roles={['ADMIN']}><AdminVerificationPage /></RoleGuard>} />
              <Route path="/admin/jobs" element={<RoleGuard roles={['ADMIN']}><AdminJobsPage /></RoleGuard>} />
              <Route path="/admin/events" element={<RoleGuard roles={['ADMIN']}><AdminEventsPage /></RoleGuard>} />
              <Route path="/admin/donations" element={<RoleGuard roles={['ADMIN']}><AdminDonationsPage /></RoleGuard>} />
              <Route path="/admin/analytics" element={<RoleGuard roles={['ADMIN']}><AdminAnalyticsPage /></RoleGuard>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
