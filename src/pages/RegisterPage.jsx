import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowLeft, Mail, KeyRound, User, Phone } from 'lucide-react';

export default function RegisterPage({ navigate }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setSubmitting(true);

    try {
      await register(email, password, name, phone);
      navigate('#citizen/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        maxWidth: '460px',
        width: '100%',
        padding: '36px 32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Back Link */}
        <button 
          onClick={() => navigate('#login')}
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

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={24} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>Register Citizen Account</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File complaints and track progress transparently</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: '6px',
            color: 'var(--color-error)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                id="name"
                placeholder="Rahul Sharma" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
              <input 
                type="email" 
                id="email"
                placeholder="rahul@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          {/* Phone */}
          <div className="input-group">
            <label htmlFor="phone">Mobile Phone (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
              <input 
                type="tel" 
                id="phone"
                placeholder="+91 98765 43210" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
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

          {/* Confirm Password */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                id="confirmPassword"
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Register Citizen Account'}
          </button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <button 
            onClick={() => navigate('#login')} 
            style={{ background: 'none', border: 'none', color: 'var(--color-active)', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}
