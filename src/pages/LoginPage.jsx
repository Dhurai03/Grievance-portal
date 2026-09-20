import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowLeft, KeyRound, Mail } from 'lucide-react';

export default function LoginPage({ navigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(`#${loggedInUser.role}/dashboard`);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '24px'
    }}>
      <div className="glass-panel animate-fade" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Back Link */}
        <button 
          onClick={() => navigate('#landing')}
          className="btn btn-secondary"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderRadius: '6px'
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={28} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Sign In to JanSuniye</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enter credentials to access your dashboard</p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '6px',
            color: 'var(--color-error)',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
              <input 
                type="email" 
                id="email"
                placeholder="citizen@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="input-group" style={{ marginBottom: '8px' }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                id="password"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <button 
              type="button" 
              onClick={() => alert('Demo account credentials are listed on the Landing Page! Citizen: citizen@example.com / citizen123')}
              style={{ background: 'none', border: 'none', color: 'var(--color-active)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>New user? </span>
          <button 
            onClick={() => navigate('#register')} 
            style={{ background: 'none', border: 'none', color: 'var(--color-active)', fontWeight: 600, cursor: 'pointer' }}
          >
            Create a Citizen Account
          </button>
        </div>
      </div>
    </div>
  );
}
