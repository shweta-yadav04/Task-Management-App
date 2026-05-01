import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const statusBadge = { todo:'badge-todo', 'in-progress':'badge-progress', done:'badge-done' };
const statusLabel = { todo:'To Do', 'in-progress':'In Progress', done:'Done' };
const priColor    = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' };
const COLUMNS     = ['todo','in-progress','done'];

function TaskForm({ initial, users, projectId, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    priority: initial?.priority ?? 'medium',
    assignedTo: initial?.assignedTo?._id ?? initial?.assignedTo ?? '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0,10) : '',
    project: projectId,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-body">
      <div className="form-group">
        <label className="form-label">Task Title *</label>
        <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details..." style={{ resize:'vertical' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-input" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={() => onSubmit(form)} disabled={loading || !form.title.trim()}>
          {loading ? <span className="spinner" /> : (initial ? 'Save Changes' : 'Add Task')}
        </button>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState(null);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, uRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        isAdmin ? api.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setUsers(uRes.data);
    } catch { setError('Project not found.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAddTask = async (form) => {
    setSaving(true); setError('');
    try { await api.post('/tasks', form); setModal(null); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleEditTask = async (form) => {
    setSaving(true); setError('');
    try { await api.put(`/tasks/${modal.task._id}`, form); setModal(null); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); load(); }
    catch { setError('Failed to delete task.'); }
  };

  const handleStatusChange = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); load(); }
    catch { /* silent */ }
  };

  const byStatus = (s) => tasks.filter(t => t.status === s);

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (!project) return (
    <div className="page">
      <div className="empty-state"><div className="empty-state-icon">⚠</div><h3>{error || 'Project not found'}</h3><Link to="/projects" className="btn btn-primary" style={{ marginTop:16 }}>← Back</Link></div>
    </div>
  );

  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter(t => t.status === 'done').length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="page" style={{ animation:'slideUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <button onClick={() => navigate('/projects')} className="btn btn-ghost btn-sm" style={{ marginBottom:12 }}>← Back to Projects</button>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 className="page-title">{project.title}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setModal('add-task')}>+ Add Task</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Progress bar */}
      <div className="card" style={{ marginBottom:24, padding:'16px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:'0.875rem' }}>
          <span style={{ fontWeight:600 }}>Overall Progress</span>
          <span style={{ color:'var(--accent)' }}>{doneTasks}/{totalTasks} tasks · {pct}%</span>
        </div>
        <div className="project-progress-bar" style={{ height:8 }}>
          <div className="project-progress-fill" style={{ width:`${pct}%` }} />
        </div>
        <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
          {[['To Do', byStatus('todo').length, 'var(--muted2)'], ['In Progress', byStatus('in-progress').length, 'var(--accent2)'], ['Done', doneTasks, 'var(--success)']].map(([l,c,col]) => (
            <span key={l} style={{ fontSize:'0.8rem', color:col }}><strong>{c}</strong> {l}</span>
          ))}
          <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--muted2)' }}>
            {(project.members?.length ?? 0)} member{project.members?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <div key={col} className="kanban-column">
            <div className="kanban-col-header">
              <span className="kanban-col-title">
                <span style={{ color: col==='todo' ? 'var(--muted2)' : col==='in-progress' ? 'var(--accent2)' : 'var(--success)' }}>●</span>
                {statusLabel[col]}
              </span>
              <span className="kanban-col-count">{byStatus(col).length}</span>
            </div>
            <div className="kanban-tasks">
              {byStatus(col).length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:'0.8rem' }}>No tasks</div>
              ) : byStatus(col).map(task => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = due && due < new Date() && task.status !== 'done';
                const assignee = task.assignedTo;
                return (
                  <div key={task._id} className={`task-card${isOverdue ? ' overdue' : ''}`} style={{ borderLeft:`3px solid ${priColor[task.priority] || 'var(--muted)'}` }}>
                    <div className="task-card-title">{task.title}</div>
                    {task.description && <p style={{ fontSize:'0.78rem', color:'var(--muted2)', marginBottom:8, lineHeight:1.4 }}>{task.description.slice(0,80)}{task.description.length > 80 ? '…' : ''}</p>}
                    <div className="task-card-meta">
                      <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
                      <span className="badge" style={{ background:`${priColor[task.priority]}18`, color:priColor[task.priority] }}>{task.priority}</span>
                    </div>
                    <div className="task-card-footer">
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {assignee && (
                          <div className="user-avatar-sm" style={{ width:22, height:22, fontSize:'0.65rem' }} title={assignee.name}>{assignee.name?.[0]?.toUpperCase()}</div>
                        )}
                        {due && <span className={`due-date${isOverdue ? ' overdue' : ''}`}>{isOverdue ? '⚑ ' : ''}{due.toLocaleDateString()}</span>}
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        {/* Quick status cycling */}
                        {task.status !== 'done' && (
                          <>
                            <button className="btn btn-ghost btn-sm" style={{ padding:'4px 8px', fontSize:'0.7rem', color:'var(--success)', borderColor:'var(--success)' }} onClick={() => handleStatusChange(task._id, 'done')}>✔ Mark as Done</button>
                            <button className="btn-icon" style={{ width:24, height:24, fontSize:'0.7rem' }} title="Move forward" onClick={() => handleStatusChange(task._id, task.status === 'todo' ? 'in-progress' : 'done')}>→</button>
                          </>
                        )}
                        <button className="btn-icon" style={{ width:24, height:24, fontSize:'0.7rem' }} onClick={() => setModal({ task })}>✎</button>
                        {isAdmin && <button className="btn-icon" style={{ width:24, height:24, fontSize:'0.7rem', color:'var(--danger)' }} onClick={() => handleDeleteTask(task._id)}>✕</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {modal === 'add-task' && (
        <Modal title="Add Task" onClose={() => setModal(null)}>
          <TaskForm projectId={id} users={users} onSubmit={handleAddTask} loading={saving} />
        </Modal>
      )}
      {modal?.task && (
        <Modal title="Edit Task" onClose={() => setModal(null)}>
          <TaskForm initial={modal.task} projectId={id} users={users} onSubmit={handleEditTask} loading={saving} />
        </Modal>
      )}
    </div>
  );
}
