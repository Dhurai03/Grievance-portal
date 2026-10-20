import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, CheckCircle, AlertTriangle, ArrowLeft, GraduationCap } from 'lucide-react';

export default function TrackGrievancePage({ navigate }) {
  const { user } = useAuth();
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

  React.useEffect(() => {
    if (trackingId.trim()) {
      handleTrack();
    }
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (user) {
      if (user.role === 'student') navigate('#student/dashboard');
      else if (user.role === 'officer' || user.role === 'faculty') navigate('#officer/dashboard');
      else navigate('#admin/dashboard');
    } else {
      navigate('#landing');
    }
  };

  const STATUS_INFO = {
    SUBMITTED: { icon: '📬', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', desc: 'Your grievance has been received and is awaiting departmental review.' },
    UNDER_REVIEW: { icon: '🔍', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', desc: 'Your grievance is currently under active evaluation by the department.' },
    IN_PROGRESS: { icon: '⚙️', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', desc: 'The designated officer is taking action to address your complaint.' },
    RESOLVED: { icon: '✅', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Your grievance has been successfully addressed and resolved.' },
    CLOSED: { icon: '🔒', color: '#475569', bg: '#F1F5F9', border: '#CBD5E1', desc: 'The ticket has completed its lifecycle and is officially closed.' },
    REJECTED: { icon: '❌', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'The complaint could not be processed under current guidelines.' },
    ESCALATED: { icon: '🚨', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', desc: 'Your grievance exceeded initial SLA limits and is escalated to the Dean.' },
  };

  const STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px'
    }}>
      {/* Nav */}
      
             
      <div style={{ width: '100%', maxWidth: '680px' }}>
        <button
          onClick={handleGoBack}
          className="btn btn-ghost btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Track Your Grievance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your tracking ID to check the real-time status and SLA progress</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrack} style={{
          display: 'flex', gap: '10px', background: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: '10px',
          padding: '6px 6px 6px 14px', marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '9px' }} />
          <input
            type="text"
            placeholder="Enter tracking ID (e.g., EDU-2026-00001)"
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'ui-monospace, monospace'
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !trackingId.trim()}>
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            {/* Status Hero */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '10px', padding: '24px', marginBottom: '16px', textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{STATUS_INFO[result.status]?.icon || '📬'}</div>
              <div style={{
                display: 'inline-block', padding: '3px 12px', borderRadius: '4px',
                background: STATUS_INFO[result.status]?.bg || '#EFF6FF',
                border: `1px solid ${STATUS_INFO[result.status]?.border || '#BFDBFE'}`,
                color: STATUS_INFO[result.status]?.color || 'var(--primary)',
                fontWeight: 600, fontSize: '0.8125rem', marginBottom: '8px'
              }}>{result.status?.replace('_', ' ')}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{STATUS_INFO[result.status]?.desc}</p>
            </div>

            {/* Progress Stepper */}
            {!['REJECTED', 'ESCALATED'].includes(result.status) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Resolution Progress</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', top: '13px', zIndex: 0 }} />
                  {STEPS.map((step, i) => {
                    const stepIndex = STEPS.indexOf(result.status);
                    const isDone = i <= stepIndex;
                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1, flex: 1 }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: isDone ? 'var(--primary)' : 'var(--bg-secondary)',
                          border: `2px solid ${isDone ? 'var(--primary)' : 'var(--border-color)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'var(--transition)'
                        }}>
                          {isDone ? <CheckCircle size={13} color="white" /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-color)' }} />}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: isDone ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isDone ? 600 : 400, textAlign: 'center', lineHeight: 1.2 }}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
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
                  <span style={{ fontSize: '0.8125rem' }}>{r.value}</span>
                </div>
              ))}
            </div>

            {result.resolutionNote && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '14px', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#065F46', marginBottom: '4px' }}>✓ Official Resolution Note</div>
                <p style={{ fontSize: '0.8125rem', color: '#065F46', margin: 0, lineHeight: 1.5 }}>{result.resolutionNote}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('#login')}>Sign In to View Full Details</button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('#register')}>Register Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
