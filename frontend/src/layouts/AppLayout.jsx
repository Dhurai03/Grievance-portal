import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AIChatBot from '../components/AIChatBot';
import {
  LayoutDashboard, FileText, Bell, LogOut, Menu,
  GraduationCap, Users, BarChart3, Building2,
  PlusCircle, Search, Shield, UserCircle
} from 'lucide-react';

const NAV_CONFIG = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, hash: '#student/dashboard' },
    { label: 'Submit Grievance', icon: PlusCircle, hash: '#student/submit' },
    { label: 'My Grievances', icon: FileText, hash: '#student/grievances' },
    { label: 'Track Grievance', icon: Search, hash: '#track' },
  ],
  officer: [
    { label: 'Dashboard', icon: LayoutDashboard, hash: '#officer/dashboard' },
    { label: 'Grievances', icon: FileText, hash: '#officer/grievances' },
    { label: 'Track Grievance', icon: Search, hash: '#track' },
  ],
  faculty: [
    { label: 'Dashboard', icon: LayoutDashboard, hash: '#officer/dashboard' },
    { label: 'Grievances', icon: FileText, hash: '#officer/grievances' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, hash: '#admin/dashboard' },
    { label: 'All Grievances', icon: FileText, hash: '#admin/grievances' },
    { label: 'Departments', icon: Building2, hash: '#admin/departments' },
    { label: 'User Management', icon: Users, hash: '#admin/users' },
    { label: 'Analytics', icon: BarChart3, hash: '#admin/analytics' },
    { label: 'Audit Logs', icon: Shield, hash: '#admin/audit' },
  ],
  dean: [
    { label: 'Dashboard', icon: LayoutDashboard, hash: '#admin/dashboard' },
    { label: 'All Grievances', icon: FileText, hash: '#admin/grievances' },
    { label: 'Analytics', icon: BarChart3, hash: '#admin/analytics' },
    { label: 'Escalated Cases', icon: Shield, hash: '#admin/escalated' },
  ],
};

const ROLE_BADGE_STYLE = {
  student:  { background: 'rgba(59,130,246,0.2)',  color: '#93C5FD', label: 'Student' },
  faculty:  { background: 'rgba(139,92,246,0.2)',  color: '#C4B5FD', label: 'Faculty' },
  officer:  { background: 'rgba(16,185,129,0.2)',  color: '#6EE7B7', label: 'Officer' },
  admin:    { background: 'rgba(239,68,68,0.2)',   color: '#FCA5A5', label: 'Admin' },
  dean:     { background: 'rgba(245,158,11,0.2)',  color: '#FCD34D', label: 'Dean' },
};

export default function AppLayout({ children, navigate, activeTab }) {
  const { user, logout, unreadNotifications } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const navItems = NAV_CONFIG[user?.role] || NAV_CONFIG.student;
  const roleInfo = ROLE_BADGE_STYLE[user?.role] || ROLE_BADGE_STYLE.student;

  const handleLogout = () => {
    logout();
    navigate('#landing');
  };

  const handleNavClick = (hash) => {
    navigate(hash);
    if (isMobile) setSidebarOpen(false);
  };

  const currentPageLabel = navItems.find(n => n.hash === activeTab)?.label || 'EduGrieve Portal';

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay${isMobile && sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ' sidebar-closed'}`}>
        {/* Logo */}
        <div className="sidebar-logo" onClick={() => handleNavClick('#landing')}>
          <div className="sidebar-logo-icon">
            <GraduationCap size={20} color="white" />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title">EduGrieve</div>
            <div className="sidebar-logo-subtitle">Campus Grievance Portal</div>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-user-inner">
            <div className="sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="sidebar-user-name">{user?.name}</div>
              <div
                className="sidebar-role-badge"
                style={{ background: roleInfo.background, color: roleInfo.color }}
              >
                {roleInfo.label}
              </div>
            </div>
          </div>
          {user?.studentId && (
            <div className="sidebar-student-id">{user.studentId}</div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.hash;
            return (
              <button
                key={item.hash}
                onClick={() => handleNavClick(item.hash)}
                className={`sidebar-nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-section-label" style={{ paddingBottom: '8px' }}>Account</div>
          <button
            className="sidebar-footer-item"
            onClick={() => handleNavClick('#notifications')}
          >
            <Bell size={16} />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#DC2626', color: 'white',
                borderRadius: '10px', padding: '0 6px', minWidth: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700
              }}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button
            className="sidebar-footer-item"
            onClick={() => handleNavClick('#profile')}
          >
            <UserCircle size={16} />
            <span>Profile</span>
          </button>
          <button
            className="sidebar-footer-item danger"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`main-content${sidebarOpen && !isMobile ? ' with-sidebar' : ' no-sidebar'}`}>
        {/* Top Header */}
        <header className="top-header">
          <button
            className="header-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={18} />
          </button>

          <div className="header-breadcrumb">
            <span className="header-page-title">{currentPageLabel}</span>
            <span className="header-school-tag">· Campus Grievance Portal</span>
          </div>

          <div className="header-actions">
            <button
              className="header-icon-btn"
              onClick={() => handleNavClick('#notifications')}
              title="Notifications"
            >
              <Bell size={17} />
              {unreadNotifications > 0 && (
                <span className="header-notif-dot">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            <div
              className="header-avatar"
              onClick={() => handleNavClick('#profile')}
              title="Profile"
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Floating AI Assistant */}
      <AIChatBot navigate={navigate} />
    </div>
  );
}
