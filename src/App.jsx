import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useHashRouter } from './hooks/useHashRouter';

// Layout & Pages
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import GrievanceSubmissionPage from './pages/GrievanceSubmissionPage';
import GrievanceTrackingPage from './pages/GrievanceTrackingPage';
import GrievanceDetailPage from './pages/GrievanceDetailPage';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AIChatBot from './components/AIChatBot';

function AppContent() {
  const { user, loading } = useAuth();
  const { hash, navigate, route } = useHashRouter();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Loading JanSuniye Portal...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Route protection redirects
  const requireAuth = (allowedRoles = []) => {
    if (!user) {
      setTimeout(() => navigate('#login'), 0);
      return false;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      setTimeout(() => navigate(`#${user.role}/dashboard`), 0);
      return false;
    }
    return true;
  };

  const requireGuest = () => {
    if (user) {
      setTimeout(() => navigate(`#${user.role}/dashboard`), 0);
      return false;
    }
    return true;
  };

  // Render content based on Active Hash route Base
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

      case 'citizen':
        if (!requireAuth(['citizen'])) return null;
        
        if (route.sub === 'submit') {
          return (
            <AppLayout navigate={navigate} activeTab="#citizen/submit">
              <GrievanceSubmissionPage navigate={navigate} />
            </AppLayout>
          );
        }
        // Default citizen dashboard
        return (
          <AppLayout navigate={navigate} activeTab="#citizen/dashboard">
            <CitizenDashboard navigate={navigate} />
          </AppLayout>
        );

      case 'officer':
        if (!requireAuth(['officer'])) return null;
        return (
          <AppLayout navigate={navigate} activeTab="#officer/dashboard">
            <OfficerDashboard navigate={navigate} />
          </AppLayout>
        );

      case 'admin':
        if (!requireAuth(['admin'])) return null;
        return (
          <AppLayout navigate={navigate} activeTab="#admin/dashboard">
            <AdminDashboard navigate={navigate} />
          </AppLayout>
        );

      case 'grievance':
        if (route.sub === 'track') {
          // If logged in, render inside layout, else public
          if (user) {
            return (
              <AppLayout navigate={navigate} activeTab="#grievance/track">
                <GrievanceTrackingPage navigate={navigate} route={route} />
              </AppLayout>
            );
          }
          return <GrievanceTrackingPage navigate={navigate} route={route} />;
        }
        
        if (route.sub === 'detail') {
          // Detail page requires login
          if (!requireAuth()) return null;
          return (
            <AppLayout navigate={navigate} activeTab="">
              <GrievanceDetailPage navigate={navigate} id={route.id} />
            </AppLayout>
          );
        }
        
        // Fallback
        setTimeout(() => navigate('#landing'), 0);
        return null;

      default:
        setTimeout(() => navigate('#landing'), 0);
        return null;
    }
  };

  return (
    <>
      {renderRoute()}
      <AIChatBot navigate={navigate} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
