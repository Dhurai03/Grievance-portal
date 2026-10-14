import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bell, Check, CheckCheck, Clock, FileText, AlertTriangle,
  ArrowRight, Shield, MessageSquare, RefreshCw
} from 'lucide-react';

const NOTIF_ICONS = {
  GRIEVANCE_SUBMITTED: { icon: '📬', color: '#4FC3F7', bg: 'rgba(79,195,247,0.15)' },
  STATUS_UPDATED: { icon: '🔄', color: '#6C63FF', bg: 'rgba(108,99,255,0.15)' },
  GRIEVANCE_ASSIGNED: { icon: '📋', color: '#00D4AA', bg: 'rgba(0,212,170,0.15)' },
  SLA_BREACH: { icon: '🚨', color: '#FF4444', bg: 'rgba(255,68,68,0.15)' },
  ESCALATED: { icon: '⚠️', color: '#FFB347', bg: 'rgba(255,179,71,0.15)' },
  NEW_COMMENT: { icon: '💬', color: '#4FC3F7', bg: 'rgba(79,195,247,0.15)' },
  DEFAULT: { icon: '🔔', color: '#6C63FF', bg: 'rgba(108,99,255,0.15)' }
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
        flexWrap: 'wrap', gap: '16px', marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
            Notifications & Updates 🔔
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'All caught up! No unread notifications.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadNotifications}>
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setUnreadOnly(false)}
          style={{
            padding: '6px 14px', borderRadius: '10px', border: 'none',
            background: !unreadOnly ? 'var(--primary)' : 'var(--bg-card)',
            color: !unreadOnly ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          style={{
            padding: '6px 14px', borderRadius: '10px', border: 'none',
            background: unreadOnly ? 'var(--primary)' : 'var(--bg-card)',
            color: unreadOnly ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <Bell size={40} color="var(--text-muted)" />
            <h3 style={{ marginTop: '12px' }}>No Notifications</h3>
            <p>You'll receive real-time alerts whenever your grievances are updated or reviewed.</p>
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
                    padding: '16px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: '16px', cursor: 'pointer',
                    background: n.isRead ? 'transparent' : 'rgba(108,99,255,0.04)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(108,99,255,0.04)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', flexShrink: 0, marginTop: '2px'
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
