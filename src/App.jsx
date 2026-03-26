import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import ConceptTracker from './pages/ConceptTracker';
import QuestionGenerator from './pages/QuestionGenerator';
import TestScheduler from './pages/TestScheduler';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Attendance from './pages/Attendance';

import StudentDashboard from './pages/StudentDashboard';
import LiveAssessments from './pages/LiveAssessments';
import TestInterface from './pages/TestInterface';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 font-bold uppercase tracking-widest text-xs">Authenticating...</div>;

  if (!isAuthenticated) {
    const roleParam = allowedRoles && allowedRoles.length > 0 ? allowedRoles[0] : 'student';
    return <Navigate to={`/${roleParam}/login`} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const role = user.role || 'student';
    const rootPath = role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/student';
    return <Navigate to={rootPath} replace />;
  }

  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    const role = user?.role || 'student';
    return <Navigate to={role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/student'} replace />;
  }
  return <Landing />;
}

function AppRoutes() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'faculty') {
    return (
      <DashboardLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="concepts" element={<ConceptTracker />} />
          <Route path="questions" element={<QuestionGenerator />} />
          <Route path="tests" element={<TestScheduler />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/faculty" replace />} />
        </Routes>
      </DashboardLayout>
    );
  } else if (role === 'student') {
    return (
      <DashboardLayout>
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="assessments" element={<LiveAssessments />} />
          <Route path="concepts" element={<ConceptTracker />} />
          <Route path="test" element={<TestInterface />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </DashboardLayout>
    );
  } else if (role === 'admin') {
    return (
      <DashboardLayout>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </DashboardLayout>
    );
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/faculty/login" element={<Login />} />
            <Route path="/student/login" element={<Login />} />
            <Route path="/faculty/signup" element={<Signup />} />
            <Route path="/student/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/faculty/*" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppRoutes />
              </ProtectedRoute>
            } />
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppRoutes />
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppRoutes />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#1a1a1a',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
