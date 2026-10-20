import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Filter, FileText, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED'];
const PRIORITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GrievanceListPage({ navigate }) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' });

  useEffect(() => {
    load();
  }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await api.getGrievances(params);
      setGrievances(data.grievances || []);
      setPagination(data.pagination || {});
    } catch (_) {}
    setLoading(false);
  };

  const handleFilter = (key, val) => setFilters(p => ({ ...p, [key]: val, page: 1 }));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grievances</h1>
          <p className="page-subtitle">{pagination.total || 0} total grievances</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '10px', padding: '14px 18px', marginBottom: '18px',
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder="Search by title, tracking ID..."
            className="form-control" style={{ paddingLeft: '36px', height: '36px' }}
            value={filters.search}
            onChange={e => handleFilter('search', e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 'auto', minWidth: '130px', height: '36px' }} value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto', minWidth: '130px', height: '36px' }} value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-control" style={{ width: 'auto', minWidth: '130px', height: '36px' }} value={filters.order} onChange={e => handleFilter('order', e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '50px' }} />)}
          </div>
        ) : grievances.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px' }}>
            <FileText size={40} color="var(--text-muted)" />
            <h3 style={{ marginTop: '10px' }}>No Grievances Found</h3>
            <p>Try adjusting your filters or submit a new grievance.</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: '10px', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map(g => (
                  <tr key={g._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`#grievance/${g._id}`)}>
                    <td>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{g.trackingId}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.title}
                      </div>
                      {g.isAnonymous && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>🔒 Anonymous</span>}
                    </td>
                    <td><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{g.category}</span></td>
                    <td><span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{g.department?.name || '—'}</span></td>
                    <td><span className={`badge badge-${g.priority?.toLowerCase()}`}>{g.priority}</span></td>
                    <td><span className={`badge badge-${g.status?.toLowerCase()}`}>{g.status?.replace('_', ' ')}</span></td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                        {formatDate(g.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderTop: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1}
                onClick={() => handleFilter('page', pagination.page - 1)}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.pages}
                onClick={() => handleFilter('page', pagination.page + 1)}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
