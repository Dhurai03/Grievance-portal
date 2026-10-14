import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText, Clock, CheckCircle, AlertTriangle, PlusCircle, ArrowRight,
  Bell, TrendingUp, BarChart2, Info, Shield
} from 'lucide-react';

const STATUS_COLORS = {
  SUBMITTED: { bg: 'rgba(79,195,247,0.15)', color: '#4FC3F7', icon: '📬' },
  UNDER_REVIEW: { bg: 'rgba(255,179,71,0.15)', color: '#FFB347', icon: '🔍' },
  IN_PROGRESS: { bg: 'rgba(108,99,255,0.15)', color: '#6C63FF', icon: '⚙️' },
  RESOLVED: { bg: 'rgba(0,212,170,0.15)', color: '#00D4AA', icon: '✅' },
  CLOSED: { bg: 'rgba(155,155,191,0.15)', color: '#9B9BBF', icon: '🔒' },
  REJECTED: { bg: 'rgba(255,107,107,0.15)', color: '#FF6B6B', icon: '❌' },
  ESCALATED: { bg: 'rgba(255,68,68,0.15)', color: '#FF4444', icon: '🚨' },
};

const PRIORITY_COLORS = { LOW: '#00D4AA', MEDIUM: '#FFB347', HIGH: '#FF8C42', CRITICAL: '#FF4444' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function StudentDashboard({ navigate }) {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, escalated: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getGrievances({ limit: 50 });
        const g = data.grievances || [];
        setGrievances(g);
        setStats({
          total: g.length,
          pending: g.filter(x => ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(x.status)).length,
          resolved: g.filter(x => ['RESOLVED', 'CLOSED'].includes(x.status)).length,
          escalated: g.filter(x => x.status === 'ESCALATED').length,
        });
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const recent = grievances.slice(0, 5);

  return (
    <div className="page-content">
      {/* Welcome Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,170,0.08))',
        border: '1px solid var(--border-active)', borderRadius: '20px',
        padding: '24px 28px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
            Good Morning, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.studentId && <><span className="font-mono">{user.studentId}</span> • </>}
            {user?.department} {user?.year ? `• Year ${user.year}` : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('#student/submit')}>
          <PlusCircle size={16} /> New Grievance
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Submitted', value: stats.total, icon: FileText, color: '#6C63FF', gradient: 'linear-gradient(90deg, #6C63FF, #8B85FF)' },
          { label: 'Pending Resolution', value: stats.pending, icon: Clock, color: '#FFB347', gradient: 'linear-gradient(90deg, #FFB347, #FF8C42)' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: '#00D4AA', gradient: 'linear-gradient(90deg, #00D4AA, #4FC3F7)' },
          { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, color: '#FF4444', gradient: 'linear-gradient(90deg, #FF4444, #FF6B6B)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--gradient': s.gradient }}>
            <div className="stat-icon" style={{ background: `${s.color}20`, border: `1px solid ${s.color}30` }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Content Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Recent Grievances */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Recent Grievances</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('#student/grievances')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '48px' }}>
              <FileText size={40} />
              <h3>No Grievances Yet</h3>
              <p>Submit your first grievance and our AI will route it to the right department instantly.</p>
              <button className="btn btn-primary" onClick={() => navigate('#student/submit')}>
                <PlusCircle size={16} /> Submit Grievance
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recent.map(g => {
                const sc = STATUS_COLORS[g.status] || STATUS_COLORS.SUBMITTED;
                const pc = PRIORITY_COLORS[g.priority] || '#FFB347';
                return (
                  <div key={g._id} className="grievance-card" style={{ '--priority-color': pc }}
                    onClick={() => navigate(`#grievance/${g._id}`)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '1.3rem', marginTop: '2px' }}>{sc.icon}</span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{g.title}</span>
                          <span className={`badge badge-${g.status?.toLowerCase()}`}>{g.status?.replace('_', ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{g.trackingId}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.department?.name || g.category}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(g.createdAt)}</span>
                        </div>
                      </div>
                      <span className={`badge badge-${g.priority?.toLowerCase()}`} style={{ flexShrink: 0 }}>{g.priority}</span>
                    </div>
                    {g.isSlaBreach && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: '#FF4444' }}>
                        ⚠️ SLA breach — escalated to administration
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: PlusCircle, label: 'Submit New Grievance', hash: '#student/submit', color: '#6C63FF' },
                { icon: FileText, label: 'My All Grievances', hash: '#student/grievances', color: '#4FC3F7' },
                { icon: Shield, label: 'Track by ID', hash: '#track', color: '#00D4AA' },
              ].map(a => (
                <button key={a.hash} onClick={() => navigate(a.hash)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition)',
                  fontSize: '0.85rem', fontWeight: 500, fontFamily: 'var(--font-sans)', textAlign: 'left'
                }}>
                  <a.icon size={16} color={a.color} />
                  {a.label}
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Status Legend */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Status Guide</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(STATUS_COLORS).map(([status, sc]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
                  <span>{sc.icon}</span>
                  <span className={`badge badge-${status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Info size={18} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '6px', color: 'var(--primary-light)' }}>💡 Pro Tip</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Describe your issue in detail. Our AI reads your complaint and automatically routes it to the most relevant department for faster resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
