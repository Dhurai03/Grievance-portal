import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Clock, User, Building2, Tag, Send, Star,
  Paperclip, Lock, MessageSquare, History, Brain, ChevronDown, Check
} from 'lucide-react';

const PRIORITY_COLORS = { LOW: '#00D4AA', MEDIUM: '#FFB347', HIGH: '#FF8C42', CRITICAL: '#FF4444' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status?.toLowerCase()}`}>{status?.replace('_', ' ')}</span>;
}

export default function GrievanceDetailPage({ navigate, id }) {
  const { user } = useAuth();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getGrievanceById(id);
      setGrievance(data.grievance);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await api.addComment(id, { text: comment, isInternal });
      setComment('');
      showToast('Comment added!');
      load();
    } catch (err) { showToast(err.message, 'error'); }
    setCommenting(false);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.updateStatus(id, { status: newStatus, remarks: statusRemarks, resolutionNote });
      setStatusModal(false);
      setNewStatus(''); setStatusRemarks(''); setResolutionNote('');
      showToast(`Status updated to ${newStatus}`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    setUpdating(false);
  };

  const handleFeedback = async () => {
    try {
      await api.submitFeedback(id, feedback);
      showToast('Thank you for your feedback!');
      setFeedbackModal(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  if (loading) return <div className="loading-screen" style={{ minHeight: '400px', height: '60vh' }}><div className="spinner" /></div>;

  if (!grievance) return (
    <div className="page-content">
      <div className="empty-state"><h3>Grievance not found</h3><button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Back</button></div>
    </div>
  );

  const isOfficer = ['officer', 'faculty', 'admin', 'dean'].includes(user?.role);
  const isOwner = grievance.submittedBy?._id === user?._id || grievance.submittedBy?._id?.toString() === user?._id?.toString();
  const canUpdateStatus = isOfficer;
  const canGiveFeedback = isOwner && grievance.status === 'RESOLVED' && !grievance.feedback?.rating;

  const pc = PRIORITY_COLORS[grievance.priority] || '#FFB347';

  return (
    <div className="page-content" style={{ maxWidth: '1100px' }}>
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? <Check size={16} /> : '⚠️'} {toast.msg}</div>
      )}

      {/* Back + Header */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '20px' }} onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary-light)', background: 'rgba(108,99,255,0.12)', padding: '3px 10px', borderRadius: '6px' }}>
              {grievance.trackingId}
            </span>
            <StatusBadge status={grievance.status} />
            <span className={`badge badge-${grievance.priority?.toLowerCase()}`}>{grievance.priority}</span>
            {grievance.isAnonymous && <span className="badge" style={{ background: 'rgba(155,155,191,0.15)', color: '#9B9BBF', border: '1px solid rgba(155,155,191,0.3)' }}>🕵️ Anonymous</span>}
            {grievance.isSlaBreach && <span className="badge badge-escalated">⚠️ SLA Breach</span>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {grievance.title}
          </h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span><Building2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{grievance.department?.name || grievance.category}</span>
            <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{formatDate(grievance.createdAt)}</span>
            {!grievance.isAnonymous && <span><User size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{grievance.submittedBy?.name}</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {canUpdateStatus && (
            <button className="btn btn-primary btn-sm" onClick={() => setStatusModal(true)}>Update Status</button>
          )}
          {canGiveFeedback && (
            <button className="btn btn-success btn-sm" onClick={() => setFeedbackModal(true)}>
              <Star size={14} /> Rate Resolution
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Main */}
        <div>
          {/* Tabs */}
          <div className="tabs-nav" style={{ marginBottom: '20px' }}>
            {[
              { key: 'details', label: 'Details' },
              { key: 'comments', label: `Comments (${grievance.comments?.length || 0})` },
              { key: 'history', label: 'Timeline' },
              ...(grievance.aiClassification ? [{ key: 'ai', label: '🤖 AI Analysis' }] : []),
            ].map(t => (
              <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{grievance.description}</p>

              {grievance.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Tag size={14} color="var(--text-muted)" />
                  {grievance.tags.map(t => <span key={t} className="chip" style={{ fontSize: '0.75rem' }}>{t}</span>)}
                </div>
              )}

              {grievance.resolutionNote && (
                <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#00D4AA', marginBottom: '6px' }}>✅ Resolution Note</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>{grievance.resolutionNote}</p>
                </div>
              )}

              {grievance.attachments?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Paperclip size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />ATTACHMENTS
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {grievance.attachments.map((a, i) => (
                      <a key={i} href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--primary-light)', textDecoration: 'none', fontSize: '0.8rem' }}>
                        <Paperclip size={13} /> {a.originalName}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 'auto' }}>{(a.size / 1024).toFixed(0)} KB</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {grievance.feedback?.rating && (
                <div style={{ marginTop: '20px', background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#FFB347', marginBottom: '8px' }}>⭐ Student Feedback</div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={18} fill={s <= grievance.feedback.rating ? '#FFB347' : 'none'} color="#FFB347" />
                    ))}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{grievance.feedback.rating}/5</span>
                  </div>
                  {grievance.feedback.comment && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{grievance.feedback.comment}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {grievance.comments?.length === 0 && (
                  <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '36px' }}>
                    <MessageSquare size={32} />
                    <p>No comments yet. Start the conversation.</p>
                  </div>
                )}
                {grievance.comments?.map((c, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card)', border: `1px solid ${c.isInternal ? 'rgba(255,179,71,0.3)' : 'var(--border-color)'}`,
                    borderRadius: '14px', padding: '16px',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {c.author?.name?.[0] || '?'}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.author?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{c.author?.role?.toUpperCase()}</span>
                        {c.isInternal && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: 'rgba(255,179,71,0.15)', color: '#FFB347', border: '1px solid rgba(255,179,71,0.3)', padding: '1px 7px', borderRadius: '20px', fontWeight: 700 }}>INTERNAL</span>}
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <form onSubmit={handleComment} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '12px' }}>Add Comment</h3>
                <textarea
                  className="form-control" rows={4} placeholder="Type your comment here..."
                  value={comment} onChange={e => setComment(e.target.value)}
                  style={{ marginBottom: '12px' }}
                />
                {isOfficer && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: '#FFB347' }} />
                    <Lock size={13} color={isInternal ? '#FFB347' : 'var(--text-muted)'} />
                    <span style={{ color: isInternal ? '#FFB347' : 'var(--text-muted)' }}>Internal note (hidden from student)</span>
                  </label>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={commenting || !comment.trim()}>
                  <Send size={13} /> {commenting ? 'Sending...' : 'Send Comment'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '9px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }} />
                {grievance.history?.map((h, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: '20px', paddingLeft: '20px' }}>
                    <div style={{ position: 'absolute', left: '-15px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-primary)', top: '4px' }} />
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {h.previousStatus && <StatusBadge status={h.previousStatus} />}
                        {h.previousStatus && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>}
                        <StatusBadge status={h.newStatus} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDate(h.timestamp)}</span>
                      </div>
                      {h.changedBy && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By: {h.changedBy?.name || 'System'}</div>}
                      {h.remarks && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{h.remarks}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && grievance.aiClassification && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '16px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={20} color="var(--primary-light)" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700 }}>AI Analysis Results</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Model: {grievance.aiClassification.model || 'keyword-nlp'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Detected Department', value: grievance.aiClassification.department },
                  { label: 'Category', value: grievance.aiClassification.category },
                  { label: 'Subcategory', value: grievance.aiClassification.subcategory },
                  { label: 'Recommended Priority', value: grievance.aiClassification.priority },
                  { label: 'AI Routed', value: grievance.isAiRouted ? '✅ Yes (Gemini AI)' : '⚠️ Keyword Fallback' },
                ].map(r => (
                  <div key={r.label} className="info-row">
                    <span className="label">{r.label}</span>
                    <span>{r.value || '—'}</span>
                  </div>
                ))}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
                    <span style={{ color: '#00D4AA', fontWeight: 700 }}>{Math.round((grievance.aiClassification.confidence || 0) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.round((grievance.aiClassification.confidence || 0) * 100)}%` }} />
                  </div>
                </div>
                {grievance.aiClassification.reasoning && (
                  <div style={{ background: 'rgba(108,99,255,0.08)', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    💡 {grievance.aiClassification.reasoning}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Info Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Grievance Info</h3>
            {[
              { label: 'Tracking ID', value: <span className="font-mono">{grievance.trackingId}</span> },
              { label: 'Department', value: grievance.department?.name || '—' },
              { label: 'Category', value: grievance.category },
              { label: 'Assigned To', value: grievance.assignedTo?.name || 'Unassigned' },
              { label: 'Priority', value: <span style={{ color: pc, fontWeight: 700 }}>{grievance.priority}</span> },
              { label: 'SLA Deadline', value: grievance.slaDeadline ? new Date(grievance.slaDeadline).toLocaleDateString('en-IN') : '—' },
              { label: 'Views', value: grievance.viewCount || 0 },
            ].map(r => (
              <div key={r.label} className="info-row">
                <span className="label">{r.label}</span>
                <span style={{ textAlign: 'right', fontSize: '0.82rem' }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Submitter Info */}
          {isOfficer && !grievance.isAnonymous && grievance.submittedBy && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Student Info</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                  {grievance.submittedBy.name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{grievance.submittedBy.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{grievance.submittedBy.email}</div>
                </div>
              </div>
              {[
                { label: 'Student ID', value: grievance.submittedBy.studentId },
                { label: 'Department', value: grievance.submittedBy.department },
                { label: 'Year', value: grievance.submittedBy.year ? `Year ${grievance.submittedBy.year}` : '—' },
                { label: 'Section', value: grievance.submittedBy.section || '—' },
              ].map(r => r.value && (
                <div key={r.label} className="info-row" style={{ padding: '8px 0' }}>
                  <span className="label" style={{ fontSize: '0.72rem' }}>{r.label}</span>
                  <span style={{ fontSize: '0.8rem' }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Update Status</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setStatusModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">New Status *</label>
              <select id="status-select" className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="">Select status...</option>
                {['UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            {newStatus === 'RESOLVED' && (
              <div className="form-group">
                <label className="form-label">Resolution Note</label>
                <textarea id="resolution-note" className="form-control" rows={3} placeholder="Describe how the issue was resolved..." value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea id="status-remarks" className="form-control" rows={2} placeholder="Add any remarks..." value={statusRemarks} onChange={e => setStatusRemarks(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setStatusModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating || !newStatus}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Rate Resolution</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setFeedbackModal(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>How satisfied are you with the resolution of your grievance?</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setFeedback(p => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <Star size={32} fill={s <= feedback.rating ? '#FFB347' : 'none'} color="#FFB347" />
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Additional Comments (optional)</label>
              <textarea className="form-control" rows={3} placeholder="Share your experience..." value={feedback.comment} onChange={e => setFeedback(p => ({ ...p, comment: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFeedbackModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleFeedback}>Submit Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
