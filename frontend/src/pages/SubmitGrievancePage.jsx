import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Brain, Upload, X, Loader, AlertTriangle, CheckCircle,
  ChevronDown, Info, Sparkles, Copy, FileText, Clock, ShieldAlert,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'Academic Affairs', 'Hostel & Accommodation', 'Library',
  'IT & Technical Support', 'Finance & Fees', 'Student Welfare & Counseling',
  'Sports & Extracurricular', 'Transportation', 'Canteen & Food Services',
  'Placement & Career Services', 'Ragging & Discipline', 'Faculty & Teaching Quality'
];

export default function SubmitGrievancePage({ navigate }) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', subcategory: '',
    isAnonymous: false, tags: ''
  });
  const [files, setFiles] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Drafting Assistant Modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState(null);

  const fileInputRef = useRef();
  const classifyTimeout = useRef();
  const duplicateTimeout = useRef();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));

    if (name === 'description' || name === 'title') {
      const fullText = (name === 'description' ? `${form.title} ${value}` : `${value} ${form.description}`).trim();

      if (fullText.length > 25) {
        clearTimeout(classifyTimeout.current);
        classifyTimeout.current = setTimeout(() => runAIAnalysis(fullText), 900);
      }

      if (fullText.length > 20) {
        clearTimeout(duplicateTimeout.current);
        duplicateTimeout.current = setTimeout(() => runDuplicateCheck(fullText), 1300);
      }
    }
  };

  const runAIAnalysis = async (text) => {
    if (!text || text.length < 20) return;
    setClassifying(true);
    try {
      // Calls Core AI (TF-IDF + Logistic Regression) and Urgency Classifier
      const data = await api.aiClassify(text);
      const c = data.classification;
      setAiResult(c);
      if (c) {
        setForm(p => ({
          ...p,
          category: p.category || c.category,
          subcategory: p.subcategory || c.subcategory || ''
        }));
      }
    } catch (_) {}
    setClassifying(false);
  };

  const runDuplicateCheck = async (text) => {
    setCheckingDuplicates(true);
    try {
      const res = await api.checkDuplicates({
        title: form.title,
        description: text,
        threshold: 0.45
      });
      if (res && res.matches && res.matches.length > 0) {
        setDuplicateInfo(res);
      } else {
        setDuplicateInfo(null);
      }
    } catch (_) {
      setDuplicateInfo(null);
    }
    setCheckingDuplicates(false);
  };

  const handleGenerateDraft = async () => {
    if (!draftNotes.trim()) return;
    setDrafting(true);
    try {
      const res = await api.draftWithAI(draftNotes, form.category);
      setDraftResult(res);
    } catch (err) {
      setError('Drafting assistant error: ' + (err.message || 'Please try again'));
    }
    setDrafting(false);
  };

  const applyDraftToForm = () => {
    if (!draftResult) return;
    setForm(prev => ({
      ...prev,
      title: draftResult.suggestedTitle || prev.title,
      description: draftResult.structuredDescription || prev.description,
      category: draftResult.recommendedDepartment || prev.category
    }));
    setShowDraftModal(false);
    runAIAnalysis(`${draftResult.suggestedTitle} ${draftResult.structuredDescription}`);
  };

  const handleFiles = (fileList) => {
    const allowed = Array.from(fileList).filter(f => f.size <= 10 * 1024 * 1024);
    setFiles(p => [...p, ...allowed].slice(0, 5));
  };

  const removeFile = (i) => setFiles(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      files.forEach(f => formData.append('attachments', f));
      const data = await api.submitGrievance(formData);
      setSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '36px', textAlign: 'center', maxWidth: '520px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <CheckCircle size={44} color="#059669" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.375rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Grievance Registered Successfully
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Your grievance has been received, classified, and assigned an institutional SLA timeline for departmental redressal.
          </p>
          <div style={{
            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px 16px',
            marginBottom: '18px', fontFamily: 'ui-monospace, monospace', fontSize: '1.125rem',
            color: '#1E40AF', fontWeight: 700
          }}>
            {success.grievance?.trackingId}
          </div>

          {/* AI Routing & Urgency Summary */}
          {success.aiClassification && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', marginBottom: '18px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={14} /> AI Classification & Routing
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Dept: <strong>{success.aiClassification.department}</strong></div>
                <div>Category: <strong>{success.aiClassification.subcategory || success.aiClassification.category}</strong></div>
                <div>Urgency: <strong style={{ color: success.aiClassification.priority === 'CRITICAL' ? '#DC2626' : success.aiClassification.priority === 'HIGH' ? '#D97706' : '#2563EB' }}>{success.aiClassification.priority}</strong></div>
                <div>Confidence: <strong>{Math.round((success.aiClassification.confidence || 0) * 100)}%</strong></div>
              </div>
              {success.similarity?.hasDuplicate && (
                <div style={{ marginTop: '8px', padding: '8px 10px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '0.75rem', color: '#92400E' }}>
                  ℹ️ AI noted this issue matches an active recurring ticket: <strong>{success.similarity.topMatch?.trackingId}</strong>.
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`#grievance/${success.grievance?._id}`)}>
              View Grievance Details
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('#student/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Grievance</h1>
          <p className="page-subtitle">File an official campus complaint with automated routing, urgency detection, and duplicate checks.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Main Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

          {/* Module 2: Duplicate Grievance Alert Banner */}
          {duplicateInfo && duplicateInfo.matches && duplicateInfo.matches.length > 0 && (
            <div style={{
              background: duplicateInfo.hasDuplicate ? '#FEF2F2' : '#FFFBEB',
              border: `1px solid ${duplicateInfo.hasDuplicate ? '#FECACA' : '#FDE68A'}`,
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldAlert size={16} color={duplicateInfo.hasDuplicate ? '#DC2626' : '#D97706'} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: duplicateInfo.hasDuplicate ? '#991B1B' : '#92400E' }}>
                  {duplicateInfo.hasDuplicate ? 'Potential Duplicate Issue Detected' : 'Similar Active Issues Found on Campus'}
                </h4>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Our Semantic Similarity system identified existing complaints with similar details:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {duplicateInfo.matches.slice(0, 2).map((m, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--bg-secondary)', padding: '7px 10px', borderRadius: '6px', fontSize: '0.75rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--primary)' }}>[{m.trackingId}]</strong> {m.title}
                      <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>Status: {m.status}</span>
                    </div>
                    <span style={{
                      fontWeight: 600,
                      color: m.similarityScore >= 0.75 ? '#DC2626' : '#D97706',
                      background: m.similarityScore >= 0.75 ? '#FEE2E2' : '#FEF3C7',
                      padding: '2px 6px', borderRadius: '4px'
                    }}>
                      {Math.round(m.similarityScore * 100)}% Match
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                You may still submit your ticket to record your individual case, or follow up with the department on existing reports.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Grievance Title *</label>
              <input id="grv-title" name="title" type="text" className="form-control" placeholder="Brief summary of your issue..." value={form.title} onChange={handleChange} required maxLength={200} />
              <span className="form-hint">{form.title.length}/200 characters</span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  Detailed Description *
                  {classifying && <Loader size={12} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />}
                  {!classifying && aiResult && <span style={{ fontSize: '0.6875rem', color: '#065F46', background: '#D1FAE5', padding: '1px 7px', borderRadius: '4px', fontWeight: 600 }}>✓ AI Classified</span>}
                </label>

                {/* Module 4: Drafting Assistant Button */}
                <button
                  type="button"
                  onClick={() => setShowDraftModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    color: '#1E40AF', padding: '3px 9px', borderRadius: '6px',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Sparkles size={12} /> AI Draft Assistant
                </button>
              </div>

              <textarea id="grv-description" name="description" className="form-control" rows={6} placeholder="Describe your grievance in detail. The more context you provide, the better our system can route and prioritize your complaint..." value={form.description} onChange={handleChange} required maxLength={5000} />
              <span className="form-hint">{form.description.length}/5000 characters · Evaluated for category, urgency, and duplicate matching</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category *</label>
                <select id="grv-category" name="category" className="form-control" value={form.category} onChange={handleChange} required>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subcategory</label>
                <input id="grv-subcategory" name="subcategory" type="text" className="form-control" placeholder="e.g., Examination Issues" value={form.subcategory} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Tags (comma-separated)</label>
              <input id="grv-tags" name="tags" type="text" className="form-control" placeholder="exam, result, hall ticket" value={form.tags} onChange={handleChange} />
            </div>

            {/* File Upload */}
            <div className="form-group">
              <label className="form-label">Attachments (Max 5 files, 10MB each)</label>
              <div
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: '8px', padding: '20px', textAlign: 'center',
                  cursor: 'pointer', transition: 'var(--transition)',
                  background: dragOver ? '#EFF6FF' : 'var(--bg-secondary)'
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              >
                <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 6px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Drag & drop or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>browse files</span>
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  PDF, DOC, DOCX, JPG, PNG, TXT (Proof, receipts, screenshots)
                </p>
              </div>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" onChange={e => handleFiles(e.target.files)} />
              {files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', flex: 1 }}>{f.name}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '18px' }}>
              <input id="grv-anon" name="isAnonymous" type="checkbox" checked={form.isAnonymous} onChange={handleChange}
                style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <label htmlFor="grv-anon" style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                Submit anonymously <span style={{ color: 'var(--text-muted)' }}>(Your identity is encrypted and kept private)</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary full-width" style={{ height: '42px', fontSize: '0.9375rem' }} disabled={submitting}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing & Submitting...</> : 'Submit Grievance'}
            </button>
          </form>
        </div>

        {/* AI Assistant Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Department Classification Preview */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '10px', padding: '18px', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={16} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', margin: 0 }}>Automated Routing</h3>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>Department & Urgency Estimation</p>
              </div>
              {classifying && <Loader size={14} color="var(--primary)" style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />}
            </div>

            {!aiResult && !classifying && (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <Sparkles size={20} style={{ opacity: 0.3, marginBottom: '6px' }} />
                <p>Type your complaint description to see live department routing, urgency level, and SLA targets.</p>
              </div>
            )}

            {aiResult && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Target Dept', value: aiResult.department },
                    { label: 'Category', value: aiResult.category },
                    { label: 'Subcategory', value: aiResult.subcategory },
                    {
                      label: 'Urgency Level',
                      value: aiResult.priority,
                      color: { LOW: '#059669', MEDIUM: '#D97706', HIGH: '#D97706', CRITICAL: '#DC2626' }[aiResult.priority]
                    },
                    {
                      label: 'Estimated SLA',
                      value: aiResult.priority === 'CRITICAL' ? '24 Hours' : aiResult.priority === 'HIGH' ? '48 Hours' : aiResult.priority === 'MEDIUM' ? '72 Hours' : '7 Days',
                      color: 'var(--primary)'
                    }
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ color: row.color || 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '160px' }}>{row.value || '—'}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Routing Confidence</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>{Math.round((aiResult.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.round((aiResult.confidence || 0) * 100)}%` }} />
                    </div>
                  </div>

                  {aiResult.reasoning && (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      💡 {aiResult.reasoning}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SLA Timeframes Guide */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--primary)" /> Resolution SLA Standards
            </h3>
            {[
              { p: 'CRITICAL', sla: '24h', desc: 'Ragging, safety hazards, immediate blocks' },
              { p: 'HIGH', sla: '48h', desc: 'Exam marks, hall tickets, fee deadlines' },
              { p: 'MEDIUM', sla: '72h', desc: 'WiFi disruption, hostel repairs' },
              { p: 'LOW', sla: '7 days', desc: 'Library books, facility suggestions' },
            ].map(r => (
              <div key={r.p} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                <span className={`badge badge-${r.p.toLowerCase()}`} style={{ flexShrink: 0, marginTop: '1px', fontSize: '0.6875rem' }}>{r.sla}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module 4: AI Grievance Drafting Assistant Modal */}
      {showDraftModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '12px', maxWidth: '580px', width: '100%', padding: '24px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AI Complaint Drafting Assistant</h3>
              </div>
              <button onClick={() => setShowDraftModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Write rough notes or bullet points about what happened, where, and when. The assistant will structure it into an objective, formal complaint with actionable details for college officers.
            </p>

            <textarea
              className="form-control"
              rows={4}
              placeholder="e.g. WiFi in CS lab 2 not working since Monday, during python practical students could not submit code, lab assistant said server is down..."
              value={draftNotes}
              onChange={e => setDraftNotes(e.target.value)}
              style={{ marginBottom: '12px' }}
            />

            <button
              type="button"
              className="btn btn-primary full-width btn-sm"
              onClick={handleGenerateDraft}
              disabled={drafting || !draftNotes.trim()}
              style={{ marginBottom: '14px' }}
            >
              {drafting ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Polishing draft...</> : '✨ Generate Structured Draft'}
            </button>

            {draftResult && (
              <div style={{
                background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px',
                border: '1px solid var(--border-color)', marginBottom: '14px', maxHeight: '200px', overflowY: 'auto'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUGGESTED TITLE:</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{draftResult.suggestedTitle}</div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>STRUCTURED STATEMENT:</div>
                  <div style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {draftResult.structuredDescription}
                  </div>
                </div>

                {draftResult.recommendedAttachments && draftResult.recommendedAttachments.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECOMMENDED ATTACHMENTS:</div>
                    <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '16px', margin: '3px 0 0' }}>
                      {draftResult.recommendedAttachments.map((att, i) => <li key={i}>{att}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDraftModal(false)}>
                Cancel
              </button>
              {draftResult && (
                <button type="button" className="btn btn-primary btn-sm" onClick={applyDraftToForm}>
                  Use This Draft <ArrowRight size={13} style={{ marginLeft: '4px' }} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
