import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const saveSession = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      saveSession(data.token, data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(msg); return { success: false, message: msg };
    } finally { setLoading(false); }
  };

  const login = async (email, password) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data.token, data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setError(msg); return { success: false, message: msg };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
