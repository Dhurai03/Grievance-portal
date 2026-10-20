import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, User, Phone, BookOpen, Hash, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Business Administration', 'Arts & Humanities', 'Law', 'Medicine', 'Pharmacy', 'Architecture'];

export default function RegisterPage({ navigate }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', studentId: '', department: '', year: '', section: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('#student/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '20px' }} onClick={() => navigate('#landing')}>
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
          }}>
            <GraduationCap size={24} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join EduGrieve as a Student</p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Row 1: Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-name" name="name" type="text" className="form-control" placeholder="Your Name" value={form.name} onChange={handleChange} required style={{ paddingLeft: '36px' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-phone" name="phone" type="tel" className="form-control" placeholder="+91 99999 99999" value={form.phone} onChange={handleChange} style={{ paddingLeft: '36px' }} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">College Email *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-email" name="email" type="email" className="form-control" placeholder="you@college.edu" value={form.email} onChange={handleChange} required style={{ paddingLeft: '36px' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-password" name="password" type={showPw ? 'text' : 'password'} className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required style={{ paddingLeft: '36px', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Student ID</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="reg-studentId" name="studentId" type="text" className="form-control" placeholder="CS2024001" value={form.studentId} onChange={handleChange} style={{ paddingLeft: '36px' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Year of Study</label>
                <select id="reg-year" name="year" className="form-control" value={form.year} onChange={handleChange}>
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Department</label>
                <select id="reg-department" name="department" className="form-control" value={form.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Section</label>
                <input id="reg-section" name="section" type="text" className="form-control" placeholder="A / B / C" value={form.section} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary full-width" style={{ height: '40px', marginTop: '4px' }} disabled={loading}>
              {loading ? <div className="spinner-sm spinner" /> : 'Create Student Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('#login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
