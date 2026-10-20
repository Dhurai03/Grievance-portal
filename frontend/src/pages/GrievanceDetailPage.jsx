import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Clock, User, Building2, Tag, Send, Star,
  Paperclip, Lock, MessageSquare, History, Brain, ChevronDown, Check, Copy
} from 'lucide-react';

const PRIORITY_COLORS = { LOW: '#059669', MEDIUM: '#D97706', HIGH: '#D97706', CRITICAL: '#DC2626' };

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

  const pc = PRIORITY_COLORS[grievance.priority] || '#D97706';

  return (
    <div className="page-content" style={{ maxWidth: '1100px' }}>
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? <Check size={16} /> : '⚠️'} {toast.msg}</div>
      )}

      {/* Back + Header */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }} onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {grievance.trackingId}
            </span>
            <StatusBadge status={grievance.status} />
            <span className={`badge badge-${grievance.priority?.toLowerCase()}`}>{grievance.priority}</span>
            {grievance.isAnonymous && <span className="badge" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>🔒 Anonymous</span>}
            {grievance.isSlaBreach && <span className="badge badge-escalated">⚠️ SLA Overdue</span>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {grievance.title}
          </h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span><Building2 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{grievance.department?.name || grievance.category}</span>
            <span><Clock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{formatDate(grievance.createdAt)}</span>
            {!grievance.isAnonymous && <span><User size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{grievance.submittedBy?.name}</span>}
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
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</h3>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '16px', fontSize: '0.875rem' }}>{grievance.description}</p>

              {grievance.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Tag size={13} color="var(--text-muted)" />
                  {grievance.tags.map(t => <span key={t} className="chip" style={{ fontSize: '0.75rem' }}>{t}</span>)}
                </div>
              )}

              {grievance.resolutionNote && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '14px', marginTop: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#065F46', marginBottom: '4px' }}>✓ Official Resolution Note</div>
                  <p style={{ fontSize: '0.875rem', color: '#065F46', lineHeight: 1.6, margin: 0 }}>{grievance.resolutionNote}</p>
                </div>
              )}

              {grievance.attachments?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Paperclip size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />ATTACHMENTS
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {grievance.attachments.map((a, i) => (
                      <a key={i} href={`/uploads/${a.filename}`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.8125rem' }}>
                        <Paperclip size={13} /> {a.originalName}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginLeft: 'auto' }}>{(a.size / 1024).toFixed(0)} KB</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {grievance.feedback?.rating && (
                <div style={{ marginTop: '16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#92400E', marginBottom: '6px' }}>⭐ Student Feedback</div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} fill={s <= grievance.feedback.rating ? '#D97706' : 'none'} color="#D97706" />
                    ))}
                    <span style={{ fontSize: '0.8125rem', color: '#92400E', marginLeft: '6px', fontWeight: 600 }}>{grievance.feedback.rating}/5</span>
                  </div>
                  {grievance.feedback.comment && <p style={{ fontSize: '0.8125rem', color: '#78350F', margin: 0 }}>{grievance.feedback.comment}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {grievance.comments?.length === 0 && (
                  <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '32px' }}>
                    <MessageSquare size={28} />
                    <p>No comments yet. Start the conversation.</p>
                  </div>
                )}
                {grievance.comments?.map((c, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card)', border: `1px solid ${c.isInternal ? '#FDE68A' : 'var(--border-color)'}`,
                    borderRadius: '8px', padding: '14px', boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'white', flexShrink: 0 }}>
                        {c.author?.name?.[0] || '?'}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{c.author?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '6px' }}>{c.author?.role?.toUpperCase()}</span>
                        {c.isInternal && <span style={{ marginLeft: '6px', fontSize: '0.625rem', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>INTERNAL NOTE</span>}
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>{c.text}</p>
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

          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Module 1: Department & Category Classification */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>1. Department & Category Routing</h3>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>TF-IDF + Multinomial Logistic Regression</p>
                  </div>
                  <span className="badge badge-submitted" style={{ marginLeft: 'auto' }}>
                    Core AI
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Routed Department</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', fontSize: '0.8125rem' }}>{grievance.department?.name || grievance.category}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Category / Subcategory</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', fontSize: '0.8125rem' }}>{grievance.category} / {grievance.subcategory || 'General'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Prediction Confidence</div>
                    <div style={{ fontWeight: 600, color: '#059669', marginTop: '2px', fontSize: '0.8125rem' }}>
                      {Math.round(((grievance.aiClassification?.confidence || 0.85) * 100))}%
                    </div>
                  </div>
                </div>

                {grievance.aiClassification?.reasoning && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    💡 <strong>Routing Context:</strong> {grievance.aiClassification.reasoning}
                  </div>
                )}
              </div>

              {/* Module 3: Complaint Severity & Urgency Detection */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="#D97706" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>3. Complaint Severity & Urgency Detection</h3>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>Supervised Text Classifier (Priority Assessment)</p>
                  </div>
                  <span className={`badge badge-${grievance.priority?.toLowerCase()}`} style={{ marginLeft: 'auto' }}>
                    {grievance.priority} Urgency
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Urgency Level</div>
                    <div style={{ fontWeight: 600, color: pc, marginTop: '2px', fontSize: '0.8125rem' }}>{grievance.priority}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Staff Review Required</div>
                    <div style={{ fontWeight: 600, color: grievance.flaggedForStaffReview ? '#DC2626' : '#059669', marginTop: '2px', fontSize: '0.8125rem' }}>
                      {grievance.flaggedForStaffReview ? '⚠️ Expedited Review' : '✓ Standard Review'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Urgency Score (0 - 1.0)</div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginTop: '2px', fontSize: '0.8125rem' }}>
                      {grievance.urgencyAnalysis?.urgencyScore?.toFixed(2) || (grievance.priority === 'CRITICAL' ? '0.95' : grievance.priority === 'HIGH' ? '0.75' : '0.45')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 2: Duplicate & Similar Grievance Detection */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Copy size={18} color="#059669" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>2. Duplicate & Similar Grievance Detection</h3>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>Sentence Transformers + Cosine Similarity</p>
                  </div>
                  {grievance.similarityAnalysis?.hasDuplicate && (
                    <span className="badge badge-escalated" style={{ marginLeft: 'auto' }}>
                      Duplicate Flagged
                    </span>
                  )}
                </div>

                {grievance.similarityAnalysis?.matches && grievance.similarityAnalysis.matches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {grievance.similarityAnalysis.matches.map((match, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8125rem'
                      }}>
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>[{match.trackingId}]</strong> {match.title}
                        </div>
                        <span style={{
                          fontWeight: 600,
                          color: match.similarityScore >= 0.75 ? '#DC2626' : '#D97706',
                          background: match.similarityScore >= 0.75 ? '#FEE2E2' : '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem'
                        }}>
                          {Math.round(match.similarityScore * 100)}% Semantic Match
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    ✓ No duplicate or highly similar grievances detected in this department. Issue appears unique.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Info Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Grievance Info</h3>
            {[
              { label: 'Tracking ID', value: <span className="font-mono">{grievance.trackingId}</span> },
              { label: 'Department', value: grievance.department?.name || '—' },
              { label: 'Category', value: grievance.category },
              { label: 'Assigned To', value: grievance.assignedTo?.name || 'Unassigned' },
              { label: 'Priority', value: <span style={{ color: pc, fontWeight: 600 }}>{grievance.priority}</span> },
              { label: 'SLA Deadline', value: grievance.slaDeadline ? new Date(grievance.slaDeadline).toLocaleDateString('en-IN') : '—' },
              { label: 'Views', value: grievance.viewCount || 0 },
            ].map(r => (
              <div key={r.label} className="info-row">
                <span className="label">{r.label}</span>
                <span style={{ textAlign: 'right', fontSize: '0.8125rem' }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Submitter Info */}
          {isOfficer && !grievance.isAnonymous && grievance.submittedBy && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Student Info</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'white', fontSize: '0.8125rem' }}>
                  {grievance.submittedBy.name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{grievance.submittedBy.name}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{grievance.submittedBy.email}</div>
                </div>
              </div>
              {[
                { label: 'Student ID', value: grievance.submittedBy.studentId },
                { label: 'Department', value: grievance.submittedBy.department },
                { label: 'Year', value: grievance.submittedBy.year ? `Year ${grievance.submittedBy.year}` : '—' },
                { label: 'Section', value: grievance.submittedBy.section || '—' },
              ].map(r => r.value && (
                <div key={r.label} className="info-row" style={{ padding: '6px 0' }}>
                  <span className="label" style={{ fontSize: '0.6875rem' }}>{r.label}</span>
                  <span style={{ fontSize: '0.75rem' }}>{r.value}</span>
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
