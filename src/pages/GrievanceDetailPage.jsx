import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Send, 
  MapPin, 
  Calendar, 
  Shield, 
  Clock, 
  FileText, 
  User, 
  Star,
  Lock,
  Building,
  Upload
} from 'lucide-react';

export default function GrievanceDetailPage({ navigate, id }) {
  const { user, addToast } = useAuth();
  
  // Page state
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Forms state
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Status adjustment
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusRemark, setStatusRemark] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Feedback form
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Evidence upload after submission
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Load ticket details on mount/ID update
  const loadDetails = async () => {
    if (!id) return;
    try {
      const data = await api.grievances.get(id);
      setDetails(data);
    } catch (err) {
      addToast(err.message || 'Failed to load grievance details.', 'error');
      navigate(`#${user ? user.role : 'citizen'}/dashboard`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    try {
      const result = await api.grievances.addComment(id, newComment, isInternalComment);
      // Append comment to list
      setDetails(prev => ({
        ...prev,
        comments: [...prev.comments, result.comment]
      }));
      setNewComment('');
      setIsInternalComment(false);
      addToast('Message posted successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to post comment.', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    setStatusUpdating(true);
    try {
      await api.grievances.updateStatus(id, targetStatus, statusRemark);
      addToast(`Grievance status updated to ${targetStatus}.`, 'success');
      setShowStatusModal(false);
      setStatusRemark('');
      // Reload details to sync histories
      loadDetails();
    } catch (err) {
      addToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      await api.grievances.submitFeedback(id, rating, feedbackComment);
      addToast('Feedback submitted successfully! Ticket is now closed.', 'success');
      loadDetails();
    } catch (err) {
      addToast(err.message || 'Failed to submit feedback.', 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('evidence', file);
      });

      const res = await api.grievances.uploadAttachments(id, formData);
      setDetails(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...res.attachments]
      }));

      addToast('Attachments uploaded successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploadingEvidence(false);
    }
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

  // Define eligible next status transitions based on user roles
  const getStatusOptions = () => {
    if (!details || !user) return [];
    const current = details.grievance.status;

    if (user.role === 'citizen') {
      const opts = [];
      if (current === 'RESOLVED') {
        opts.push({ value: 'REOPENED', label: 'Reopen (Resolution unsatisfactory)' });
        opts.push({ value: 'CLOSED', label: 'Accept Resolution & Close Ticket' });
      }
      return opts;
    }

    if (user.role === 'officer') {
      const opts = [
        { value: 'UNDER REVIEW', label: 'Under Review (Inspecting)' },
        { value: 'IN PROGRESS', label: 'In Progress (Active Work)' },
        { value: 'WAITING FOR CITIZEN', label: 'Request Additional Information' },
        { value: 'RESOLVED', label: 'Mark as Resolved' },
        { value: 'REJECTED', label: 'Reject / Not Feasible' }
      ];
      // Exclude current status
      return opts.filter(o => o.value !== current);
    }

    if (user.role === 'admin') {
      return [
        { value: 'ACKNOWLEDGED', label: 'Acknowledge' },
        { value: 'ASSIGNED', label: 'Assign / Route' },
        { value: 'UNDER REVIEW', label: 'Under Review' },
        { value: 'IN PROGRESS', label: 'In Progress' },
        { value: 'WAITING FOR CITIZEN', label: 'Waiting for Citizen' },
        { value: 'RESOLVED', label: 'Resolve' },
        { value: 'CLOSED', label: 'Force Close' },
        { value: 'REJECTED', label: 'Reject' },
        { value: 'ESCALATED', label: 'Escalate to Board' }
      ].filter(o => o.value !== current);
    }

    return [];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="glass-panel skeleton" style={{ height: '500px', width: '100%' }}></div>
      </div>
    );
  }

  const { grievance, history, comments, attachments, feedback } = details;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade">
      {/* Back Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate(user ? `#${user.role}/dashboard` : '#landing')} 
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Status Actions */}
        {getStatusOptions().length > 0 && (
          <button 
            onClick={() => {
              setTargetStatus(getStatusOptions()[0]?.value || '');
              setShowStatusModal(true);
            }} 
            className="btn btn-primary"
          >
            Update Ticket Status
          </button>
        )}
      </div>

      {/* Main Details Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'flex-start' }} id="detail-split-grid">
        
        {/* Left Column: Complaint & Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Info Card */}
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: getStatusColor(grievance.status) }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-active)' }}>{grievance.id}</span>
              <span className={`badge ${getStatusBadgeClass(grievance.status)}`}>
                {grievance.status.replace('_', ' ')}
              </span>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>{grievance.title}</h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Filed: {new Date(grievance.created_at).toLocaleDateString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Last Updated: {new Date(grievance.updated_at).toLocaleDateString()}
              </span>
            </div>

            <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
              {grievance.description}
            </p>

            {/* Evidence Attachments Grid */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Evidence / Attachments</h4>
              {attachments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No files attached to this grievance.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {attachments.map((file) => {
                    const isImg = file.file_type.startsWith('image/');
                    const fullUrl = `http://localhost:5000${file.file_path}`;
                    
                    return (
                      <div 
                        key={file.id} 
                        className="glass-panel" 
                        onClick={() => window.open(fullUrl, '_blank')}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'var(--transition)'
                        }}
                        className="glow-card"
                      >
                        {isImg ? (
                          <img 
                            src={fullUrl} 
                            alt={file.file_name} 
                            style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' }} 
                          />
                        ) : (
                          <div style={{
                            height: '80px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            marginBottom: '6px'
                          }}>
                            {file.file_name.split('.').pop().toUpperCase()}
                          </div>
                        )}
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}>
                          {file.file_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload addition evidence button (Citizen only and if ticket not closed) */}
              {user?.role === 'citizen' && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(grievance.status) && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', gap: '6px' }}>
                    <Upload size={14} /> {uploadingEvidence ? 'Uploading...' : 'Attach More Files'}
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleEvidenceUpload} 
                      disabled={uploadingEvidence}
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Citizen Feedback Rating Screen (Resolved tickets - Citizen view) */}
          {user?.role === 'citizen' && grievance.status === 'RESOLVED' && !feedback && (
            <div className="glass-panel" style={{ padding: '28px', borderLeft: '4px solid var(--color-success)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '8px' }}>
                Was your grievance resolved satisfactorily?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Please rate your resolution experience. Submitting feedback will officially close this ticket.
              </p>

              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star 
                        size={28} 
                        fill={star <= (hoverRating || rating) ? 'var(--color-warning)' : 'none'} 
                        color="var(--color-warning)" 
                      />
                    </button>
                  ))}
                </div>

                <div className="input-group">
                  <label htmlFor="f-comment">Optional Comments</label>
                  <textarea
                    id="f-comment"
                    placeholder="Provide additional details regarding the resolution experience..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="input-control"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: 'var(--color-success)', color: 'white' }}
                  disabled={feedbackSubmitting}
                >
                  {feedbackSubmitting ? 'Closing ticket...' : 'Submit Rating & Close Ticket'}
                </button>
              </form>
            </div>
          )}

          {/* Feedback Display if available */}
          {feedback && (
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-success)', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '8px' }}>Citizen Satisfaction Feedback</h4>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={16} 
                    fill={star <= feedback.rating ? 'var(--color-warning)' : 'none'} 
                    color="var(--color-warning)" 
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', italic: true }}>
                "{feedback.comments || 'No comment provided.'}"
              </p>
            </div>
          )}

          {/* Conversation Chat Thread */}
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Discussion Thread</h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '24px',
              paddingRight: '6px'
            }}>
              {comments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  No messages on this grievance yet.
                </div>
              ) : (
                comments.map((c) => {
                  const isUserSender = c.user_id === user?.id;
                  const isOfficial = c.user_role === 'officer' || c.user_role === 'admin';
                  
                  return (
                    <div 
                      key={c.id} 
                      style={{
                        alignSelf: isUserSender ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        alignItems: isUserSender ? 'flex-end' : 'flex-start'
                      }}>
                        {/* Sender Tag */}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{c.user_name}</span>
                          <span>•</span>
                          <span style={{ textTransform: 'capitalize' }}>{c.user_role}</span>
                          {c.is_internal === 1 && (
                            <span style={{ color: 'var(--color-critical)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Lock size={10} /> INTERNAL
                            </span>
                          )}
                        </div>

                        {/* Bubble */}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          borderTopRightRadius: isUserSender ? '2px' : '12px',
                          borderTopLeftRadius: isUserSender ? '12px' : '2px',
                          backgroundColor: c.is_internal === 1 
                            ? 'rgba(185, 28, 28, 0.05)' 
                            : (isUserSender 
                              ? 'var(--primary)' 
                              : (isOfficial ? 'var(--primary-light)' : 'var(--bg-tertiary)')),
                          color: isUserSender && c.is_internal !== 1 ? 'white' : 'var(--text-primary)',
                          border: c.is_internal === 1 
                            ? '1px dashed var(--color-critical)' 
                            : `1px solid ${isUserSender ? 'var(--primary)' : 'var(--border-color)'}`,
                          fontSize: '0.85rem',
                          lineHeight: 1.4,
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          {c.comment}
                        </div>

                        {/* Date */}
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            {(!user || !['CLOSED', 'REJECTED'].includes(grievance.status)) && (
              <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Write a message to authorities..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input-control"
                    style={{ borderRadius: '20px' }}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '10px', borderRadius: '50%', flexShrink: 0, width: '40px', height: '40px' }}
                    disabled={commentSubmitting}
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* Internal Comment switch checkbox for Officer/Admin */}
                {user && user.role !== 'citizen' && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', alignSelf: 'flex-start', paddingLeft: '8px' }}>
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="internal" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-critical)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Lock size={12} /> Post as Internal Remarks (Officer Only visible)
                    </label>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Lifecycle Timeline Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Timeline History Card */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Lifecycle History Log
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {/* Vertical line connector */}
              <div style={{
                position: 'absolute',
                top: '10px',
                bottom: '10px',
                left: '9px',
                width: '2px',
                backgroundColor: 'var(--border-color)',
                zIndex: 1
              }}></div>

              {history.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '14px', zIndex: 2, position: 'relative' }}>
                  {/* Point circle */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(log.new_status),
                    border: '4px solid var(--bg-secondary)',
                    boxShadow: 'var(--shadow-sm)',
                    marginTop: '2px',
                    flexShrink: 0
                  }}></div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {log.new_status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {log.remarks}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {new Date(log.timestamp).toLocaleString()} by {log.changed_by_name || 'System'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Information Metadata */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Grievance Metadata
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <strong>Filing Citizen:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <User size={14} /> {grievance.citizen_name}
                </div>
                {user?.role !== 'citizen' && (
                  <div style={{ paddingLeft: '20px', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    📞 {grievance.citizen_phone || 'None'} <br/>
                    ✉️ {grievance.citizen_email}
                  </div>
                )}
              </div>

              <div>
                <strong>Handling Officer:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Building size={14} /> {grievance.officer_name || 'Pending assignment'}
                </div>
                {grievance.officer_designation && (
                  <div style={{ paddingLeft: '20px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Designation: {grievance.officer_designation}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <strong>SLA Deadline:</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {new Date(grievance.sla_deadline).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <MapPin size={18} style={{ color: 'var(--color-active)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Location:</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                    {grievance.address}, {grievance.city}, {grievance.district}, {grievance.state} - {grievance.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATE STATUS MODAL OVERLAY */}
      {showStatusModal && (
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
            background: 'var(--bg-secondary)'
          }}>
            <h3 style={{ fontSize: '1.20rem', fontWeight: 800, marginBottom: '16px', textAlign: 'left' }}>
              Update Grievance Status
            </h3>

            <form onSubmit={handleStatusChangeSubmit}>
              <div className="input-group">
                <label htmlFor="target-s">Select Target Lifecycle Stage *</label>
                <select 
                  id="target-s"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="input-control"
                  required
                >
                  {getStatusOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="remark-s">Officer Remarks / Log reason *</label>
                <textarea 
                  id="remark-s"
                  placeholder="Enter remarks explaining the state transition. Visible on citizen tracking logs." 
                  value={statusRemark}
                  onChange={(e) => setStatusRemark(e.target.value)}
                  className="input-control"
                  style={{ minHeight: '100px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justify: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowStatusModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={statusUpdating}
                >
                  {statusUpdating ? 'Updating...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media styling adjustments */}
      <style>{`
        @media (max-width: 768px) {
          #detail-split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
