import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const statusBadge = { todo:'badge-todo', 'in-progress':'badge-progress', done:'badge-done' };
const statusLabel = { todo:'To Do', 'in-progress':'In Progress', done:'Done' };
const priColor    = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' };

function TaskForm({ initial, users, projects, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    priority: initial?.priority ?? 'medium',
    assignedTo: initial?.assignedTo?._id ?? initial?.assignedTo ?? '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0,10) : '',
    project: initial?.project?._id ?? initial?.project ?? '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-body">
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task name" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details..." style={{ resize:'vertical' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Project *</label>
        <select className="form-input" value={form.project} onChange={e => set('project', e.target.value)}>
          <option value="">Select project</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
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
        <button className="btn btn-primary" onClick={() => onSubmit(form)} disabled={loading || !form.title.trim() || !form.project}>
          {loading ? <span className="spinner" /> : (initial ? 'Save Changes' : 'Create Task')}
        </button>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { isAdmin } = useAuth();
  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [modal,    setModal]    = useState(null);
  const [error,    setError]    = useState('');
  const [filters,  setFilters]  = useState({ status:'', priority:'', project:'' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status)  params.set('status',  filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.project)  params.set('project',  filters.project);
      const [tRes, pRes, uRes] = await Promise.all([
        api.get(`/tasks?${params}`),
        api.get('/projects'),
        isAdmin ? api.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setTasks(tRes.data);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch { setError('Failed to load tasks.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const handleCreate = async (form) => {
    setSaving(true); setError('');
    try { await api.post('/tasks', form); setModal(null); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true); setError('');
    try { await api.put(`/tasks/${modal.task._id}`, form); setModal(null); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); load(); }
    catch { setError('Failed.'); }
  };

  const handleStatusChange = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); load(); }
    catch { /* silent */ }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="page" style={{ animation:'slideUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" id="create-task-btn" onClick={() => setModal('create')}>+ New Task</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="filter-select" value={filters.project} onChange={e => setFilter('project', e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        {(filters.status || filters.priority || filters.project) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status:'', priority:'', project:'' })}>✕ Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[...Array(5)].map((_,i) => <div key={i} className="card" style={{ height:72, opacity:0.4, animation:'pulse 1.5s ease infinite' }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <h3>No tasks found</h3>
          <p>{isAdmin ? 'Create a task to get started.' : 'No tasks assigned to you yet.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = due && due < new Date() && task.status !== 'done';
                const assignee = task.assignedTo;
                return (
                  <tr key={task._id} style={isOverdue ? { background:'rgba(239,68,68,0.04)' } : {}}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.875rem', maxWidth:220 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize:'0.75rem', color:'var(--muted2)', marginTop:2 }}>{task.description.slice(0,60)}{task.description.length>60?'…':''}</div>}
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'var(--muted2)' }}>{task.project?.title ?? '—'}</td>
                    <td>
                      <select
                        className="filter-select"
                        style={{ padding:'4px 8px', fontSize:'0.78rem' }}
                        value={task.status}
                        onChange={e => handleStatusChange(task._id, e.target.value)}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td>
                      <span className="badge" style={{ background:`${priColor[task.priority]}18`, color:priColor[task.priority] }}>{task.priority}</span>
                    </td>
                    <td>
                      {assignee ? (
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div className="user-avatar-sm" style={{ width:24, height:24, fontSize:'0.7rem' }}>{assignee.name?.[0]?.toUpperCase()}</div>
                          <span style={{ fontSize:'0.8rem' }}>{assignee.name}</span>
                        </div>
                      ) : <span style={{ color:'var(--muted)', fontSize:'0.8rem' }}>—</span>}
                    </td>
                    <td>
                      {due ? (
                        <span className={`due-date${isOverdue ? ' overdue' : ''}`}>
                          {isOverdue ? '⚑ ' : ''}{due.toLocaleDateString()}
                        </span>
                      ) : <span style={{ color:'var(--muted)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {task.status !== 'done' && (
                          <button className="btn btn-ghost btn-sm" style={{ padding:'4px 8px', fontSize:'0.75rem', color:'var(--success)', borderColor:'var(--success)' }} onClick={() => handleStatusChange(task._id, 'done')}>✔ Mark as Done</button>
                        )}
                        <button className="btn-icon" style={{ width:28, height:28, fontSize:'0.8rem' }} onClick={() => setModal({ task })}>✎</button>
                        {isAdmin && <button className="btn-icon" style={{ width:28, height:28, fontSize:'0.8rem', color:'var(--danger)' }} onClick={() => handleDelete(task._id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'create' && (
        <Modal title="New Task" onClose={() => setModal(null)}>
          <TaskForm projects={projects} users={users} onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}
      {modal?.task && (
        <Modal title="Edit Task" onClose={() => setModal(null)}>
          <TaskForm initial={modal.task} projects={projects} users={users} onSubmit={handleEdit} loading={saving} />
        </Modal>
      )}
    </div>
  );
}
