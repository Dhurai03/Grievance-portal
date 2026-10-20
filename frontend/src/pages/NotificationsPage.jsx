import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bell, Check, CheckCheck, Clock, FileText, AlertTriangle,
  ArrowRight, Shield, MessageSquare, RefreshCw
} from 'lucide-react';

const NOTIF_ICONS = {
  GRIEVANCE_SUBMITTED: { icon: '📬', color: '#2563EB', bg: '#EFF6FF' },
  STATUS_UPDATED: { icon: '🔄', color: '#4F46E5', bg: '#EEF2FF' },
  GRIEVANCE_ASSIGNED: { icon: '📋', color: '#059669', bg: '#ECFDF5' },
  SLA_BREACH: { icon: '🚨', color: '#DC2626', bg: '#FEF2F2' },
  ESCALATED: { icon: '⚠️', color: '#D97706', bg: '#FEF3C7' },
  NEW_COMMENT: { icon: '💬', color: '#2563EB', bg: '#EFF6FF' },
  DEFAULT: { icon: '🔔', color: '#2563EB', bg: '#EFF6FF' }
};

export default function NotificationsPage({ navigate }) {
  const { fetchUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (fetchUnreadCount) fetchUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (fetchUnreadCount) fetchUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (n) => {
    if (!n.isRead) handleMarkAsRead(n._id);
    if (n.link) {
      navigate(n.link);
    } else if (n.grievance) {
      const gId = typeof n.grievance === 'object' ? n.grievance._id : n.grievance;
      navigate(`#grievance/${gId}`);
    }
  };

  const filtered = unreadOnly ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="page-content" style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '14px', marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '3px', color: 'var(--text-primary)' }}>
            Notifications & Updates
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'All caught up! No unread notifications.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadNotifications}>
            <RefreshCw size={14} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button className="btn btn-primary btn-sm" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <button
          onClick={() => setUnreadOnly(false)}
          style={{
            padding: '5px 12px', borderRadius: '6px',
            border: !unreadOnly ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            background: !unreadOnly ? 'var(--primary)' : 'var(--bg-secondary)',
            color: !unreadOnly ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer'
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          style={{
            padding: '5px 12px', borderRadius: '6px',
            border: unreadOnly ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            background: unreadOnly ? 'var(--primary)' : 'var(--bg-secondary)',
            color: unreadOnly ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer'
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px' }}>
            <Bell size={36} color="var(--text-muted)" />
            <h3 style={{ marginTop: '10px' }}>No Notifications</h3>
            <p>You will receive updates when your grievances are reviewed or resolved.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((n, idx) => {
              const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.DEFAULT;

              return (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: '14px', cursor: 'pointer',
                    background: n.isRead ? 'transparent' : '#F8FAFC',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : '#F8FAFC'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', flexShrink: 0, marginTop: '2px'
                    }}>
                      {meta.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: n.isRead ? 600 : 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: 'var(--primary)', flexShrink: 0
                          }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      style={{ padding: '6px', flexShrink: 0 }}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
