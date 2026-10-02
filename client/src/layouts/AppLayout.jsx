import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui';

const studentLinks = [
  ['Dashboard', '/dashboard', 'dashboard'],
  ['Directory', '/directory', 'directory'],
  ['Mentors', '/mentors', 'mentors'],
  ['Connections', '/connections', 'connections'],
  ['Messages', '/messages', 'messages'],
  ['Jobs', '/jobs', 'jobs'],
  ['Applications', '/applications', 'applications'],
  ['Events', '/events', 'events'],
  ['Giving', '/giving', 'giving'],
  ['Notifications', '/notifications', 'notifications'],
  ['Profile', '/profile', 'profile']
];

const alumniLinks = [
  ['Dashboard', '/dashboard', 'dashboard'],
  ['Directory', '/directory', 'directory'],
  ['Connections', '/connections', 'connections'],
  ['Messages', '/messages', 'messages'],
  ['Mentorship', '/mentorship', 'mentors'],
  ['Jobs', '/jobs', 'jobs'],
  ['Post Job', '/jobs/create', 'jobs'],
  ['Events', '/events', 'events'],
  ['Create Event', '/events/create', 'events'],
  ['Giving', '/giving', 'giving'],
  ['Notifications', '/notifications', 'notifications'],
  ['Profile', '/profile', 'profile']
];

const adminLinks = [
  ['Dashboard', '/admin', 'dashboard'],
  ['Users', '/admin/users', 'directory'],
  ['Alumni Verification', '/admin/verification', 'mentors'],
  ['Job Moderation', '/admin/jobs', 'jobs'],
  ['Event Moderation', '/admin/events', 'events'],
  ['Donations', '/admin/donations', 'giving'],
  ['Analytics', '/admin/analytics', 'dashboard'],
  ['Notifications', '/notifications', 'notifications']
];

export function navFor(role) {
  if (role === 'ADMIN') return adminLinks;
  if (role === 'ALUMNI') return alumniLinks;
  return studentLinks;
}

function NavIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

  const icons = {
    dashboard: (
      <svg {...common}><path d="M3 13.5h8V21H3zM13 3h8v9h-8zM13 15h8v6h-8zM3 3h8v8H3z" /></svg>
    ),
    directory: (
      <svg {...common}><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" /><circle cx="10" cy="7" r="3" /><path d="M20 19v-1a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
    mentors: (
      <svg {...common}><path d="M12 3.5a5 5 0 0 1 5 5V8a5 5 0 0 1-10 0v.5a5 5 0 0 1 5-5Z" /><path d="M5 18c1.7-2 4-3 7-3s5.3 1 7 3" /><path d="M12 13v8" /></svg>
    ),
    connections: (
      <svg {...common}><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M3 19a5 5 0 0 1 10 0" /><path d="M11 19a5 5 0 0 1 10 0" /></svg>
    ),
    messages: (
      <svg {...common}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5v-7Z" /></svg>
    ),
    jobs: (
      <svg {...common}><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /><path d="M3 11h18" /></svg>
    ),
    applications: (
      <svg {...common}><path d="M14 3h5v5" /><path d="M14 3l6 6" /><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h5.3L18 11.2v7.3A2.5 2.5 0 0 1 15.5 21h-9A2.5 2.5 0 0 1 4 18.5v-11Z" /><path d="M8 13h8M8 17h6" /></svg>
    ),
    events: (
      <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
    ),
    giving: (
      <svg {...common}><path d="M12 21s-7-4.35-7-10A4 4 0 0 1 9 7c1.12 0 2.2.46 3 1.2A4.2 4.2 0 0 1 15 7a4 4 0 0 1 4 4c0 5.65-7 10-7 10Z" /></svg>
    ),
    notifications: (
      <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
    ),
    profile: (
      <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>
    )
  };

  return icons[name] || icons.dashboard;
}

function BellIcon({ className = '' }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await api.get('/notifications');
        if (mounted) setUnread(data.data.unread || 0);
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const links = navFor(user?.role);
  const firstName = user?.full_name?.split(' ')[0] || 'Profile';

  return (
    <div className="min-h-screen bg-ivory text-slate-800">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="app-layout-shell">
        <aside id="primary-navigation" className={`app-sidebar ${open ? 'is-open' : ''}`}>
          <div className="app-sidebar-inner">
            <div className="brand-block">
              <div className="brand-mark">S</div>
              <div>
                <p className="brand-label">SIES</p>
                <p className="brand-subtitle">Alumni Network</p>
              </div>
            </div>

            <nav className="nav-stack" aria-label="Primary navigation">
              {links.map(([label, to, icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  end={to === '/dashboard' || to === '/admin'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-icon"><NavIcon name={icon} /></span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="sidebar-footer">
              <button
                type="button"
                className="sidebar-logout"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                <span className="nav-icon"><NavIcon name="profile" /></span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="app-main-panel">
          <header className="app-topbar">
            <div className="app-topbar-inner">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="mobile-menu-button md:hidden"
                  aria-label={open ? 'Close navigation' : 'Open navigation'}
                  aria-controls="primary-navigation"
                  aria-expanded={open}
                  onClick={() => setOpen((state) => !state)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18M3 12h18M3 18h18" />
                  </svg>
                </button>
                <button type="button" className="brand-button" onClick={() => navigate('/dashboard')}>
                  SIES Alumni Network
                </button>
              </div>

              <div className="topbar-actions">
                <NavLink
                  to="/notifications"
                  className="notification-button"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <BellIcon className="notification-icon" />
                  {unread > 0 && <span className="notification-badge">{unread}</span>}
                </NavLink>

                <button type="button" className="profile-pill" onClick={() => navigate('/profile')}>
                  <span className="profile-avatar">{firstName.charAt(0).toUpperCase()}</span>
                  <span className="profile-label">{firstName}</span>
                </button>
              </div>
            </div>
          </header>

          <main id="main" className="page-shell">
            {children}
          </main>
        </div>
      </div>
      {open && <button type="button" className="mobile-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    </div>
  );
}
