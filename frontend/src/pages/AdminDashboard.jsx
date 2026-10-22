import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Building2, Users, FileText, Shield, BarChart3,
  AlertTriangle, CheckCircle, Clock, RefreshCw,
  PlusCircle, Search, Edit2, ChevronRight, UserCheck, CheckCircle2
} from 'lucide-react';

export default function AdminDashboard({ navigate, route }) {
  const { user } = useAuth();
  const getNormalizedTab = (sub) => {
    if (!sub || sub === 'dashboard') return 'analytics';
    return sub;
  };
  const [activeTab, setActiveTab] = useState(() => getNormalizedTab(route?.sub));
  const [loading, setLoading] = useState(true);

  // Sync activeTab whenever route.sub changes (e.g. from sidebar clicks)
  useEffect(() => {
    const nextTab = getNormalizedTab(route?.sub);
    setActiveTab(prev => (nextTab && nextTab !== prev ? nextTab : prev));
  }, [route?.sub]);

  // Data states
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [escalatedGrievances, setEscalatedGrievances] = useState([]);

  // Modals & forms
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', contactEmail: '', contactPhone: '' });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('student');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics' || activeTab === 'dashboard') {
        const [ovData, deptData] = await Promise.all([
          api.getAnalyticsOverview().catch(() => null),
          api.getDepartments().catch(() => ({ departments: [] }))
        ]);
        if (ovData?.overview) setOverview(ovData.overview);
        setDepartments(deptData?.departments || []);
      } else if (activeTab === 'departments') {
        const d = await api.getDepartments();
        setDepartments(d?.departments || []);
      } else if (activeTab === 'users') {
        const u = await api.getUsers({ limit: 100 });
        setUsersList(u?.users || []);
      } else if (activeTab === 'audit') {
        const a = await api.getAuditLogs();
        setAuditLogs(a?.logs || []);
      } else if (activeTab === 'escalated') {
        const g = await api.getGrievances({ status: 'ESCALATED', limit: 50 });
        setEscalatedGrievances(g?.grievances || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment(deptForm);
      setActionMsg('Department created successfully!');
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '', description: '', contactEmail: '', contactPhone: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Error creating department');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.updateUserRole(selectedUser._id, { role: newRole });
      setActionMsg(`User ${selectedUser.name} role updated to ${newRole}`);
      setShowRoleModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error updating user role');
    }
  };

  const filteredUsers = usersList.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.studentId?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-text">
          <div className="welcome-banner-tag">
            🎓 {user?.role === 'dean' ? 'Dean Portal' : 'Campus Administration'}
          </div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p>
            {user?.role === 'dean'
              ? 'Oversee all escalated cases, analytics and campus grievance resolution.'
              : 'Full administrative control — departments, SLAs, users, and audit logs.'}
          </p>
        </div>
        <div className="welcome-banner-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
          {activeTab === 'departments' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowDeptModal(true)}>
              <PlusCircle size={14} /> New Department
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          <CheckCircle size={16} />
          <span>{actionMsg}</span>
          <button
            onClick={() => setActionMsg('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* Admin Subtabs */}
      <div className="admin-tabs">
        {[
          { id: 'analytics', label: 'Overview & Analytics', icon: BarChart3 },
          { id: 'departments', label: 'Departments & SLAs', icon: Building2 },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'escalated', label: 'Escalated Cases', icon: AlertTriangle },
          { id: 'audit', label: 'Audit Trail', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              navigate(`#admin/${tab.id}`);
            }}
            className={`admin-tab-btn${activeTab === tab.id ? ' active' : ''}`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS & OVERVIEW */}
      {(activeTab === 'analytics' || activeTab === 'dashboard') && (
        <div>
          {/* Stat Cards */}
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            {[
              { label: 'Total Grievances', value: overview?.totalGrievances || 0, icon: FileText, color: '#2563EB', gradient: '#2563EB' },
              { label: 'Resolution Rate', value: `${overview?.resolutionRate || 0}%`, icon: CheckCircle, color: '#059669', gradient: '#059669' },
              { label: 'Active Students', value: overview?.totalStudents || 0, icon: Users, color: '#4F46E5', gradient: '#4F46E5' },
              { label: 'SLA Breaches', value: overview?.slaBreaches || 0, icon: AlertTriangle, color: '#DC2626', gradient: '#DC2626' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ '--gradient': s.gradient }}>
                <div className="stat-icon" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div className="stat-value">{loading ? '—' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Breakdown Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Status Breakdown Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Clock size={16} color="var(--primary)" /> Grievances by Lifecycle Stage
              </h3>
              {overview?.byStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Submitted (Fresh)', val: overview.byStatus.submitted, color: '#2563EB' },
                    { label: 'Under Review', val: overview.byStatus.underReview, color: '#D97706' },
                    { label: 'In Progress', val: overview.byStatus.inProgress, color: '#4F46E5' },
                    { label: 'Resolved', val: overview.byStatus.resolved, color: '#059669' },
                    { label: 'Closed', val: overview.byStatus.closed, color: '#64748B' },
                    { label: 'Escalated to Dean', val: overview.byStatus.escalated, color: '#DC2626' },
                  ].map(item => {
                    const pct = overview.totalGrievances > 0 ? Math.round((item.val / overview.totalGrievances) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                          <span style={{ fontWeight: 600 }}>{item.val} ({pct}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="skeleton" style={{ height: '180px' }} />
              )}
            </div>

            {/* Department Summary Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Building2 size={16} color="#059669" /> Department Routing Coverage
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {departments.map(dept => (
                  <div key={dept._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{dept.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Code: {dept.code} · {dept.officers?.length || 0} Officer(s)</div>
                    </div>
                    <span style={{
                      background: '#D1FAE5', color: '#065F46',
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 600
                    }}>
                      {dept.totalGrievances || 0} Tickets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & SLA */}
      {activeTab === 'departments' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Configured Campus Departments ({departments.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDeptModal(true)}>
              <PlusCircle size={14} /> Add Department
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 18px' }}>Department</th>
                  <th style={{ padding: '12px 18px' }}>Code</th>
                  <th style={{ padding: '12px 18px' }}>Contact</th>
                  <th style={{ padding: '12px 18px' }}>SLA Config (Hrs)</th>
                  <th style={{ padding: '12px 18px' }}>Officers</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, i) => (
                  <tr key={dept._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{dept.name}</td>
                    <td style={{ padding: '14px 18px' }}><span className="font-mono">{dept.code}</span></td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{dept.contactEmail || '—'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Crit: {dept.slaConfig?.CRITICAL || 24}h | High: {dept.slaConfig?.HIGH || 48}h
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>{dept.officers?.length || 0} assigned</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`badge ${dept.isActive ? 'badge-resolved' : 'badge-closed'}`}>
                        {dept.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text" placeholder="Search user by name, email, roll number..."
                className="form-control" style={{ paddingLeft: '36px', height: '38px' }}
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control" style={{ width: '150px', height: '38px' }}
              value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="officer">Officer</option>
              <option value="dean">Dean</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 18px' }}>Name & Email</th>
                  <th style={{ padding: '12px 18px' }}>Role</th>
                  <th style={{ padding: '12px 18px' }}>Details / Roll No</th>
                  <th style={{ padding: '12px 18px' }}>Registered</th>
                  <th style={{ padding: '12px 18px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`badge badge-${u.role}`}>{u.role?.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {u.studentId ? `Roll: ${u.studentId} • ${u.department || ''}` : (u.designation || 'Staff')}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); }}
                      >
                        <Edit2 size={13} /> Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ESCALATED CASES */}
      {activeTab === 'escalated' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FF4444' }}>
                🚨 SLA Monitoring & Escalated Cases ({escalatedGrievances.length})
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated background engine escalates overdue department tickets</span>
            </div>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,68,68,0.15)', color: '#FF6B6B', border: '1px solid rgba(255,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={async () => {
                try {
                  const res = await api.auditSla();
                  alert(`SLA Audit Completed: ${res.newlyEscalated} ticket(s) newly escalated. ${res.atRiskCount || 0} ticket(s) expiring within 6 hours.`);
                  loadData();
                } catch (err) {
                  alert(err.message || 'Error running SLA audit');
                }
              }}
            >
              <RefreshCw size={14} /> Run Live SLA Audit
            </button>
          </div>

          {escalatedGrievances.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 20px' }}>
              <CheckCircle2 size={40} color="#00D4AA" />
              <h3>No Escalated Grievances</h3>
              <p>All departmental complaints are currently progressing within their SLA deadlines.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {escalatedGrievances.map((g, i) => (
                <div
                  key={g._id}
                  onClick={() => navigate(`#grievance/${g._id}`)}
                  style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#FF4444', fontWeight: 700 }}>
                        {g.trackingId}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.title}</span>
                      <span className="badge badge-escalated">ESCALATED</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Category: {g.category} • Priority: {g.priority} • Submitted by {g.submittedBy?.name || 'Student'}
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>System Security & Activity Audit Trail</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 18px' }}>Timestamp</th>
                  <th style={{ padding: '12px 18px' }}>Action</th>
                  <th style={{ padding: '12px 18px' }}>Performed By</th>
                  <th style={{ padding: '12px 18px' }}>Entity</th>
                  <th style={{ padding: '12px 18px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--primary)' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>{log.performedBy?.name || 'System'}</td>
                    <td style={{ padding: '12px 18px' }}>{log.targetEntity}</td>
                    <td style={{ padding: '12px 18px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DEPARTMENT */}
      {showDeptModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Add New Department</h3>
            <form onSubmit={handleCreateDept} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Department Name</label>
                <input
                  type="text" required placeholder="e.g. Examination Cell"
                  className="form-control" value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Department Code (Uppercase)</label>
                <input
                  type="text" required placeholder="e.g. EXAM"
                  className="form-control font-mono" value={deptForm.code}
                  onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="form-label">Official Contact Email</label>
                <input
                  type="email" placeholder="e.g. exam@college.edu"
                  className="form-control" value={deptForm.contactEmail}
                  onChange={e => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Description & Scope</label>
                <textarea
                  rows="3" placeholder="Brief outline of issues handled..."
                  className="form-control" value={deptForm.description}
                  onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE USER ROLE */}
      {showRoleModal && selectedUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Modify User Role</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Updating role permissions for <strong>{selectedUser.name}</strong> ({selectedUser.email}).
            </p>
            <form onSubmit={handleUpdateRole} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Assign Role</label>
                <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="officer">Department Officer</option>
                  <option value="dean">Dean</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRoleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
