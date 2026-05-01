import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index              element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/projects"   element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/tasks"      element={<Tasks />} />
            <Route path="/profile"    element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
