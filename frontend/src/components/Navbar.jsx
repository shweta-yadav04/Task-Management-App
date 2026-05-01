import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/dashboard': 'Dashboard',
  '/projects':  'Projects',
  '/tasks':     'Tasks',
  '/profile':   'Profile',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] || 'TaskFlow';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <header className="navbar">
      <div>
        <span className="navbar-title">{title}</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: 8 }}>
          — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="navbar-right">
        <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>
          {isAdmin ? '🔑 Admin' : '👤 Member'}
        </span>
        <div className="user-avatar-sm">{initials}</div>
      </div>
    </header>
  );
}
