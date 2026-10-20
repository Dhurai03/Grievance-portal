import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText, Clock, CheckCircle, AlertTriangle, PlusCircle, ArrowRight
} from 'lucide-react';

const STATUS_COLORS = {
  SUBMITTED: { bg: '#DBEAFE', color: '#0369A1' },
  UNDER_REVIEW: { bg: '#FEF3C7', color: '#92400E' },
  IN_PROGRESS: { bg: '#EDE9FE', color: '#3730A3' },
  RESOLVED: { bg: '#D1FAE5', color: '#065F46' },
  CLOSED: { bg: '#F1F5F9', color: '#374151' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B' },
  ESCALATED: { bg: '#FEE2E2', color: '#7F1D1D' },
};

const PRIORITY_COLORS = { LOW: '#059669', MEDIUM: '#D97706', HIGH: '#EA580C', CRITICAL: '#DC2626' };

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
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-text">
          <div className="welcome-banner-tag">🎓 Student Portal</div>
          <h1>Good day, {user?.name?.split(' ')[0]}!</h1>
          <p>
            {user?.studentId && <span style={{ fontFamily: 'ui-monospace, monospace' }}>{user.studentId} · </span>}
            {user?.department}{user?.year ? ` · Year ${user.year}` : ''}
          </p>
        </div>
        <div className="welcome-banner-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('#student/submit')}>
            <PlusCircle size={15} /> New Grievance
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        {[
          { label: 'Total Submitted', value: stats.total, icon: FileText, color: '#2563EB', gradient: '#2563EB' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#D97706', gradient: '#D97706' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: '#059669', gradient: '#059669' },
          { label: 'Escalated', value: stats.escalated, icon: AlertTriangle, color: '#DC2626', gradient: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--gradient': s.gradient }}>
            <div className="stat-icon" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Grievances Full Width */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0 }}>
              Recent Grievances
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Track the progress, departmental routing, and resolution updates of your complaints
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('#student/grievances')}>
            View All Grievances <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
            <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              No Grievances Yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px' }}>
              Submit your first grievance and our AI engine will automatically route it to the right department instantly.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('#student/submit')}>
              <PlusCircle size={15} /> Submit Grievance
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recent.map(g => {
              const sc = STATUS_COLORS[g.status] || STATUS_COLORS.SUBMITTED;
              const pc = PRIORITY_COLORS[g.priority] || '#D97706';
              return (
                <div key={g._id} className="grievance-card" style={{ '--priority-color': pc }}
                  onClick={() => navigate(`#grievance/${g._id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: sc.color }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{g.title}</span>
                        <span className={`badge badge-${g.status?.toLowerCase()}`}>{g.status?.replace('_', ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>{g.trackingId}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.department?.name || g.category}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(g.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`badge badge-${g.priority?.toLowerCase()}`} style={{ flexShrink: 0 }}>{g.priority}</span>
                  </div>
                  {g.isSlaBreach && (
                    <div style={{ marginTop: '10px', padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '0.75rem', color: '#991B1B' }}>
                      ⚠️ SLA breach — escalated to administration
                    </div>
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
