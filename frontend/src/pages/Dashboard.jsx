import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
const statusBadge   = { todo: 'badge-todo', 'in-progress': 'badge-progress', done: 'badge-done' };
const statusLabel   = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };

function CountUp({ to, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    const steps = 40;
    const inc = to / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.round(cur));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [to, duration]);
  return val;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [projects,setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, tasksRes, projRes] = await Promise.all([
          api.get('/tasks/stats'),
          api.get('/tasks?limit=5'),
          api.get('/projects'),
        ]);
        setStats(statsRes.data);
        setTasks(tasksRes.data.slice(0, 6));
        setProjects(projRes.data.slice(0, 4));
      } catch {
        
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { label: 'Total Tasks',    value: stats?.total      ?? 0, icon: '✦', color: 'var(--accent)',  accent: 'var(--accent)' },
    { label: 'In Progress',    value: stats?.inProgress ?? 0, icon: '◐', color: 'var(--accent2)', accent: 'var(--accent2)' },
    { label: 'Completed',      value: stats?.done       ?? 0, icon: '✔', color: 'var(--success)', accent: 'var(--success)' },
    { label: 'Overdue',        value: stats?.overdue    ?? 0, icon: '⚑', color: 'var(--danger)',  accent: 'var(--danger)' },
  ];

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status } : t));
      const statsRes = await api.get('/tasks/stats');
      setStats(statsRes.data);
    } catch { /* silent */ }
  };

  return (
    <div className="page" style={{ animation: 'slideUp 0.4s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your team today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/tasks" className="btn btn-ghost btn-sm">View All Tasks</Link>
          {isAdmin && <Link to="/projects" className="btn btn-primary btn-sm">+ New Project</Link>}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, icon, accent }) => (
          <div key={label} className="stat-card" style={{ '--card-accent': accent }}>
            <div className="stat-icon" style={{ background: `${accent}18`, color: accent }}>{icon}</div>
            <div className="stat-value" style={{ color: accent }}>
              {loading ? <span className="spinner" /> : <CountUp to={value} />}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Recent Tasks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Tasks</h2>
            <Link to="/tasks" className="btn btn-ghost btn-sm">See all</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ height: 72, opacity: 0.4, animation: 'pulse 1.5s ease infinite' }} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No tasks yet</h3>
              <p>Tasks assigned to you will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(task => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = due && due < new Date() && task.status !== 'done';
                return (
                  <div
                    key={task._id}
                    className={`task-card${isOverdue ? ' overdue' : ''}`}
                    style={{ borderLeft: `3px solid ${priorityColor[task.priority] || 'var(--muted)'}` }}
                  >
                    <div className="task-card-title">{task.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                      <div className="task-card-meta">
                        <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
                        <span className="badge" style={{ background: `${priorityColor[task.priority]}18`, color: priorityColor[task.priority] }}>
                          {task.priority}
                        </span>
                        {due && (
                          <span className={`due-date${isOverdue ? ' overdue' : ''}`}>
                            {isOverdue ? '⚑ ' : '📅 '}{due.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {task.status !== 'done' && (
                        <button className="btn btn-ghost btn-sm" style={{ padding:'4px 8px', fontSize:'0.75rem', color:'var(--success)', borderColor:'var(--success)', flexShrink: 0 }} onClick={() => handleStatusChange(task._id, 'done')}>✔ Mark as Done</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects Panel */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Active Projects</h2>
            <Link to="/projects" className="btn btn-ghost btn-sm">See all</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card" style={{ height: 90, opacity: 0.4, animation: 'pulse 1.5s ease infinite' }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">◈</div>
              <h3>No projects</h3>
              <p>{isAdmin ? 'Create your first project.' : 'You haven\'t been added to a project yet.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((proj, i) => {
                const colors = ['var(--accent)', 'var(--accent2)', 'var(--success)', 'var(--warning)'];
                const pct = proj.taskCount > 0 ? Math.round((proj.doneCount / proj.taskCount) * 100) : 0;
                return (
                  <Link
                    key={proj._id}
                    to={`/projects/${proj._id}`}
                    className="card"
                    style={{ display: 'block', padding: '16px 20px', textDecoration: 'none', borderLeft: `3px solid ${colors[i % colors.length]}` }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>{proj.title}</div>
                    <div className="project-progress-bar">
                      <div className="project-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted2)' }}>
                      <span>{proj.taskCount ?? 0} tasks</span>
                      <span>{pct}% done</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Quick Stats */}
          {stats && (
            <div className="card" style={{ marginTop: 16, padding: '16px 20px' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>Task Breakdown</div>
              {[
                { label: 'To Do',       count: stats.todo,       color: 'var(--muted2)', bg: 'rgba(100,116,139,0.15)' },
                { label: 'In Progress', count: stats.inProgress, color: 'var(--accent2)', bg: 'rgba(0,207,255,0.12)' },
                { label: 'Done',        count: stats.done,       color: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{count ?? 0}</span>
                  <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--muted2)' }}>{label}</span>
                  <div style={{ height: 4, width: 80, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.total > 0 ? ((count ?? 0) / stats.total) * 100 : 0}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
