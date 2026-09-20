import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  FileText, 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  Building2, 
  Settings, 
  ShieldAlert 
} from 'lucide-react';

export default function AppLayout({ children, navigate, activeTab }) {
  const { user, logout, notifications, markNotificationRead } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Toggle theme class on body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('#landing');
  };

  const handleNotificationClick = async (notif) => {
    await markNotificationRead(notif.id);
    setShowNotifications(false);
    if (notif.grievance_id) {
      navigate(`#grievance/detail/${notif.grievance_id}`);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  // Sidebar link generator based on roles
  const getSidebarLinks = () => {
    if (!user) return [];

    const base = [
      { name: 'Dashboard', hash: `#${user.role}/dashboard`, icon: LayoutDashboard },
    ];

    if (user.role === 'citizen') {
      base.push(
        { name: 'Submit Grievance', hash: '#citizen/submit', icon: PlusCircle },
        { name: 'Track Grievance', hash: '#grievance/track', icon: Search }
      );
    } else if (user.role === 'admin') {
      base.push(
        { name: 'Audit Trail Logs', hash: '#admin/dashboard', icon: FileText } // admin handles this inside the dashboard tab
      );
    }

    return base;
  };

  const links = getSidebarLinks();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-color)',
        borderRadius: 0,
        height: '64px'
      }}>
        {/* Left Navbar Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="btn btn-secondary" 
            style={{ padding: '6px', display: 'none', justifySelf: 'center' }}
            id="mobile-menu-trigger"
          >
            <Menu size={20} />
          </button>
          
          <div 
            onClick={() => navigate(user ? `#${user.role}/dashboard` : '#landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Building2 size={28} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
              JanSuniye
            </span>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 700, 
              padding: '2px 6px', 
              background: 'var(--primary-light)', 
              color: 'var(--primary)', 
              borderRadius: '4px',
              border: '1px solid var(--border-color)' 
            }}>
              CIVIC PORTAL
            </span>
          </div>
        </div>

        {/* Right Navbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Theme toggler */}
          <button 
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-secondary)' }}
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-secondary)', position: 'relative' }}
              aria-label="View notifications"
            >
              <Bell size={20} />
              {unreadNotifCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'var(--color-critical)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--bg-secondary)'
                }}>
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                padding: '8px 0',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{unreadNotifCount} unread</span>
                </div>
                
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: notif.is_read ? 'transparent' : 'var(--primary-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'var(--transition)'
                      }}
                      className="notif-item"
                    >
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: notif.is_read ? 400 : 600, lineHeight: 1.3 }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User profile capsule */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {user.name.charAt(0)}
              </div>
              <div style={{ display: 'none', flexDirection: 'column', textAlign: 'left' }} id="user-info-text">
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user.role}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        {/* Desktop Left Sidebar */}
        <aside className="glass-panel" style={{
          width: 'var(--sidebar-width)',
          borderRight: '1px solid var(--border-color)',
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }} id="desktop-sidebar">
          {/* Top Sidebar Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Navigation
              </p>
            </div>
            
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.hash;
              
              return (
                <button
                  key={link.name}
                  onClick={() => navigate(link.hash)}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <Icon size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>{link.name}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ padding: '0 8px 12px 8px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                {user?.role === 'officer' ? `${user?.officer?.designation || 'Officer'} (${user?.officer?.department_name || 'Unassigned'})` : user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                color: 'var(--color-error)',
                border: '1px solid transparent',
                background: 'rgba(220, 38, 38, 0.05)'
              }}
            >
              <LogOut size={18} />
              <span style={{ fontSize: '0.9rem' }}>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Slide-out Sidebar drawer */}
        {mobileSidebarOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex'
          }}>
            <div className="glass-panel animate-slide" style={{
              width: '280px',
              height: '100%',
              borderRadius: 0,
              border: 'none',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={24} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>JanSuniye</span>
                  </div>
                  <button 
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = activeTab === link.hash;
                    
                    return (
                      <button
                        key={link.name}
                        onClick={() => {
                          navigate(link.hash);
                          setMobileSidebarOpen(false);
                        }}
                        className="btn"
                        style={{
                          justifyContent: 'flex-start',
                          background: isActive ? 'var(--primary)' : 'transparent',
                          color: isActive ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px'
                        }}
                      >
                        <Icon size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>{link.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ padding: '0 8px 12px 8px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-error)' }}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div style={{ flex: 1 }} onClick={() => setMobileSidebarOpen(false)}></div>
          </div>
        )}

        {/* Dynamic Page Views Content Body */}
        <main style={{
          flex: 1,
          padding: '30px 24px',
          overflowY: 'auto',
          maxWidth: '100%'
        }}>
          {children}
        </main>
      </div>

      {/* Responsive Inline Media Queries helper styling */}
      <style>{`
        @media (max-width: 768px) {
          #desktop-sidebar { display: none !important; }
          #mobile-menu-trigger { display: flex !important; }
          #user-info-text { display: none !important; }
        }
        @media (min-width: 769px) {
          #user-info-text { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
