import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText, Clock, CheckCircle, AlertTriangle, ArrowRight,
  RefreshCw, Search, Filter, Shield, User, Building2,
  Calendar, CheckCircle2, ChevronRight, MessageSquare
} from 'lucide-react';

const STATUS_COLORS = {
  SUBMITTED: { bg: '#DBEAFE', color: '#0369A1', icon: '📬', label: 'Submitted' },
  UNDER_REVIEW: { bg: '#FEF3C7', color: '#92400E', icon: '🔍', label: 'Under Review' },
  IN_PROGRESS: { bg: '#EDE9FE', color: '#3730A3', icon: '⚙️', label: 'In Progress' },
  RESOLVED: { bg: '#D1FAE5', color: '#065F46', icon: '✅', label: 'Resolved' },
  CLOSED: { bg: '#F1F5F9', color: '#374151', icon: '🔒', label: 'Closed' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', icon: '❌', label: 'Rejected' },
  ESCALATED: { bg: '#FEE2E2', color: '#7F1D1D', icon: '🚨', label: 'Escalated' },
};

const PRIORITY_COLORS = {
  LOW: '#059669',
  MEDIUM: '#D97706',
  HIGH: '#EA580C',
  CRITICAL: '#DC2626'
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSla(deadline, status) {
  if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(status)) return { text: 'Completed', color: '#00D4AA', isBreached: false };
  if (!deadline) return { text: 'No SLA', color: 'var(--text-muted)', isBreached: false };
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs < 0) return { text: 'SLA Breached', color: '#FF4444', isBreached: true };
  const hours = Math.round(diffMs / 3600000);
  if (hours < 24) return { text: `${hours}h remaining`, color: '#FFB347', isBreached: false };
  const days = Math.round(hours / 24);
  return { text: `${days}d remaining`, color: '#4FC3F7', isBreached: false };
}

export default function OfficerDashboard({ navigate }) {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, escalated: 0, breached: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getGrievances({ limit: 100 });
      const list = data.grievances || [];
      setGrievances(list);

      const breachedCount = list.filter(g => {
        if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(g.status)) return false;
        return g.slaDeadline && new Date(g.slaDeadline).getTime() < Date.now();
      }).length;

      setStats({
        total: list.length,
        pending: list.filter(x => ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(x.status)).length,
        resolved: list.filter(x => ['RESOLVED', 'CLOSED'].includes(x.status)).length,
        escalated: list.filter(x => x.status === 'ESCALATED').length,
        breached: breachedCount
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = grievances.filter(g => {
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'PENDING' && !['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(g.status)) return false;
      if (selectedStatus === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(g.status)) return false;
      if (selectedStatus === 'ESCALATED' && g.status !== 'ESCALATED') return false;
    }
    if (priorityFilter && g.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = g.title?.toLowerCase().includes(q);
      const matchTrack = g.trackingId?.toLowerCase().includes(q);
      const matchCat = g.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchTrack && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-text">
          <div className="welcome-banner-tag">
            {user?.role === 'faculty' ? '👨‍🏫 Faculty Console' : '⚖️ Officer Console'}
          </div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p>
            {user?.designation ? `${user.designation} · ` : ''}
            Manage and resolve student grievances within SLA windows.
          </p>
        </div>
        <div className="welcome-banner-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('#officer/grievances')}>
            <FileText size={14} /> All Tickets
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        {[
          { label: 'Assigned Complaints', value: stats.total, icon: FileText, color: '#2563EB', gradient: '#2563EB' },
          { label: 'Pending Redressal', value: stats.pending, icon: Clock, color: '#D97706', gradient: '#D97706' },
          { label: 'Successfully Resolved', value: stats.resolved, icon: CheckCircle, color: '#059669', gradient: '#059669' },
          { label: 'Escalations / Breaches', value: stats.escalated + stats.breached, icon: AlertTriangle, color: '#DC2626', gradient: '#DC2626' },
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

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by student, ID, or title..."
            className="form-control"
            style={{ paddingLeft: '36px', height: '38px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
          {['ALL', 'PENDING', 'RESOLVED', 'ESCALATED'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                background: selectedStatus === st ? 'var(--primary)' : 'transparent',
                color: selectedStatus === st ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: '8px', padding: '6px 12px',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <select
          className="form-control"
          style={{ width: '150px', height: '38px' }}
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">🚨 Critical</option>
          <option value="HIGH">⚠️ High</option>
          <option value="MEDIUM">⚡ Medium</option>
          <option value="LOW">ℹ️ Low</option>
        </select>
      </div>

      {/* Grievance Table / Cards */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Grievance Redressal Queue ({filtered.length})
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click any ticket to take action</span>
        </div>

        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '70px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <CheckCircle2 size={44} color="#00D4AA" />
            <h3 style={{ marginTop: '12px' }}>Queue is Clear</h3>
            <p>No grievances found matching the selected filter criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((g, idx) => {
              const sc = STATUS_COLORS[g.status] || STATUS_COLORS.SUBMITTED;
              const pc = PRIORITY_COLORS[g.priority] || '#FFB347';
              const sla = formatSla(g.slaDeadline, g.status);

              return (
                <div
                  key={g._id}
                  onClick={() => navigate(`#grievance/${g._id}`)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                    gap: '16px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: sc.bg, color: sc.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', flexShrink: 0
                    }}>
                      {sc.icon}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                          {g.trackingId}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.title}
                        </span>
                        {g.isAiRouted && (
                          <span style={{
                            background: 'rgba(108,99,255,0.15)', color: '#6C63FF',
                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700
                          }}>AI ROUTED</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>📂 {g.category}</span>
                        {g.subcategory && <span>• {g.subcategory}</span>}
                        <span>• Submitted {formatDate(g.createdAt)}</span>
                        {g.submittedBy?.name && (
                          <span>• By {g.isAnonymous ? 'Anonymous Student' : g.submittedBy.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    {/* SLA countdown badge */}
                    <div style={{
                      textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                      fontSize: '0.75rem', fontWeight: 600
                    }}>
                      <span style={{ color: sla.color }}>{sla.text}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target SLA</span>
                    </div>

                    {/* Priority badge */}
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                      background: `${pc}18`, color: pc, border: `1px solid ${pc}30`
                    }}>
                      {g.priority}
                    </span>

                    {/* Status badge */}
                    <span className={`badge badge-${g.status?.toLowerCase()}`}>
                      {g.status?.replace('_', ' ')}
                    </span>

                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
