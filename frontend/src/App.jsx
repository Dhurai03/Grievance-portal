import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHashRouter } from './hooks/useHashRouter';
import AppLayout from './layouts/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import SubmitGrievancePage from './pages/SubmitGrievancePage';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GrievanceDetailPage from './pages/GrievanceDetailPage';
import GrievanceListPage from './pages/GrievanceListPage';
import TrackGrievancePage from './pages/TrackGrievancePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { user, loading } = useAuth();
  const { hash, navigate, route } = useHashRouter();

  if (loading) {
    return (
      <div className="loading-screen">
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div className="spinner" />
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Loading EduGrieve Portal...</span>
      </div>
    );
  }

  const requireAuth = (allowedRoles = []) => {
    if (!user) { setTimeout(() => navigate('#login'), 0); return false; }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      setTimeout(() => navigate(getDashboardHash(user.role)), 0);
      return false;
    }
    return true;
  };

  const requireGuest = () => {
    if (user) { setTimeout(() => navigate(getDashboardHash(user.role)), 0); return false; }
    return true;
  };

  const getDashboardHash = (role) => {
    if (role === 'student') return '#student/dashboard';
    if (role === 'officer' || role === 'faculty') return '#officer/dashboard';
    if (role === 'admin' || role === 'dean') return '#admin/dashboard';
    return '#landing';
  };

  const renderRoute = () => {
    switch (route.base) {
      case 'landing':
        return <LandingPage navigate={navigate} />;

      case 'login':
        if (!requireGuest()) return null;
        return <LoginPage navigate={navigate} />;

      case 'register':
        if (!requireGuest()) return null;
        return <RegisterPage navigate={navigate} />;

      case 'track':
        return <TrackGrievancePage navigate={navigate} />;

      case 'student':
        if (!requireAuth(['student'])) return null;
        if (route.sub === 'submit') {
          return (
            <AppLayout navigate={navigate} activeTab="#student/submit">
              <SubmitGrievancePage navigate={navigate} />
            </AppLayout>
          );
        }
        if (route.sub === 'grievances') {
          return (
            <AppLayout navigate={navigate} activeTab="#student/grievances">
              <GrievanceListPage navigate={navigate} />
            </AppLayout>
          );
        }
        return (
          <AppLayout navigate={navigate} activeTab="#student/dashboard">
            <StudentDashboard navigate={navigate} />
          </AppLayout>
        );

      case 'officer':
        if (!requireAuth(['officer', 'faculty'])) return null;
        if (route.sub === 'grievances') {
          return (
            <AppLayout navigate={navigate} activeTab="#officer/grievances">
              <GrievanceListPage navigate={navigate} />
            </AppLayout>
          );
        }
        if (route.sub === 'grievance' && route.id) {
          return (
            <AppLayout navigate={navigate} activeTab="#officer/grievances">
              <GrievanceDetailPage navigate={navigate} id={route.id} />
            </AppLayout>
          );
        }
        return (
          <AppLayout navigate={navigate} activeTab="#officer/dashboard">
            <OfficerDashboard navigate={navigate} />
          </AppLayout>
        );

      case 'admin':
        if (!requireAuth(['admin', 'dean'])) return null;
        if (route.sub === 'grievances') {
          return (
            <AppLayout navigate={navigate} activeTab="#admin/grievances">
              <GrievanceListPage navigate={navigate} />
            </AppLayout>
          );
        }
        return (
          <AppLayout navigate={navigate} activeTab={`#admin/${route.sub || 'dashboard'}`}>
            <AdminDashboard navigate={navigate} route={route} />
          </AppLayout>
        );

      case 'grievance':
        if (!requireAuth()) return null;
        return (
          <AppLayout navigate={navigate} activeTab="">
            <GrievanceDetailPage navigate={navigate} id={route.sub || route.id} />
          </AppLayout>
        );

      case 'notifications':
        if (!requireAuth()) return null;
        return (
          <AppLayout navigate={navigate} activeTab="#notifications">
            <NotificationsPage navigate={navigate} />
          </AppLayout>
        );

      case 'profile':
        if (!requireAuth()) return null;
        return (
          <AppLayout navigate={navigate} activeTab="#profile">
            <ProfilePage navigate={navigate} />
          </AppLayout>
        );

      default:
        setTimeout(() => navigate('#landing'), 0);
        return null;
    }
  };

  return renderRoute();
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}