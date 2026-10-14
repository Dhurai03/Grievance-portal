import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Brain, Shield, Bell, BarChart3, MessageSquare,
  ArrowRight, Search, Star, CheckCircle, Zap, Users, Clock,
  FileText, ChevronDown, ExternalLink
} from 'lucide-react';

const DEPARTMENTS = [
  { icon: '📚', name: 'Academic Affairs', count: 'Exams, Grades, Courses' },
  { icon: '🏠', name: 'Hostel & Accommodation', count: 'Rooms, Mess, Facilities' },
  { icon: '📖', name: 'Library', count: 'Books, Resources, Access' },
  { icon: '💻', name: 'IT & Technical Support', count: 'Network, Software, Hardware' },
  { icon: '💰', name: 'Finance & Fees', count: 'Payments, Scholarships, Refunds' },
  { icon: '🤝', name: 'Student Welfare', count: 'Counseling, Health, Support' },
  { icon: '🏃', name: 'Sports & Extracurricular', count: 'Grounds, Equipment, Events' },
  { icon: '🚌', name: 'Transportation', count: 'Bus Routes, Passes' },
  { icon: '🍽️', name: 'Canteen & Food', count: 'Quality, Hygiene, Services' },
  { icon: '💼', name: 'Placement & Career', count: 'Internships, Placements' },
  { icon: '🛡️', name: 'Ragging & Discipline', count: 'Anti-Ragging, Conduct' },
  { icon: '👩‍🏫', name: 'Faculty & Teaching', count: 'Quality, Standards' },
];

const FEATURES = [
  {
    icon: Brain, color: '#6C63FF',
    title: 'AI-Powered Routing',
    desc: 'Natural Language Processing automatically routes your grievance to the right department with 90%+ accuracy.'
  },
  {
    icon: Bell, color: '#FFB347',
    title: 'Real-Time Notifications',
    desc: 'Get instant updates on your grievance status via in-portal notifications at every step.'
  },
  {
    icon: Shield, color: '#00D4AA',
    title: 'Secure & Confidential',
    desc: 'Anonymous submission option with end-to-end secure communication between students and administration.'
  },
  {
    icon: BarChart3, color: '#4FC3F7',
    title: 'SLA Tracking',
    desc: 'Automatic escalation when grievances exceed their resolution timeline. No complaint falls through.'
  },
  {
    icon: MessageSquare, color: '#FF6B6B',
    title: 'Two-Way Communication',
    desc: 'Direct messaging between students and department officers with full audit trail.'
  },
  {
    icon: CheckCircle, color: '#6C63FF',
    title: 'Feedback & Ratings',
    desc: 'Rate the resolution quality and help improve the system. Your feedback shapes the process.'
  }
];

const STATS = [
  { value: '2,400+', label: 'Grievances Resolved' },
  { value: '98%', label: 'Resolution Rate' },
  { value: '48h', label: 'Avg. Resolution Time' },
  { value: '12', label: 'Departments Covered' },
];

export default function LandingPage({ navigate }) {
  const [trackId, setTrackId] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackId.trim()) navigate(`#track?id=${trackId.trim()}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(15,15,26,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-color)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(108,99,255,0.4)'
          }}>
            <GraduationCap size={22} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              EduGrieve
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AI College Grievance Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('#login')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('#register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background gradient blobs */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none', animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', animation: 'fadeIn 0.8s ease' }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '50px',
            background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)',
            marginBottom: '28px'
          }}>
            <Zap size={14} color="var(--primary-light)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-light)' }}>
              AI-Powered • NLP Routing • Real-Time Tracking
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontWeight: 900, lineHeight: 1.1, marginBottom: '24px',
            background: 'linear-gradient(135deg, #F0F0FF 30%, var(--primary-light) 60%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Your Voice Matters.
            <br />We Make It Heard.
          </h1>

          <p style={{
            fontSize: '1.1rem', color: 'var(--text-secondary)',
            lineHeight: 1.8, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px'
          }}>
            An intelligent grievance management portal for students. Submit complaints, get AI-powered routing to the right department, and track resolution in real-time.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('#register')}>
              Submit a Grievance <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('#login')}>
              Sign In
            </button>
          </div>

          {/* Quick Track */}
          <form onSubmit={handleTrack} style={{
            display: 'flex', gap: '12px', maxWidth: '440px', margin: '0 auto',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '16px', padding: '6px 6px 6px 16px',
            backdropFilter: 'blur(20px)'
          }}>
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '10px' }} />
            <input
              type="text"
              placeholder="Enter tracking ID (GRV-2024-00001)"
              value={trackId}
              onChange={e => setTrackId(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-sans)'
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              Track
            </button>
          </form>
        </div>

        <a href="#departments" style={{
          position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          color: 'var(--text-muted)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '4px', fontSize: '0.75rem', textDecoration: 'none',
          animation: 'float 2s ease-in-out infinite'
        }}>
          <span>Explore</span>
          <ChevronDown size={16} />
        </a>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '60px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
            {STATS.map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '2.5rem',
                  fontWeight: 900, color: 'var(--primary-light)', marginBottom: '4px'
                }}>{stat.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px'
            }}>12 Departments. One Portal.</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
              Our AI automatically routes your complaint to the most relevant department.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {DEPARTMENTS.map((dept, i) => (
              <div key={dept.name} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '20px',
                cursor: 'pointer', transition: 'var(--transition)',
                animation: `fadeIn 0.4s ease ${i * 0.05}s both`
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{dept.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{dept.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dept.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px'
            }}>Built for Students. Powered by AI.</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
              Modern technology making your grievance process faster, smarter, and more transparent.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {FEATURES.map((feat, i) => (
              <div key={feat.title} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '20px', padding: '28px',
                animation: `fadeIn 0.5s ease ${i * 0.08}s both`,
                transition: 'var(--transition)'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: `${feat.color}20`, border: `1px solid ${feat.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                }}>
                  <feat.icon size={24} color={feat.color} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,170,0.1))',
            border: '1px solid var(--border-active)',
            borderRadius: '28px', padding: '60px 40px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem',
              fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px'
            }}>Ready to Get Started?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.7 }}>
              Join thousands of students already using EduGrieve to resolve their college issues efficiently.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('#register')}>
                Register Now <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('#track')}>
                Track Grievance
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px', textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)', fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <GraduationCap size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>EduGrieve</span>
          <span>•</span>
          <span>AI-Powered College Grievance Portal</span>
        </div>
        <div>© 2024 EduGrieve. Empowering Students, Enabling Resolution.</div>
      </footer>
    </div>
  );
}
