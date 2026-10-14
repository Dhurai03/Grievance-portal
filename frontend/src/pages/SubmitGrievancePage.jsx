import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Brain, Upload, X, Loader, AlertTriangle, CheckCircle, ChevronDown, Info, Sparkles } from 'lucide-react';

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
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();
  const classifyTimeout = useRef();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'description' && value.trim().length > 30) {
      clearTimeout(classifyTimeout.current);
      classifyTimeout.current = setTimeout(() => runAIClassify(value), 1200);
    }
  };

  const runAIClassify = async (text) => {
    if (!text || text.length < 20) return;
    setClassifying(true);
    try {
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
          background: 'var(--bg-card)', border: '1px solid var(--border-active)',
          borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '480px',
          animation: 'scaleIn 0.4s ease'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <CheckCircle size={48} color="#00D4AA" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px' }}>
            Grievance Submitted!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Your grievance has been received and our AI has routed it to the appropriate department.
          </p>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px',
            marginBottom: '24px', fontFamily: 'monospace', fontSize: '1.1rem',
            color: 'var(--primary-light)', fontWeight: 700
          }}>
            {success.grievance?.trackingId}
          </div>
          {success.aiClassification && (
            <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '12px', padding: '12px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '8px' }}>🤖 AI Classification</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div>Department: <strong>{success.aiClassification.department}</strong></div>
                <div>Priority: <strong style={{ color: success.aiClassification.priority === 'CRITICAL' ? '#FF4444' : success.aiClassification.priority === 'HIGH' ? '#FF8C42' : '#FFB347' }}>{success.aiClassification.priority}</strong></div>
                <div>Confidence: <strong>{Math.round((success.aiClassification.confidence || 0) * 100)}%</strong></div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate(`#grievance/${success.grievance?._id}`)}>
              View Grievance
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('#student/dashboard')}>
              Dashboard
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
          <p className="page-subtitle">Our AI will automatically route your complaint to the right department</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Main Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Grievance Title *</label>
              <input id="grv-title" name="title" type="text" className="form-control" placeholder="Brief summary of your issue..." value={form.title} onChange={handleChange} required maxLength={200} />
              <span className="form-hint">{form.title.length}/200 characters</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Detailed Description *
                {classifying && <Loader size={12} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />}
                {!classifying && aiResult && <span style={{ fontSize: '0.7rem', color: '#00D4AA', background: 'rgba(0,212,170,0.1)', padding: '2px 8px', borderRadius: '20px' }}>✓ AI Classified</span>}
              </label>
              <textarea id="grv-description" name="description" className="form-control" rows={6} placeholder="Describe your grievance in detail. The more context you provide, the better our AI can route and prioritize your complaint..." value={form.description} onChange={handleChange} required maxLength={5000} />
              <span className="form-hint">{form.description.length}/5000 • AI auto-classifies as you type</span>
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
                <input id="grv-subcategory" name="subcategory" type="text" className="form-control" placeholder="e.g., Grade correction" value={form.subcategory} onChange={handleChange} />
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
                  borderRadius: '12px', padding: '24px', textAlign: 'center',
                  cursor: 'pointer', transition: 'var(--transition)',
                  background: dragOver ? 'var(--primary-glow)' : 'var(--bg-input)'
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              >
                <Upload size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Drag & drop or <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>browse files</span>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  PDF, DOC, DOCX, JPG, PNG, TXT
                </p>
              </div>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" onChange={e => handleFiles(e.target.files)} />
              {files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flex: 1 }}>{f.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6B6B' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '20px' }}>
              <input id="grv-anon" name="isAnonymous" type="checkbox" checked={form.isAnonymous} onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <label htmlFor="grv-anon" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                Submit anonymously <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Your identity will be hidden from officers)</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary full-width" style={{ height: '48px', fontSize: '1rem' }} disabled={submitting}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : '🚀 Submit Grievance'}
            </button>
          </form>
        </div>

        {/* AI Assistant Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Classification Preview */}
          <div style={{
            background: 'var(--bg-card)', border: `1px solid ${aiResult ? 'rgba(108,99,255,0.4)' : 'var(--border-color)'}`,
            borderRadius: '16px', padding: '20px', transition: 'var(--transition)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="var(--primary-light)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Classification</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Auto-routes as you type</p>
              </div>
              {classifying && <Loader size={14} color="var(--primary)" style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />}
            </div>

            {!aiResult && !classifying && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Sparkles size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p>Start typing your description and AI will automatically detect the department and priority.</p>
              </div>
            )}

            {aiResult && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Department', value: aiResult.department },
                    { label: 'Category', value: aiResult.category },
                    { label: 'Subcategory', value: aiResult.subcategory },
                    { label: 'Priority', value: aiResult.priority, color: { LOW: '#00D4AA', MEDIUM: '#FFB347', HIGH: '#FF8C42', CRITICAL: '#FF4444' }[aiResult.priority] },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ color: row.color || 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '160px' }}>{row.value || '—'}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                      <span style={{ color: '#00D4AA', fontWeight: 600 }}>{Math.round((aiResult.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.round((aiResult.confidence || 0) * 100)}%` }} />
                    </div>
                  </div>
                  {aiResult.reasoning && (
                    <div style={{ background: 'rgba(108,99,255,0.08)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      💡 {aiResult.reasoning}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Priority Guide */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Priority Levels</h3>
            {[
              { p: 'CRITICAL', color: '#FF4444', desc: 'Safety, health, ragging, harassment' },
              { p: 'HIGH', color: '#FF8C42', desc: 'Exam results, fee deadlines, urgent academic' },
              { p: 'MEDIUM', color: '#FFB347', desc: 'General complaints, service issues' },
              { p: 'LOW', color: '#00D4AA', desc: 'Suggestions, minor inconveniences' },
            ].map(r => (
              <div key={r.p} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <span className={`badge badge-${r.p.toLowerCase()}`} style={{ flexShrink: 0, marginTop: '1px' }}>{r.p}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,179,71,0.05)', border: '1px solid rgba(255,179,71,0.2)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <AlertTriangle size={12} color="#FFB347" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              For emergencies like ragging or safety threats, also contact the college helpdesk immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
