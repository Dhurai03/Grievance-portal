import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft, Zap } from 'lucide-react';

export default function LoginPage({ navigate }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      const role = data.user?.role;
      if (role === 'student') navigate('#student/dashboard');
      else if (role === 'officer' || role === 'faculty') navigate('#officer/dashboard');
      else if (role === 'admin' || role === 'dean') navigate('#admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.3s ease' }}>
        {/* Back */}
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '20px' }} onClick={() => navigate('#landing')}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
          }}>
            <GraduationCap size={26} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sign in to your EduGrieve account</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-sm)'
        }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary full-width" style={{ marginTop: '8px', height: '40px' }} disabled={loading}>
              {loading ? <div className="spinner-sm spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '18px 0' }} />

          {/* Quick Login Demo */}
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px', fontWeight: 500 }}>
              Demo accounts
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Student', email: 'student@college.edu', password: 'student123' },
                { label: 'Admin', email: 'admin@college.edu', password: 'admin123' },
                { label: 'Officer', email: 'academic.officer@college.edu', password: 'officer123' },
                { label: 'Dean', email: 'dean@college.edu', password: 'dean123' },
              ].map(d => (
                <button key={d.email} onClick={() => quickLogin(d.email, d.password)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8125rem', justifyContent: 'flex-start' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('#register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
