import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [nameForm, setNameForm] = useState({ name: user?.name ?? '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
    : '?';

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:'', text:'' }), 3000); };

  const handleUpdateName = async () => {
    if (!nameForm.name.trim()) return;
    setSaving(true);
    try {
      await api.put('/users/me', { name: nameForm.name });
      showMsg('success', 'Name updated! Please log in again to see the change.');
    } catch (e) { showMsg('error', e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return showMsg('error', 'Passwords do not match.');
    if (pwForm.newPassword.length < 6) return showMsg('error', 'Password must be at least 6 characters.');
    setSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      showMsg('success', 'Password updated successfully!');
    } catch (e) { showMsg('error', e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const stats = [
    { label: 'Account Type', value: isAdmin ? '🔑 Admin' : '👤 Member', color: isAdmin ? 'var(--accent)' : 'var(--muted2)' },
    { label: 'Email', value: user?.email, color: 'var(--text)' },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long' }) : 'N/A', color: 'var(--muted2)' },
  ];

  return (
    <div className="page" style={{ animation:'slideUp 0.4s ease', maxWidth:700 }}>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>

      {/* Avatar Card */}
      <div className="card" style={{ display:'flex', alignItems:'center', gap:24, marginBottom:24, padding:'28px 32px' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:800, color:'#fff', flexShrink:0, boxShadow:'0 0 24px rgba(124,111,255,0.4)' }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize:'1.3rem', fontWeight:700 }}>{user?.name}</div>
          <div style={{ color:'var(--muted2)', fontSize:'0.875rem', marginTop:4 }}>{user?.email}</div>
          <div style={{ marginTop:8 }}>
            <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>{isAdmin ? '🔑 Admin' : '👤 Member'}</span>
          </div>
        </div>
        <button className="btn btn-danger btn-sm" style={{ marginLeft:'auto' }} onClick={handleLogout}>Logout</button>
      </div>

      {/* Info list */}
      <div className="card" style={{ marginBottom:24, padding:'0' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px', borderBottom: i < stats.length-1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize:'0.85rem', color:'var(--muted2)', fontWeight:500 }}>{s.label}</span>
            <span style={{ fontSize:'0.875rem', color: s.color, fontWeight:600 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['info','password'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'info' ? 'Update Name' : 'Change Password'}
          </button>
        ))}
      </div>

      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      {tab === 'info' && (
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:20 }}>Update Display Name</div>
          <div className="form-group" style={{ marginBottom:20 }}>
            <label className="form-label">Full Name</label>
            <input className="form-input" value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })} placeholder="Your name" />
          </div>
          <button className="btn btn-primary" onClick={handleUpdateName} disabled={saving || !nameForm.name.trim()}>
            {saving ? <span className="spinner" /> : 'Save Name'}
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:20 }}>Change Password</div>
          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:20 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleUpdatePassword} disabled={saving || !pwForm.currentPassword || !pwForm.newPassword}>
            {saving ? <span className="spinner" /> : 'Update Password'}
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ marginTop:24, borderColor:'rgba(239,68,68,0.2)' }}>
          <div style={{ fontWeight:600, marginBottom:4 }}>Danger Zone</div>
          <p style={{ fontSize:'0.85rem', color:'var(--muted2)', marginBottom:16 }}>These actions are irreversible. Be careful.</p>
          <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Log out from all devices?')) handleLogout(); }}>
            Sign Out Everywhere
          </button>
        </div>
      )}
    </div>
  );
}
