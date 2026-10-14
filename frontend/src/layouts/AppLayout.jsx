import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AIChatBot from '../components/AIChatBot';
import {
  LayoutDashboard, FileText, Bell, LogOut, Menu, X, ChevronRight,
  GraduationCap, BookOpen, Settings, Users, BarChart3, MessageSquare,
  Home, PlusCircle, Search, Shield, UserCircle, Building2
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

const ROLE_COLORS = {
  student: { bg: 'rgba(108,99,255,0.15)', color: '#6C63FF', label: 'Student' },
  faculty: { bg: 'rgba(79,195,247,0.15)', color: '#4FC3F7', label: 'Faculty' },
  officer: { bg: 'rgba(0,212,170,0.15)', color: '#00D4AA', label: 'Officer' },
  admin: { bg: 'rgba(255,107,107,0.15)', color: '#FF6B6B', label: 'Admin' },
  dean: { bg: 'rgba(255,179,71,0.15)', color: '#FFB347', label: 'Dean' },
};

export default function AppLayout({ children, navigate, activeTab }) {
  const { user, logout, unreadNotifications } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handler);
    if (window.innerWidth < 768) setSidebarOpen(false);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const navItems = NAV_CONFIG[user?.role] || NAV_CONFIG.student;
  const roleInfo = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  const handleLogout = () => {
    logout();
    navigate('#landing');
  };

  const handleNavClick = (hash) => {
    navigate(hash);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Overlay (mobile) */}
      {isMobile && sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        width: 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => handleNavClick('#landing')}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(108,99,255,0.4)'
            }}>
              <GraduationCap size={22} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                EduGrieve
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>College Portal</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 700, color: 'white', flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '20px',
                  background: roleInfo.bg, color: roleInfo.color,
                  fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase'
                }}>{roleInfo.label}</span>
              </div>
            </div>
          </div>
          {user?.studentId && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'monospace' }}>
              ID: {user.studentId}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 6px' }}>
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.hash;
            return (
              <button key={item.hash} onClick={() => handleNavClick(item.hash)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: 'none', cursor: 'pointer',
                background: isActive ? 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(108,99,255,0.1))' : 'transparent',
                color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
                textAlign: 'left', transition: 'var(--transition)',
                marginBottom: '2px',
                ...(isActive ? { borderLeft: '3px solid var(--primary)' } : { borderLeft: '3px solid transparent' })
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={() => handleNavClick('#notifications')} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 12px', borderRadius: '10px',
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
            transition: 'var(--transition)', marginBottom: '4px',
            position: 'relative'
          }}>
            <Bell size={18} />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span style={{
                marginLeft: 'auto', background: '#FF6B6B', color: 'white',
                borderRadius: '50%', width: '20px', height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700
              }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
            )}
          </button>
          <button onClick={() => handleNavClick('#profile')} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 12px', borderRadius: '10px',
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
            transition: 'var(--transition)', marginBottom: '4px'
          }}>
            <UserCircle size={18} />
            <span>Profile</span>
          </button>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 12px', borderRadius: '10px',
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: '#FF6B6B', fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
            transition: 'var(--transition)'
          }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: 'var(--header-height)', background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 30,
          backdropFilter: 'blur(20px)',
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '8px',
            border: '1px solid var(--border-color)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0
          }}>
            {sidebarOpen && !isMobile ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {navItems.find(n => n.hash === activeTab)?.label || 'EduGrieve Portal'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => handleNavClick('#notifications')} style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#FF6B6B', color: 'white', borderRadius: '50%',
                  width: '16px', height: '16px', fontSize: '0.6rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
              )}
            </button>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: 'white', cursor: 'pointer',
              flexShrink: 0
            }} onClick={() => handleNavClick('#profile')}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Floating College AI Assistant */}
      <AIChatBot navigate={navigate} />
    </div>
  );
}
