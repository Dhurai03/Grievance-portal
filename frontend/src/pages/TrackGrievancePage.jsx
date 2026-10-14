import React, { useState } from 'react';
import api from '../services/api';
import { Search, CheckCircle, Clock, Building2, AlertTriangle, ArrowLeft, GraduationCap } from 'lucide-react';

export default function TrackGrievancePage({ navigate }) {
  const [trackingId, setTrackingId] = useState(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return params.get('id') || '';
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!trackingId.trim()) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const data = await api.trackGrievance(trackingId.trim().toUpperCase());
      setResult(data.grievance);
    } catch (err) {
      setError('Grievance not found. Please check the tracking ID.');
    }
    setLoading(false);
  };

  const STATUS_INFO = {
    SUBMITTED: { icon: '📬', color: '#4FC3F7', desc: 'Your grievance has been received and is awaiting review.' },
    UNDER_REVIEW: { icon: '🔍', color: '#FFB347', desc: 'Your grievance is being reviewed by the department.' },
    IN_PROGRESS: { icon: '⚙️', color: '#6C63FF', desc: 'The department is actively working to resolve your issue.' },
    RESOLVED: { icon: '✅', color: '#00D4AA', desc: 'Your grievance has been resolved. Please provide feedback.' },
    CLOSED: { icon: '🔒', color: '#9B9BBF', desc: 'Your grievance has been closed.' },
    REJECTED: { icon: '❌', color: '#FF6B6B', desc: 'Your grievance has been rejected. Contact the department for details.' },
    ESCALATED: { icon: '🚨', color: '#FF4444', desc: 'Your grievance has been escalated to senior management.' },
  };

  const STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '5%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('#landing')}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>EduGrieve</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('#login')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('#register')}>Register</button>
        </div>
      </nav>

      <div style={{ width: '100%', maxWidth: '680px', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Track Your Grievance
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Enter your tracking ID to check the real-time status of your grievance</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} style={{
          display: 'flex', gap: '12px', background: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: '20px',
          padding: '8px 8px 8px 20px', marginBottom: '28px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '10px' }} />
          <input
            type="text"
            placeholder="Enter tracking ID (e.g., EDU-2026-00001)"
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'monospace'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !trackingId.trim()}>
            {loading ? <div className="spinner spinner-sm" /> : 'Track'}
          </button>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Status Hero */}
            <div style={{
              background: 'var(--bg-card)', border: `1px solid ${STATUS_INFO[result.status]?.color}40`,
              borderRadius: '20px', padding: '28px', marginBottom: '20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>{STATUS_INFO[result.status]?.icon || '📬'}</div>
              <div style={{
                display: 'inline-block', padding: '6px 18px', borderRadius: '50px',
                background: `${STATUS_INFO[result.status]?.color}20`,
                border: `1px solid ${STATUS_INFO[result.status]?.color}40`,
                color: STATUS_INFO[result.status]?.color,
                fontWeight: 700, fontSize: '0.875rem', marginBottom: '12px'
              }}>{result.status?.replace('_', ' ')}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{STATUS_INFO[result.status]?.desc}</p>
            </div>

            {/* Progress Stepper */}
            {!['REJECTED', 'ESCALATED'].includes(result.status) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Resolution Progress</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', top: '14px', zIndex: 0 }} />
                  {STEPS.map((step, i) => {
                    const stepIndex = STEPS.indexOf(result.status);
                    const isDone = i <= stepIndex;
                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, flex: 1 }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: isDone ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'var(--bg-secondary)',
                          border: `2px solid ${isDone ? 'var(--primary)' : 'var(--border-color)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'var(--transition)'
                        }}>
                          {isDone ? <CheckCircle size={14} color="white" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-color)' }} />}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: isDone ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isDone ? 600 : 400, textAlign: 'center', lineHeight: 1.2 }}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
              {[
                { label: 'Tracking ID', value: <span className="font-mono">{result.trackingId}</span> },
                { label: 'Title', value: result.title },
                { label: 'Category', value: result.category },
                { label: 'Department', value: result.department?.name || '—' },
                { label: 'Priority', value: result.priority },
                { label: 'Submitted On', value: new Date(result.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
                { label: 'SLA Deadline', value: result.slaDeadline ? new Date(result.slaDeadline).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '—' },
                ...(result.resolvedAt ? [{ label: 'Resolved On', value: new Date(result.resolvedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) }] : []),
              ].map(r => (
                <div key={r.label} className="info-row">
                  <span className="label">{r.label}</span>
                  <span style={{ fontSize: '0.875rem' }}>{r.value}</span>
                </div>
              ))}
            </div>

            {result.resolutionNote && (
              <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '14px', padding: '16px', marginTop: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#00D4AA', marginBottom: '6px' }}>✅ Resolution Note</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{result.resolutionNote}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('#login')}>Sign In to View Full Details</button>
              <button className="btn btn-secondary" onClick={() => navigate('#register')}>Register Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
