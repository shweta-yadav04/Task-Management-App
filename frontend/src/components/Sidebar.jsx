import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/projects',  icon: '◈', label: 'Projects'  },
  { to: '/tasks',     icon: '✦', label: 'Tasks'      },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">T</div>
        <span className="sidebar-logo-text">TaskFlow</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main Menu</span>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}

        <span className="sidebar-section-label">Account</span>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">◉</span>
          Profile
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => navigate('/profile')}>
          <div className="user-avatar-sm">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{isAdmin ? '🔑 Admin' : '👤 Member'}</div>
          </div>
        </div>
        <button
          className="nav-item"
          style={{ width: '100%', marginTop: 4, color: 'var(--danger)' }}
          onClick={handleLogout}
        >
          <span className="nav-icon">⤷</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
