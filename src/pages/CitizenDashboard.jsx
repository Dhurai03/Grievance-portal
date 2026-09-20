import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, FileText, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export default function CitizenDashboard({ navigate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const statsData = await api.analytics.citizen();
        setStats(statsData);

        const grievanceData = await api.grievances.list();
        setGrievances(grievanceData);
      } catch (err) {
        console.error('Failed to load citizen dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'badge-submitted';
      case 'ACKNOWLEDGED': return 'badge-acknowledged';
      case 'ASSIGNED': return 'badge-assigned';
      case 'UNDER REVIEW': return 'badge-under_review';
      case 'IN PROGRESS': return 'badge-in_progress';
      case 'WAITING FOR CITIZEN': return 'badge-waiting_for_citizen';
      case 'RESOLVED': return 'badge-resolved';
      case 'CLOSED': return 'badge-closed';
      case 'REJECTED': return 'badge-rejected';
      case 'ESCALATED': return 'badge-escalated';
      case 'REOPENED': return 'badge-reopened';
      default: return 'badge-submitted';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'prio-critical';
      case 'HIGH': return 'prio-high';
      case 'MEDIUM': return 'prio-medium';
      case 'LOW': return 'prio-low';
      default: return 'prio-low';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome, {user?.name}</h2>
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-panel skeleton" style={{ height: '100px' }}></div>
          ))}
        </div>
        <div className="glass-panel skeleton" style={{ height: '400px', width: '100%' }}></div>
      </div>
    );
  }

  // Calculate Category distribution for SVG chart
  const categoriesMap = {};
  grievances.forEach(g => {
    const cat = g.category_name || 'General';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });

  const categoriesData = Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));
  const maxCategoryCount = Math.max(...categoriesData.map(c => c.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade">
      {/* Welcome header block */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Citizen Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Trace and manage your filed complaints.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('#citizen/submit')} className="btn btn-primary">
            <PlusCircle size={16} /> File New Grievance
          </button>
          <button onClick={() => navigate('#grievance/track')} className="btn btn-secondary">
            <Search size={16} /> Track a Ticket
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card glow-card">
          <div className="stat-info">
            <h3>My Grievances</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-icon" style={{ color: 'var(--color-neutral)' }}>
            <FileText size={20} />
          </div>
        </div>

        <div className="glass-panel stat-card glow-card" style={{ borderLeft: '3px solid var(--color-warning)' }}>
          <div className="stat-info">
            <h3>Pending Review</h3>
            <p>{stats.pending}</p>
          </div>
          <div className="stat-icon" style={{ color: 'var(--color-warning)' }}>
            <Clock size={20} />
          </div>
        </div>

        <div className="glass-panel stat-card glow-card" style={{ borderLeft: '3px solid var(--color-active)' }}>
          <div className="stat-info">
            <h3>In Progress</h3>
            <p>{stats.inProgress}</p>
          </div>
          <div className="stat-icon" style={{ color: 'var(--color-active)' }}>
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="glass-panel stat-card glow-card" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div className="stat-info">
            <h3>Resolved Cases</h3>
            <p>{stats.resolved}</p>
          </div>
          <div className="stat-icon" style={{ color: 'var(--color-success)' }}>
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Analytics & Charts split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Category Breakdown Custom SVG Chart */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Grievances by Category</h3>
          {categoriesData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No category data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categoriesData.map((cat, idx) => {
                const widthPercent = (cat.count / maxCategoryCount) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{cat.count} ticket(s)</span>
                    </div>
                    {/* SVG Rect/Bar Emulator */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${widthPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--color-active) 0%, var(--color-info) 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic status guide */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Grievance Status Breakdown</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '160px' }}>
            {/* Custom Pie Chart SVG */}
            {stats.total === 0 ? (
              <span style={{ color: 'var(--text-tertiary)' }}>No data to display.</span>
            ) : (
              <svg width="140" height="140" viewBox="0 0 100 100">
                {/* Clean representation of Resolved vs Pending */}
                {(() => {
                  const resolvedAngle = (stats.resolved / stats.total) * 360 || 0;
                  const resolvedRad = (resolvedAngle - 90) * Math.PI / 180;
                  const x = 50 + 40 * Math.cos(resolvedRad);
                  const y = 50 + 40 * Math.sin(resolvedRad);
                  const largeArc = resolvedAngle > 180 ? 1 : 0;
                  
                  if (stats.resolved === stats.total) {
                    return <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-success)" strokeWidth="15" />;
                  } else if (stats.resolved === 0) {
                    return <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-active)" strokeWidth="15" />;
                  }
                  
                  return (
                    <g>
                      {/* Total circle path (used for pending) */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-active)" strokeWidth="15" />
                      {/* Resolved slice path overlay */}
                      <path d={`M 50 10 A 40 40 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke="var(--color-success)" strokeWidth="15" />
                    </g>
                  );
                })()}
                {/* Center text count */}
                <text x="50" y="55" textAnchor="middle" fontWeight="800" fontSize="14" fill="var(--text-primary)">
                  {stats.total}
                </text>
              </svg>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-success)' }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>Resolved ({stats.resolved})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-active)' }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>Active/Pending ({stats.pending + stats.inProgress})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent grievances table/cards */}
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Filed Complaints</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Showing {grievances.length} ticket(s)</span>
        </div>

        {grievances.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <FileText size={40} style={{ opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>You haven't submitted any grievances yet.</p>
            <button onClick={() => navigate('#citizen/submit')} className="btn btn-primary">
              File a Grievance Now
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Grievance ID</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Filed Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((grv) => (
                  <tr key={grv.id}>
                    <td style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-active)' }}>{grv.id}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grv.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {grv.description}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{grv.subcategory_name || grv.category_name}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(grv.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`prio ${getPriorityBadgeClass(grv.priority)}`}>
                        {grv.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(grv.status)}`}>
                        {grv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => navigate(`#grievance/detail/${grv.id}`)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                      >
                        Inspect <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
