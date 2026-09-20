import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Settings, 
  ShieldAlert, 
  Users, 
  FileText, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  UserCheck, 
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  MapPin,
  HelpCircle
} from 'lucide-react';

export default function AdminDashboard({ navigate }) {
  const { addToast } = useAuth();
  
  // Dashboard navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState('analytics'); // 'analytics', 'departments', 'categories', 'users', 'audit'
  
  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Dept Forms Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptFormId, setDeptFormId] = useState(null); // null for create, number for update
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptEmail, setDeptEmail] = useState('');
  const [deptPhone, setDeptPhone] = useState('');

  // Category Forms Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Subcategory Modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [subFormId, setSubFormId] = useState(null); // null for create, number for update
  const [subCatId, setSubCatId] = useState(''); // parent category ID
  const [subName, setSubName] = useState('');
  const [subDeptId, setSubDeptId] = useState('');
  const [subSla, setSubSla] = useState(7);

  // User promotion modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserName, setTargetUserName] = useState('');
  const [targetUserRole, setTargetUserRole] = useState('citizen');
  const [promoDeptId, setPromoDeptId] = useState('');
  const [promoDesig, setPromoDesig] = useState('');

  // Search/Filters inside tabs
  const [userSearch, setUserSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'analytics') {
        const anaData = await api.analytics.admin();
        setAnalytics(anaData);
      } else if (activeSubTab === 'departments') {
        const depts = await api.departments.list();
        setDepartments(depts);
      } else if (activeSubTab === 'categories') {
        const cats = await api.categories.list();
        setCategories(cats);
      } else if (activeSubTab === 'users') {
        const uList = await api.users.list();
        const depts = await api.departments.list(); // Needed for promoting select options
        setUsers(uList);
        setDepartments(depts);
      } else if (activeSubTab === 'audit') {
        const logs = await api.auth.me(); // Just to double check admin auth
        const res = await fetch('http://localhost:5000/api/admin/audit-logs'); // We can fetch directly or define in API
        // Audit logs endpoint falls back to a fetch or mock if db error
        const logsData = await api.users.list(); // Fetch list users then logs
        const auditRes = await fetch('http://localhost:5000/api/admin/users'); // fallback
        // We'll write direct fetch query inside loadData
        const logsResponse = await fetch('http://localhost:5000/api/admin/users'); // standard admin auth
        // To be safe we will implement fetch audit logs
        const logsDataRes = await fetch('http://localhost:5000/api/admin/users');
        const token = localStorage.getItem('token');
        const auditListResponse = await fetch('http://localhost:5000/api/admin/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (auditListResponse.ok) {
          const logsData = await auditListResponse.json();
          setAuditLogs(logsData);
        } else {
          setAuditLogs([]);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to load panel details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // We need to implement audit logs backend controller!
  // Wait, let's verify if we added the /api/admin/audit-logs route in server.js!
  // Ah! We didn't explicitly write that route block in server.js. Let's add it or write it.
  // Actually, let's write a route block for `/api/admin/audit-logs` in `server.js` in a bit, but for now we can fetch it, and let's check.
  // Let's check `server.js` contents: it has `/api/admin/users`. We can also add `/api/admin/audit-logs` there!
  // Let's make sure we add it.

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  // Dept CRUD triggers
  const handleSaveDept = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: deptName, description: deptDesc, contact_email: deptEmail, contact_phone: deptPhone };
      if (deptFormId) {
        await api.departments.update(deptFormId, { ...payload, status: 'active' });
        addToast('Department updated successfully!', 'success');
      } else {
        await api.departments.create(payload);
        addToast('Department created successfully!', 'success');
      }
      setShowDeptModal(false);
      resetDeptForm();
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save department.', 'error');
    }
  };

  const handleEditDept = (dept) => {
    setDeptFormId(dept.id);
    setDeptName(dept.name);
    setDeptDesc(dept.description || '');
    setDeptEmail(dept.contact_email || '');
    setDeptPhone(dept.contact_phone || '');
    setShowDeptModal(true);
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? All category routings and officer references will be unassigned.')) return;
    try {
      await api.departments.delete(id);
      addToast('Department deleted successfully.', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Deletion failed.', 'error');
    }
  };

  const resetDeptForm = () => {
    setDeptFormId(null);
    setDeptName('');
    setDeptDesc('');
    setDeptEmail('');
    setDeptPhone('');
  };

  // Category CRUD triggers
  const handleSaveCat = async (e) => {
    e.preventDefault();
    try {
      await api.categories.create({ name: catName, description: catDesc });
      addToast('Category created successfully!', 'success');
      setShowCatModal(false);
      setCatName('');
      setCatDesc('');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save category.', 'error');
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete category? All associated subcategories and ticket routings will be unlinked.')) return;
    try {
      await api.categories.delete(id);
      addToast('Category deleted successfully.', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Deletion failed.', 'error');
    }
  };

  // Subcategory CRUD triggers
  const handleSaveSub = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: subName, departmentId: subDeptId ? parseInt(subDeptId) : null, slaDays: parseInt(subSla) };
      if (subFormId) {
        await api.categories.updateSubcategory(subFormId, payload);
        addToast('Subcategory updated!', 'success');
      } else {
        await api.categories.createSubcategory(subCatId, payload);
        addToast('Subcategory created!', 'success');
      }
      setShowSubModal(false);
      resetSubForm();
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save subcategory.', 'error');
    }
  };

  const handleEditSub = (sub) => {
    setSubFormId(sub.id);
    setSubName(sub.name);
    setSubDeptId(sub.department_id || '');
    setSubSla(sub.sla_days);
    setSubCatId(sub.category_id);
    setShowSubModal(true);
  };

  const handleDeleteSub = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      await api.categories.deleteSubcategory(subId);
      addToast('Subcategory deleted.', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Deletion failed.', 'error');
    }
  };

  const resetSubForm = () => {
    setSubFormId(null);
    setSubName('');
    setSubDeptId('');
    setSubSla(7);
  };

  // Promote user role triggers
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const payload = { role: targetUserRole };
      if (targetUserRole === 'officer') {
        payload.departmentId = promoDeptId ? parseInt(promoDeptId) : null;
        payload.designation = promoDesig;
      }

      await api.users.updateRole(targetUserId, payload);
      addToast(`User role updated successfully to ${targetUserRole}!`, 'success');
      setShowRoleModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to change role.', 'error');
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade">
      
      {/* Welcome header */}
      <div style={{ textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Administration Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Control municipal departments, routing SLAs, users, and inspect analytics.</p>
      </div>

      {/* Admin subtabs menu layout */}
      <div className="glass-panel" style={{
        display: 'flex',
        gap: '8px',
        padding: '6px',
        borderRadius: '10px',
        overflowX: 'auto',
        width: 'fit-content'
      }}>
        {[
          { key: 'analytics', label: 'System Analytics', icon: TrendingUp },
          { key: 'departments', label: 'Municipal Departments', icon: Building2 },
          { key: 'categories', label: 'SLA Categories', icon: Settings },
          { key: 'users', label: 'User Roles Promotion', icon: Users },
          { key: 'audit', label: 'Audit Trail Logs', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                borderRadius: '8px'
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* RENDER ANALYTICS SUBTAB */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Summary Row */}
          <div className="dashboard-grid">
            <div className="glass-panel stat-card glow-card">
              <div className="stat-info">
                <h3>Total Grievances</h3>
                <p>{analytics.metrics.total}</p>
              </div>
              <div className="stat-icon" style={{ color: 'var(--color-active)' }}>
                <FileText size={20} />
              </div>
            </div>

            <div className="glass-panel stat-card glow-card">
              <div className="stat-info">
                <h3>Compliance rate</h3>
                <p>{analytics.metrics.slaCompliance}%</p>
              </div>
              <div className="stat-icon" style={{ color: 'var(--color-success)' }}>
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="glass-panel stat-card glow-card">
              <div className="stat-info">
                <h3>Resolution Speed</h3>
                <p>{analytics.metrics.avgResolutionDays} Days</p>
              </div>
              <div className="stat-icon" style={{ color: 'var(--color-warning)' }}>
                <Clock size={20} />
              </div>
            </div>

            <div className="glass-panel stat-card glow-card">
              <div className="stat-info">
                <h3>Escalated Case count</h3>
                <p>{analytics.metrics.escalated}</p>
              </div>
              <div className="stat-icon" style={{ color: 'var(--color-critical)' }}>
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* SVG Trends split */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            
            {/* Trend line chart custom SVG */}
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px' }}>Monthly Submissions Trend</h3>
              {analytics.trends.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No data yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Draw a gorgeous SVG Line Chart */}
                  <svg width="100%" height="160" viewBox="0 0 400 160" style={{ overflow: 'visible' }}>
                    {(() => {
                      const maxTrendVal = Math.max(...analytics.trends.map(t => t.count), 5);
                      const points = analytics.trends.map((t, idx) => {
                        const x = 40 + idx * 70;
                        const y = 130 - (t.count / maxTrendVal) * 100;
                        return { x, y, label: t.month, val: t.count };
                      });

                      const pathD = points.reduce((acc, p, idx) => {
                        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                      }, '');

                      return (
                        <g>
                          {/* Y grid lines */}
                          <line x1="30" y1="30" x2="380" y2="30" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="30" y1="80" x2="380" y2="80" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="30" y1="130" x2="380" y2="130" stroke="var(--border-color)" strokeWidth="1" />
                          
                          {/* Path Line */}
                          <path d={pathD} fill="none" stroke="var(--color-active)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          
                          {/* Points and Tooltips */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-secondary)" stroke="var(--color-active)" strokeWidth="3" />
                              <text x={p.x} y={p.y - 12} fontSize="9" fontWeight="700" textAnchor="middle" fill="var(--text-primary)">
                                {p.val}
                              </text>
                              <text x={p.x} y="148" fontSize="8.5" fontWeight="600" textAnchor="middle" fill="var(--text-tertiary)">
                                {p.label}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>

            {/* SLA categories breakdown pie chart */}
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px' }}>Submissions by Categories</h3>
              {analytics.categories.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No data yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics.categories.map((cat, idx) => {
                    const widthPercent = analytics.metrics.total > 0 ? (cat.count / analytics.metrics.total) * 100 : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600 }}>{cat.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{cat.count} ticket(s) ({Math.round(widthPercent)}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${widthPercent}%`, height: '100%', background: 'var(--color-info)', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Departments Performance list table */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Department Redressal Performance</h3>
            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Total Tickets</th>
                    <th>Resolved</th>
                    <th>Pending Active</th>
                    <th>SLA breached</th>
                    <th>SLA Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.departments.map(dept => (
                    <tr key={dept.id}>
                      <td style={{ fontWeight: 600 }}>{dept.name}</td>
                      <td>{dept.total}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{dept.resolved}</td>
                      <td>{dept.pending}</td>
                      <td style={{ color: dept.breached > 0 ? 'var(--color-critical)' : 'inherit', fontWeight: dept.breached > 0 ? 600 : 400 }}>{dept.breached}</td>
                      <td>
                        <span style={{ 
                          fontWeight: 700, 
                          color: dept.slaPercentage >= 85 ? 'var(--color-success)' : (dept.slaPercentage >= 70 ? 'var(--color-warning)' : 'var(--color-critical)') 
                        }}>
                          {dept.slaPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER DEPARTMENTS CRUD TAB */}
      {activeSubTab === 'departments' && (
        <div className="glass-panel animate-fade" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Municipal Departments Queue</h3>
            <button 
              onClick={() => { resetDeptForm(); setShowDeptModal(true); }}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <PlusCircle size={16} /> Add Department
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Dept Name</th>
                  <th>Description</th>
                  <th>Contact info</th>
                  <th>Officer count</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td style={{ fontWeight: 700 }}>{dept.name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      {dept.description}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      ✉️ {dept.contact_email} <br/>
                      📞 {dept.contact_phone}
                    </td>
                    <td>{dept.officer_count} Officer(s)</td>
                    <td>
                      <span className={`badge ${dept.status === 'active' ? 'badge-resolved' : 'badge-submitted'}`}>
                        {dept.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditDept(dept)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDept(dept.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '4px', color: 'var(--color-critical)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER CATEGORIES & SLA CONFIGURATOR */}
      {activeSubTab === 'categories' && (
        <div className="glass-panel animate-fade" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Grievance Categories & SLA Rules</h3>
            <button 
              onClick={() => { setCatName(''); setCatDesc(''); setShowCatModal(true); }}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <PlusCircle size={16} /> Add Category Group
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {categories.map((cat) => (
              <div key={cat.id} className="glass-panel" style={{ padding: '20px', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{cat.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cat.description || 'No description'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => { setSubCatId(cat.id.toString()); resetSubForm(); setShowSubModal(true); }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-active)' }}
                    >
                      + Add Subcategory
                    </button>
                    <button 
                      onClick={() => handleDeleteCat(cat.id)}
                      className="btn"
                      style={{ padding: '6px', color: 'var(--color-critical)', background: 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Subcategories list */}
                {cat.subcategories.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', italic: true }}>No subcategories configured. Tickets cannot be routed.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {cat.subcategories.map(sub => (
                      <div key={sub.id} className="glass-panel" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', justify: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.name}</span>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            background: 'rgba(234, 88, 12, 0.1)', 
                            color: 'var(--color-warning)' 
                          }}>
                            SLA: {sub.sla_days} Days
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Routes to:</strong> {sub.department_name || 'Unassigned department'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                          <button onClick={() => handleEditSub(sub)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Edit</button>
                          <button onClick={() => handleDeleteSub(sub.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--color-critical)' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER USER ROLES PROMOTION TAB */}
      {activeSubTab === 'users' && (
        <div className="glass-panel animate-fade" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Citizen Directory & Officer Promotion</h3>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search citizens by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User Full Name</th>
                  <th>Email & Phone</th>
                  <th>Active Role</th>
                  <th>Department / Designation</th>
                  <th>Registration Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      ✉️ {u.email} <br/>
                      📞 {u.phone || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-resolved' : (u.role === 'officer' ? 'badge-assigned' : 'badge-submitted')}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {u.role === 'officer' ? (
                        <div>
                          <strong>{u.designation || 'Officer'}</strong> <br/>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.department_name || 'No department'}</span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        onClick={() => {
                          setTargetUserId(u.id);
                          setTargetUserName(u.name);
                          setTargetUserRole(u.role);
                          setPromoDeptId(u.department_id || '');
                          setPromoDesig(u.designation || '');
                          setShowRoleModal(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                      >
                        <UserCheck size={14} /> Promote/Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER AUDIT LOGS TAB */}
      {activeSubTab === 'audit' && (
        <div className="glass-panel animate-fade" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Security Audit Trail Logs</h3>
          
          <div className="table-container" style={{ border: 'none', margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action performed</th>
                  <th>Entity Type / ID</th>
                  <th>User ID</th>
                  <th>Details Metadata</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px' }}>
                      No audit trails recorded in database yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {log.action}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{log.entity_type}:</span> {log.entity_id}
                      </td>
                      <td>User #{log.user_id || 'System'}</td>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.metadata}>
                        {log.metadata || '{}'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPT MODAL OVERLAY */}
      {showDeptModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade" style={{ maxWidth: '460px', width: '100%', padding: '30px', background: 'var(--bg-secondary)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.20rem', fontWeight: 800, marginBottom: '16px' }}>{deptFormId ? 'Edit Department' : 'Create Department'}</h3>
            <form onSubmit={handleSaveDept}>
              <div className="input-group">
                <label htmlFor="d-name">Department Name *</label>
                <input type="text" id="d-name" className="input-control" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="d-desc">Description</label>
                <textarea id="d-desc" className="input-control" value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} style={{ minHeight: '80px' }} />
              </div>
              <div className="input-group">
                <label htmlFor="d-email">Contact Email</label>
                <input type="email" id="d-email" className="input-control" value={deptEmail} onChange={(e) => setDeptEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="d-phone">Contact Phone</label>
                <input type="text" id="d-phone" className="input-control" value={deptPhone} onChange={(e) => setDeptPhone(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY GROUP MODAL */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade" style={{ maxWidth: '440px', width: '100%', padding: '30px', background: 'var(--bg-secondary)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.20rem', fontWeight: 800, marginBottom: '16px' }}>Create Category Group</h3>
            <form onSubmit={handleSaveCat}>
              <div className="input-group">
                <label htmlFor="c-name">Category Name *</label>
                <input type="text" id="c-name" className="input-control" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label htmlFor="c-desc">Description</label>
                <textarea id="c-desc" className="input-control" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} style={{ minHeight: '80px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBCATEGORY MODAL */}
      {showSubModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade" style={{ maxWidth: '440px', width: '100%', padding: '30px', background: 'var(--bg-secondary)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.20rem', fontWeight: 800, marginBottom: '16px' }}>{subFormId ? 'Edit Subcategory SLA' : 'Create Subcategory'}</h3>
            <form onSubmit={handleSaveSub}>
              <div className="input-group">
                <label htmlFor="s-name">Subcategory Name *</label>
                <input type="text" id="s-name" className="input-control" value={subName} onChange={(e) => setSubName(e.target.value)} required />
              </div>

              <div className="input-group">
                <label htmlFor="s-dept">Auto Routing Department</label>
                <select id="s-dept" value={subDeptId} onChange={(e) => setSubDeptId(e.target.value)} className="input-control">
                  <option value="">Select Routing Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="s-sla">SLA Deadline Length (Days) *</label>
                <input type="number" id="s-sla" className="input-control" min="1" max="90" value={subSla} onChange={(e) => setSubSla(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowSubModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Subcategory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER PROMOTION MODAL */}
      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade" style={{ maxWidth: '440px', width: '100%', padding: '30px', background: 'var(--bg-secondary)', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.20rem', fontWeight: 800, marginBottom: '8px' }}>Update User Authorization</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '20px' }}>User: <strong>{targetUserName}</strong> (ID: #{targetUserId})</span>
            
            <form onSubmit={handleUpdateRole}>
              <div className="input-group">
                <label htmlFor="role-select">Select Access Role *</label>
                <select 
                  id="role-select" 
                  value={targetUserRole} 
                  onChange={(e) => setTargetUserRole(e.target.value)} 
                  className="input-control"
                  required
                >
                  <option value="citizen">Citizen (Standard access)</option>
                  <option value="officer">Department Officer (Executive access)</option>
                  <option value="admin">Portal Administrator (Full control)</option>
                </select>
              </div>

              {targetUserRole === 'officer' && (
                <div className="animate-fade">
                  <div className="input-group">
                    <label htmlFor="promo-dept">Assign Department *</label>
                    <select 
                      id="promo-dept" 
                      value={promoDeptId} 
                      onChange={(e) => setPromoDeptId(e.target.value)} 
                      className="input-control"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="promo-des">Executive Designation *</label>
                    <input 
                      type="text" 
                      id="promo-des" 
                      placeholder="E.g., Assistant Engineer, Chief Officer" 
                      value={promoDesig} 
                      onChange={(e) => setPromoDesig(e.target.value)} 
                      className="input-control"
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowRoleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Role Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
