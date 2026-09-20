import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  Building2, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function GrievanceTrackingPage({ navigate, route }) {
  const { addToast } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);

  // Status list mapping for timeline progress
  const LIFECYCLE_STAGES = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'UNDER REVIEW', label: 'Under Review' },
    { key: 'IN PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CLOSED', label: 'Closed' }
  ];

  // Auto-fetch if ID passed via hash URL query parameter
  useEffect(() => {
    // Parsing query parameters from window.location.hash
    // Example: #grievance/track?id=GRV-2026-000101
    const getQueryParamId = () => {
      const hashString = window.location.hash;
      const queryIdx = hashString.indexOf('?');
      if (queryIdx !== -1) {
        const queryParams = new URLSearchParams(hashString.substring(queryIdx));
        return queryParams.get('id');
      }
      return null;
    };

    const idParam = getQueryParamId();
    if (idParam) {
      setSearchId(idParam);
      executeSearch(idParam);
    }
  }, [window.location.hash]);

  const executeSearch = async (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setTicketDetails(null);

    try {
      const details = await api.grievances.get(id.trim());
      setTicketDetails(details);
      addToast(`Grievance ${id.trim()} loaded.`, 'success');
    } catch (err) {
      addToast(err.message || 'Grievance not found. Verify the ID.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(searchId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED': return 'var(--color-success)';
      case 'REJECTED': return 'var(--color-error)';
      case 'ESCALATED': return 'var(--color-critical)';
      case 'WAITING FOR CITIZEN':
      case 'REOPENED': return 'var(--color-warning)';
      default: return 'var(--color-active)';
    }
  };

  // Timeline position check
  const getStageIndex = (status) => {
    if (status === 'REJECTED') return -1;
    // Map WAITING_FOR_CITIZEN / REOPENED / ESCALATED onto appropriate stages
    if (status === 'REOPENED' || status === 'ESCALATED') return 4; // Map near In Progress
    if (status === 'WAITING FOR CITIZEN') return 4;
    return LIFECYCLE_STAGES.findIndex(s => s.key === status);
  };

  const getRemainingTime = (deadline) => {
    const diffMs = new Date(deadline).getTime() - new Date().getTime();
    if (diffMs < 0) {
      return { text: 'Overdue / SLA Breached', type: 'critical' };
    }

    const diffDays = Math.floor(diffMs / (24 * 3600000));
    const diffHours = Math.floor((diffMs % (24 * 3600000)) / 3600000);

    if (diffDays > 0) {
      return { text: `${diffDays} Days, ${diffHours} Hours remaining`, type: 'normal' };
    }
    return { text: `${diffHours} Hours remaining (Due Soon)`, type: 'warning' };
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'left' }} className="animate-fade">
      {/* Return CTA */}
      <button onClick={() => navigate('#landing')} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Home
      </button>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>
        Track Grievance Status
      </h2>

      {/* Search Input Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input 
              type="text" 
              placeholder="Enter Grievance Ticket ID (e.g. GRV-2026-000101)..." 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="input-control"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Search size={18} /> {loading ? 'Loading...' : 'Track Ticket'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="glass-panel skeleton" style={{ height: '300px', width: '100%' }}></div>
      )}

      {/* Results View */}
      {ticketDetails && (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Grievance Header Card */}
          <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            {/* Status Colored border banner */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: getStatusColor(ticketDetails.grievance.status)
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>GRIEVANCE TICKET</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--color-active)' }}>
                  {ticketDetails.grievance.id}
                </h3>
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
                  {ticketDetails.grievance.title}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span><strong>Category:</strong> {ticketDetails.grievance.subcategory_name || ticketDetails.grievance.category_name}</span>
                  <span><strong>Priority:</strong> {ticketDetails.grievance.priority}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: getStatusColor(ticketDetails.grievance.status) + '15',
                  color: getStatusColor(ticketDetails.grievance.status),
                  border: `1.5px solid ${getStatusColor(ticketDetails.grievance.status)}`
                }}>
                  {ticketDetails.grievance.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Filed: {new Date(ticketDetails.grievance.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Timelines Progress Path */}
          <div className="glass-panel" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '28px', textAlign: 'left' }}>
              Redressal Lifecycle Path
            </h4>

            {ticketDetails.grievance.status === 'REJECTED' ? (
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(220, 38, 38, 0.05)', borderLeft: '4px solid var(--color-error)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-error)', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertCircle size={20} />
                  <span>Grievance Rejected</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  This complaint has been rejected by the designated department officer. Remarks: "{ticketDetails.history[ticketDetails.history.length - 1]?.remarks || 'None provided.'}"
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                position: 'relative',
                margin: '0 auto',
                overflowX: 'auto',
                padding: '20px 0 10px 0'
              }}>
                {/* Horizontal Connector Line */}
                <div style={{
                  position: 'absolute',
                  top: '32px',
                  left: '4%',
                  right: '4%',
                  height: '4px',
                  backgroundColor: 'var(--bg-tertiary)',
                  zIndex: 1
                }}></div>

                {/* Animated active path tracker */}
                {(() => {
                  const currentIdx = getStageIndex(ticketDetails.grievance.status);
                  const activePercent = (currentIdx / (LIFECYCLE_STAGES.length - 1)) * 92;
                  return (
                    <div style={{
                      position: 'absolute',
                      top: '32px',
                      left: '4%',
                      width: `${activePercent}%`,
                      height: '4px',
                      backgroundColor: 'var(--color-success)',
                      zIndex: 2,
                      transition: 'width 0.5s ease-in-out'
                    }}></div>
                  );
                })()}

                {/* Stages Points */}
                {LIFECYCLE_STAGES.map((stage, idx) => {
                  const currentIdx = getStageIndex(ticketDetails.grievance.status);
                  const isCompleted = idx < currentIdx || ticketDetails.grievance.status === 'CLOSED';
                  const isActive = idx === currentIdx;
                  
                  return (
                    <div key={stage.key} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 3,
                      position: 'relative',
                      flex: 1,
                      minWidth: '70px'
                    }}>
                      {/* Timeline circle node */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? 'var(--color-success)' : (isActive ? 'var(--color-active)' : 'var(--bg-secondary)'),
                        border: `3px solid ${isCompleted ? 'var(--color-success)' : (isActive ? 'var(--color-active)' : 'var(--border-color)')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {isCompleted && '✓'}
                      </div>
                      
                      <span style={{
                        marginTop: '12px',
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned details & SLA counter split */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            
            {/* SLA countdown clock */}
            {!['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticketDetails.grievance.status) && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Resolution SLA Information
                </h4>
                
                {(() => {
                  const timer = getRemainingTime(ticketDetails.grievance.sla_deadline);
                  const isBreached = timer.type === 'critical';
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: isBreached ? 'var(--color-critical)' : 'var(--color-warning)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Clock size={20} />
                        <span>{timer.text}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong>Target Deadline:</strong> {new Date(ticketDetails.grievance.sla_deadline).toLocaleString()}
                      </div>

                      {isBreached && (
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(185, 28, 28, 0.05)',
                          border: '1px solid rgba(185, 28, 28, 0.1)',
                          fontSize: '0.8rem',
                          color: 'var(--color-critical)',
                          lineHeight: 1.4
                        }}>
                          ⚠️ This ticket has breached its designated resolution timeline and has been escalated to administration.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Department / Officer Assigned Info */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Handling Office Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div>
                  <strong>Responsible Department:</strong> {ticketDetails.grievance.department_name || 'Assignment Pending'}
                </div>
                {ticketDetails.grievance.department_name && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '8px', borderLeft: '2px solid var(--border-color)' }}>
                    📞 Contact: {ticketDetails.grievance.department_phone || 'N/A'} <br/>
                    ✉️ Email: {ticketDetails.grievance.department_email || 'N/A'}
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '6px' }}>
                  <strong>Assigned Executive:</strong> {ticketDetails.grievance.officer_name || 'Pending assignment'}
                </div>
                {ticketDetails.grievance.officer_designation && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                    Designation: {ticketDetails.grievance.officer_designation}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location and citizen remarks */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Grievance Metadata & Description
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
              <div>
                <strong>Description:</strong>
                <p style={{ marginTop: '6px', color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.85rem' }}>
                  {ticketDetails.grievance.description}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <MapPin size={18} style={{ color: 'var(--color-active)', marginTop: '2px' }} />
                <div>
                  <strong>Linked Address:</strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {ticketDetails.grievance.address}, {ticketDetails.grievance.city}, {ticketDetails.grievance.district}, {ticketDetails.grievance.state} - {ticketDetails.grievance.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
