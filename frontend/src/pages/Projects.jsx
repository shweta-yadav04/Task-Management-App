import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const PROJECT_COLORS = ['#7C6FFF','#00CFFF','#10B981','#F59E0B','#EF4444','#EC4899'];
const statusDot = { active: 'dot-active', 'on-hold': 'dot-hold', completed: 'dot-done' };

function ProjectForm({ initial, users, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'active',
    members: initial?.members?.map(m => m._id ?? m) ?? [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleMember = (id) =>
    set('members', form.members.includes(id)
      ? form.members.filter(m => m !== id)
      : [...form.members, id]);
  return (
    <div className="modal-body">
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Project name" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief overview..." style={{ resize: 'vertical' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      {users.length > 0 && (
        <div className="form-group">
          <label className="form-label">Team Members</label>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:160, overflowY:'auto' }}>
            {users.map(u => (
              <label key={u._id} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'6px 10px', borderRadius:8, background: form.members.includes(u._id) ? 'rgba(124,111,255,0.1)' : 'transparent', border:`1px solid ${form.members.includes(u._id) ? 'rgba(124,111,255,0.4)' : 'transparent'}`, transition:'all 0.15s' }}>
                <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} style={{ accentColor:'var(--accent)' }} />
                <span style={{ fontSize:'0.875rem' }}>{u.name}</span>
                <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}`} style={{ marginLeft:'auto' }}>{u.role}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={() => onSubmit(form)} disabled={loading || !form.title.trim()}>
          {loading ? <span className="spinner" /> : (initial ? 'Save Changes' : 'Create Project')}
        </button>
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [modal,    setModal]    = useState(null);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        api.get('/projects'),
        isAdmin ? api.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch { setError('Failed to load.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    setSaving(true); setError('');
    try { await api.post('/projects', form); setModal(null); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to create.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true); setError('');
    try { await api.put(`/projects/${modal.project._id}`, form); setModal(null); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try { await api.delete(`/projects/${id}`); load(); }
    catch { setError('Failed to delete.'); }
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="page" style={{ animation: 'slideUp 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" id="create-project-btn" onClick={() => setModal('create')}>
            + New Project
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        {['all','active','on-hold','completed'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.replace('-',' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="project-grid">
          {[...Array(4)].map((_,i) => <div key={i} className="project-card" style={{ opacity:0.4, height:200, animation:'pulse 1.5s ease infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <h3>No projects found</h3>
          <p>{isAdmin ? 'Create your first project.' : 'You haven\'t been added to a project yet.'}</p>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((proj, i) => {
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
            const pct = proj.taskCount > 0 ? Math.round((proj.doneCount / proj.taskCount) * 100) : 0;
            return (
              <div key={proj._id} className="project-card" style={{ '--project-color': color }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <Link to={`/projects/${proj._id}`} className="project-card-title" style={{ flex:1 }}>{proj.title}</Link>
                  <div style={{ display:'flex', gap:6, marginLeft:10, flexShrink:0, alignItems:'center' }}>
                    <span className={`status-dot ${statusDot[proj.status]}`} />
                    {isAdmin && (
                      <>
                        <button className="btn-icon" style={{ width:28, height:28 }} onClick={() => setModal({ project: proj })}>✎</button>
                        <button className="btn-icon" style={{ width:28, height:28, color:'var(--danger)' }} onClick={() => handleDelete(proj._id)}>✕</button>
                      </>
                    )}
                  </div>
                </div>
                <p className="project-card-desc">{proj.description || 'No description.'}</p>
                <div className="project-progress-bar">
                  <div className="project-progress-fill" style={{ width:`${pct}%` }} />
                </div>
                <div className="project-meta">
                  <div className="member-avatars">
                    {(proj.members ?? []).slice(0,4).map((m, mi) => (
                      <div key={m._id ?? mi} className="member-avatar" title={m.name ?? ''}>{(m.name ?? '?')[0]?.toUpperCase()}</div>
                    ))}
                    {(proj.members?.length ?? 0) > 4 && <div className="member-avatar" style={{ background:'var(--surface2)', color:'var(--muted2)' }}>+{proj.members.length - 4}</div>}
                  </div>
                  <span>{proj.taskCount ?? 0} tasks · {pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === 'create' && (
        <Modal title="New Project" onClose={() => setModal(null)}>
          <ProjectForm users={users} onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}
      {modal?.project && (
        <Modal title="Edit Project" onClose={() => setModal(null)}>
          <ProjectForm initial={modal.project} users={users} onSubmit={handleEdit} loading={saving} />
        </Modal>
      )}
    </div>
  );
}
