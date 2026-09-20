import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  HelpCircle,
  FileText,
  CheckCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function LandingPage({ navigate }) {
  const { login, user } = useAuth();
  const [trackId, setTrackId] = useState('');
  const [stats, setStats] = useState({
    total: 24,
    resolved: 19,
    rate: '79%',
    avgTime: '2.4 Days'
  });

  // Fetch actual stats from server on load if possible, else fallback
  useEffect(() => {
    async function fetchPublicStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/admin`); // If logged in, fetch admin analytics
        // We can check if it returns OK
        if (res.ok) {
          const data = await res.json();
          setStats({
            total: data.metrics.total,
            resolved: data.metrics.resolved,
            rate: `${data.metrics.resolutionRate}%`,
            avgTime: `${data.metrics.avgResolutionDays} Days`
          });
        }
      } catch (err) {
        // Fallback is already set
      }
    }
    fetchPublicStats();
  }, []);

  const handleDemoLogin = async (role) => {
    let email = '';
    let password = '123';
    
    if (role === 'citizen') {
      email = 'citizen@example.com';
      password = 'citizen123';
    } else if (role === 'officer') {
      email = 'officer@example.com';
      password = 'officer123';
    } else if (role === 'admin') {
      email = 'admin@example.com';
      password = 'admin123';
    }

    try {
      const loggedInUser = await login(email, password);
      navigate(`#${loggedInUser.role}/dashboard`);
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  const handleTrackSearch = (e) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`#grievance/track?id=${trackId.trim()}`);
    }
  };

  const handleCTA = () => {
    if (user) {
      navigate(`#${user.role}/dashboard`);
    } else {
      navigate('#login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={28} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>JanSuniye</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => navigate('#grievance/track')} className="btn btn-secondary">
            <Search size={16} /> Track
          </button>
          
          {user ? (
            <button onClick={() => navigate(`#${user.role}/dashboard`)} className="btn btn-primary">
              My Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => navigate('#login')} className="btn btn-primary">
              Citizen Portal <UserCheck size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 40px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-primary) 100%)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          color: 'var(--text-primary)',
          maxWidth: '800px',
          marginBottom: '24px'
        }}>
          Your Voice. Your Grievance. <br/>
          <span style={{ 
            background: 'linear-gradient(90deg, #2563eb 0%, #0284c7 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Our Responsibility.
          </span>
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          lineHeight: 1.5,
          marginBottom: '40px'
        }}>
          Submit, track, and resolve grievances through one transparent, accountability-driven platform. Auto-routed to the right department.
        </p>

        {/* CTA Actions */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
          <button onClick={handleCTA} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem', borderRadius: '8px' }}>
            <PlusCircle size={20} /> File a Grievance
          </button>
          <button onClick={() => navigate('#grievance/track')} className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem', borderRadius: '8px' }}>
            <Search size={20} /> Track Grievance Status
          </button>
        </div>

        {/* Quick Track Inline Input */}
        <form onSubmit={handleTrackSearch} className="glass-panel" style={{
          display: 'flex',
          gap: '12px',
          padding: '8px',
          maxWidth: '500px',
          width: '100%',
          borderRadius: '12px',
          border: '1.5px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <input 
            type="text" 
            placeholder="Enter Grievance ID (e.g. GRV-2026-000101)..." 
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="input-control"
            style={{ border: 'none', background: 'transparent', flex: 1, padding: '10px' }}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
            Track
          </button>
        </form>
      </section>

      {/* Metrics Dashboard Row */}
      <section style={{ padding: '40px 20px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        <div className="dashboard-grid">
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <h3>Registered Complaints</h3>
              <p>{stats.total}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-active)' }}>
              <FileText size={24} />
            </div>
          </div>
          
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <h3>Total Resolved</h3>
              <p>{stats.resolved}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-success)' }}>
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-info">
              <h3>Resolution Rate</h3>
              <p>{stats.rate}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-info)' }}>
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-info">
              <h3>Avg. Resolution</h3>
              <p>{stats.avgTime}</p>
            </div>
            <div className="stat-icon" style={{ color: 'var(--color-warning)' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* Demo Sign In Sandbox Grid */}
      <section style={{ 
        padding: '60px 40px', 
        borderTop: '1px solid var(--border-color)', 
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-tertiary)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Developer Demo Sandbox</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
          Evaluate the role-based workflows immediately using pre-configured mock data.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {/* Citizen Card */}
          <div className="glass-panel glow-card" style={{ padding: '24px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '16px' }}>
            <div>
              <span className="badge badge-submitted" style={{ marginBottom: '16px' }}>Role: Citizen</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Citizen Workspace</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
                Submit new complaints with image/video attachments, view automated AI suggestions, trace status logs on visual timelines, chat with officers, and rate resolved issues.
              </p>
            </div>
            <button onClick={() => handleDemoLogin('citizen')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In as Citizen <ArrowRight size={16} />
            </button>
          </div>

          {/* Officer Card */}
          <div className="glass-panel glow-card" style={{ padding: '24px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '16px' }}>
            <div>
              <span className="badge badge-assigned" style={{ marginBottom: '16px' }}>Role: Officer</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Department Officer</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
                Track assigned queue, view category SLA deadlines, request client information, upload resolution evidence, add remarks, and escalate delayed cases.
              </p>
            </div>
            <button onClick={() => handleDemoLogin('officer')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In as Officer <ArrowRight size={16} />
            </button>
          </div>

          {/* Admin Card */}
          <div className="glass-panel glow-card" style={{ padding: '24px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '16px' }}>
            <div>
              <span className="badge badge-resolved" style={{ marginBottom: '16px' }}>Role: Admin</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Portal Administrator</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
                Access global analytics, audit logs, and escalation lists. Modify department structures, configure categories and subcategory SLAs, and promote citizens to officers.
              </p>
            </div>
            <button onClick={() => handleDemoLogin('admin')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In as Admin <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* How it Works / Core Features */}
      <section style={{ padding: '60px 40px', maxWidth: '1000px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '40px' }}>Platform Features</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div style={{ display: 'flex', gap: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-active)', flexShrink: 0 }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px' }}>Smart Routing</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Subcategories are directly mapped to specific municipal departments (Water, Electricity, Sanitation), eliminating manual redirection delays.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-info)', flexShrink: 0 }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px' }}>Real-time Timelines</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Citizens see the precise lifecycle status (Submitted, Acknowledged, Under Review, In Progress, Resolved) with timestamp logs and handling officer names.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', color: 'var(--color-warning)', flexShrink: 0 }}>
              <Clock size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px' }}>SLA Enforcement</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                System tracks deadlines. Overdue grievances are automatically marked "SLA Breached", flagged in red, and escalated to supervisors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '30px 40px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '0.85rem',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <p>&copy; 2026 JanSuniye Citizen Redressal Portal. All rights reserved. Secured government-tech demonstration.</p>
      </footer>
    </div>
  );
}
