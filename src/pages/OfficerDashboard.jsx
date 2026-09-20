import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  User, 
  Search, 
  Eye, 
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function OfficerDashboard({ navigate }) {
  const { user, addToast } = useAuth();
  
  // Stats & List states
  const [stats, setStats] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [slaFilter, setSlaFilter] = useState(''); // 'breached', 'due_soon', ''

  // Escalate Modal State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateTargetId, setEscalateTargetId] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statData = await api.analytics.officer();
      setStats(statData);

      // 2. Fetch Grievances based on active filters
      const filterPayload = {
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery
      };
      if (slaFilter === 'breached') {
        filterPayload.isBreached = 'true';
      }

      const grievanceList = await api.grievances.list(filterPayload);
      
      // Apply SLA due_soon client filter if needed
      let filteredGrievances = grievanceList;
      if (slaFilter === 'due_soon') {
        const now = new Date();
        filteredGrievances = grievanceList.filter(g => {
          if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(g.status)) return false;
          const deadline = new Date(g.sla_deadline);
          const diffMs = deadline.getTime() - now.getTime();
          return diffMs >= 0 && diffMs <= 24 * 3600000; // < 24 Hours
        });
      }

      setGrievances(filteredGrievances);
    } catch (err) {
      addToast(err.message || 'Failed to fetch dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, slaFilter]); // Trigger load on change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalateReason.trim()) return;

    setEscalating(true);
    try {
      await api.grievances.escalate(escalateTargetId, escalateReason);
      addToast(`Grievance ${escalateTargetId} escalated successfully.`, 'success');
      setShowEscalateModal(false);
      setEscalateReason('');
      loadData(); // Sync stats & list
    } catch (err) {
      addToast(err.message || 'Escalation failed.', 'error');
    } finally {
      setEscalating(false);
    }
  };

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

  const isSLABreached = (g) => {
    if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(g.status)) return false;
    return new Date(g.sla_deadline) < new Date();
  };

  if (loading && !stats) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade">
      
      {/* Welcome Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Officer Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Department: <strong>{user?.officer?.department_name || 'N/A'}</strong> | Designation: <strong>{user?.officer?.designation || 'N/A'}</strong>
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          <RefreshCw size={16} /> Refresh Queue
        </button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="dashboard-grid">
          <div className="glass-panel stat-card glow-card" style={{ cursor: 'pointer' }} onClick={() => { setSlaFilter(''); setStatusFilter(''); }}>
            <div className="stat-info">
              <h3>Assigned Queue</h3>
              <p>{stats.officer.assigned}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-neutral)' }}>
              <User size={20} />
            </div>
          </div>

          <div className="glass-panel stat-card glow-card" style={{ borderLeft: '3px solid var(--color-critical)', cursor: 'pointer' }} onClick={() => { setSlaFilter('breached'); setStatusFilter(''); }}>
            <div className="stat-info">
              <h3>SLA Breached</h3>
              <p>{stats.officer.breached}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-critical)' }}>
              <ShieldAlert size={20} />
            </div>
          </div>

          <div className="glass-panel stat-card glow-card" style={{ borderLeft: '3px solid var(--color-warning)', cursor: 'pointer' }} onClick={() => { setSlaFilter('due_soon'); setStatusFilter(''); }}>
            <div className="stat-info">
              <h3>Due Soon (&lt;24h)</h3>
              <p>{stats.officer.dueSoon}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-warning)' }}>
              <Clock size={20} />
            </div>
          </div>

          <div className="glass-panel stat-card glow-card" style={{ borderLeft: '3px solid var(--color-success)', cursor: 'pointer' }} onClick={() => { setSlaFilter(''); setStatusFilter('RESOLVED'); }}>
            <div className="stat-info">
              <h3>Resolved</h3>
              <p>{stats.officer.resolved}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-success)' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter panel & search */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search assigned grievances by ID, Title, City, Pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-control"
              style={{ paddingLeft: '38px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {/* Filters Select row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-control"
              style={{ padding: '6px 12px', width: '160px', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER REVIEW">Under Review</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="WAITING FOR CITIZEN">Waiting for Citizen</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
              <option value="ESCALATED">Escalated</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-control"
              style={{ padding: '6px 12px', width: '140px', fontSize: '0.85rem' }}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SLA Status:</span>
            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              className="input-control"
              style={{ padding: '6px 12px', width: '160px', fontSize: '0.85rem' }}
            >
              <option value="">All Deadlines</option>
              <option value="breached">SLA Breached (Overdue)</option>
              <option value="due_soon">Due Soon (&lt;24h)</option>
            </select>
          </div>

          {(statusFilter || priorityFilter || slaFilter || searchQuery) && (
            <button 
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
                setSlaFilter('');
                setSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-critical)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grievance Table Card */}
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Grievance Ticket Queue ({grievances.length})</h3>
        </div>

        {grievances.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={40} style={{ opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>No grievances found matching the criteria.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Grievance Info</th>
                  <th>Filed By</th>
                  <th>SLA Deadline</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((grv) => {
                  const isOverdue = isSLABreached(grv);
                  return (
                    <tr key={grv.id} style={{
                      backgroundColor: isOverdue ? 'rgba(185, 28, 28, 0.02)' : 'transparent'
                    }}>
                      <td style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-active)' }}>
                        {grv.id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grv.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {grv.subcategory_name || grv.category_name} • {grv.city}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {grv.citizen_name}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: isOverdue ? 'var(--color-critical)' : 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>{new Date(grv.sla_deadline).toLocaleDateString()}</span>
                          {isOverdue && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-critical)' }}>
                              ⚠️ SLA BREACHED
                            </span>
                          )}
                        </div>
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
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => navigate(`#grievance/detail/${grv.id}`)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px' }}
                            title="Inspect ticket"
                          >
                            <Eye size={14} /> View
                          </button>
                          
                          {grv.status !== 'RESOLVED' && grv.status !== 'CLOSED' && grv.status !== 'REJECTED' && (
                            <button 
                              onClick={() => {
                                setEscalateTargetId(grv.id);
                                setShowEscalateModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', color: 'var(--color-critical)' }}
                              title="Escalate ticket"
                            >
                              Escalate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ESCALATION REQUEST MODAL */}
      {showEscalateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '30px',
            background: 'var(--bg-secondary)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-critical)', marginBottom: '16px' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Escalate Grievance {escalateTargetId}</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
              Escalating this ticket transfers attention to platform administrators. Provide a detailed justification below (e.g. cross-department resource dependency).
            </p>

            <form onSubmit={handleEscalateSubmit}>
              <div className="input-group">
                <label htmlFor="esc-reason">Escalation Reason *</label>
                <textarea 
                  id="esc-reason"
                  placeholder="Enter explanation why this complaint cannot be resolved within the department queue..." 
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="input-control"
                  style={{ minHeight: '100px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEscalateModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  disabled={escalating}
                >
                  {escalating ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
