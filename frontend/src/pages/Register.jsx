import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form.name, form.email, form.password);
    if (result.success) navigate('/dashboard');
    else setError(result.message);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>TaskSpace</h1>
          <p>Create your account</p>
        </div>
        {/* Removed first user admin message */}
        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password (min. 6 chars)</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <button
            id="reg-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
          </button>
        </form>
        <div className="auth-divider">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
