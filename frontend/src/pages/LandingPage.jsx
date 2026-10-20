import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Shield, Clock, Building2,
  ArrowRight, Search, CheckCircle, ChevronDown, ChevronUp,
  BookOpen, FileCheck, Laptop, CreditCard, HeartHandshake,
  BookMarked, ShieldAlert, AlertCircle
} from 'lucide-react';

// Department list aligned with system classifier and institutional regulations
const DEPARTMENTS = [
  {
    code: 'ACAD',
    name: 'Academic Affairs',
    icon: BookOpen,
    desc: 'Course curriculum, attendance records, academic certificates, and faculties.'
  },
  {
    code: 'EXAM',
    name: 'Examinations',
    icon: FileCheck,
    desc: 'Semester timetables, hall tickets, grade evaluations, and revaluation requests.'
  },
  {
    code: 'HSTL',
    name: 'Hostel & Facilities',
    icon: Building2,
    desc: 'Room allocation, sanitation, water and electrical maintenance, and dining hall quality.'
  },
  {
    code: 'IT',
    name: 'IT & Technical Support',
    icon: Laptop,
    desc: 'Campus Wi-Fi connectivity, student portal credentials, and computer lab facilities.'
  },
  {
    code: 'FIN',
    name: 'Fees & Scholarships',
    icon: CreditCard,
    desc: 'Fee payment receipts, scholarship disbursements, and fee refund verifications.'
  },
  {
    code: 'WELF',
    name: 'Student Welfare',
    icon: HeartHandshake,
    desc: 'Student counseling, mental wellness, healthcare support, and grievances.'
  },
  {
    code: 'LIB',
    name: 'Library & Resources',
    icon: BookMarked,
    desc: 'Book circulation, digital journal subscriptions, and quiet study room access.'
  },
  {
    code: 'DISC',
    name: 'Discipline & Anti-Ragging',
    icon: ShieldAlert,
    desc: 'Campus safety, anti-ragging monitoring, code of conduct, and urgent safety cases.'
  }
];

// Three-step workflow
const STEPS = [
  {
    step: '01',
    title: 'Submit your grievance',
    desc: 'Provide details regarding your academic or campus concern with optional document attachments or anonymous filing.'
  },
  {
    step: '02',
    title: 'Department reviews',
    desc: 'The portal routes your request to the responsible department officer, initiating an inquiry within defined SLA guidelines.'
  },
  {
    step: '03',
    title: 'Track progress until resolution',
    desc: 'Monitor each stage in real time, view official status notes, and receive confirmation when your issue is resolved.'
  }
];

// Institutional FAQ items
const FAQS = [
  {
    q: 'How do I submit a grievance?',
    a: 'Sign in to your student account and click "Submit a Grievance". Enter a clear description, select the relevant category, and attach supporting documents if needed. For sensitive matters like anti-ragging, you can choose anonymous submission.'
  },
  {
    q: 'How can I track the status of my complaint?',
    a: 'Every submitted grievance receives a unique tracking ID (e.g., EDU-2026-00001). You can enter this ID into the tracking field on this landing page or visit the dedicated Track Grievance page to view real-time lifecycle progression.'
  },
  {
    q: 'How does department routing work?',
    a: 'EduGrieve evaluates the content and category of your grievance to route it directly to the designated department officer (such as Academic Affairs, Hostel, Finance, or IT), ensuring prompt evaluation without manual dispatch delays.'
  },
  {
    q: 'How are resolution updates communicated?',
    a: 'You will receive immediate in-portal notifications as officers evaluate, update, and resolve your ticket. Once completed, an official resolution note is published and you have the opportunity to provide feedback.'
  }
];

export default function LandingPage({ navigate }) {
  const { user } = useAuth();
  const [trackId, setTrackId] = useState('');
  const [trackError, setTrackError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    const cleanId = trackId.trim();
    if (!cleanId) {
      setTrackError('Please enter a tracking ID (e.g., EDU-2026-00001).');
      return;
    }
    setTrackError('');
    navigate(`#track?id=${encodeURIComponent(cleanId.toUpperCase())}`);
  };

  const handleScrollToDepartments = (e) => {
    e.preventDefault();
    const el = document.getElementById('departments');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrimaryAction = () => {
    if (!user) {
      navigate('#login');
    } else if (user.role === 'student') {
      navigate('#student/submit');
    } else if (user.role === 'officer' || user.role === 'faculty') {
      navigate('#officer/dashboard');
    } else {
      navigate('#admin/dashboard');
    }
  };

  const getDashboardTarget = () => {
    if (!user) return '#login';
    if (user.role === 'student') return '#student/dashboard';
    if (user.role === 'officer' || user.role === 'faculty') return '#officer/dashboard';
    return '#admin/dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Header / Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255, 255, 255, 0.96)' : 'var(--bg-secondary)',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: '1px solid var(--border-color)',
        transition: 'all 0.2s ease',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none'
      }}>
        {/* Brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigate('#landing')}
          role="button"
          tabIndex={0}
          aria-label="EduGrieve Home"
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GraduationCap size={19} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.2 }}>
              EduGrieve
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Educational Grievance Portal
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(getDashboardTarget())}
              >
                Dashboard
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePrimaryAction}
              >
                Submit Grievance
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('#login')}
              >
                Sign In
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('#register')}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '110px 24px 50px', textAlign: 'center',
        borderBottom: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)'
      }}>
        <div style={{ maxWidth: '760px', width: '100%' }}>
          {/* Subtle Institutional Label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 14px', borderRadius: '4px',
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            marginBottom: '20px'
          }}>
            <GraduationCap size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
              Institutional Grievance Redressal Portal
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.1rem, 5vw, 3.25rem)',
            fontWeight: 800, lineHeight: 1.15, marginBottom: '18px',
            color: 'var(--text-primary)', letterSpacing: '-0.02em'
          }}>
            Your Voice Matters.<br />
            <span style={{ color: 'var(--primary)' }}>We Make It Heard.</span>
          </h1>

          {/* Supporting Description */}
          <p style={{
            fontSize: '1.0625rem', color: 'var(--text-secondary)',
            lineHeight: 1.7, marginBottom: '32px', maxWidth: '580px', margin: '0 auto 32px'
          }}>
            A centralized, transparent redressal portal for students, faculty, and administrative staff. Submit grievances, track resolution timelines, and resolve issues collaboratively.
          </p>

          {/* Clean Hero Action Buttons (Primary + Secondary) */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
            <button className="btn btn-primary btn-lg" onClick={handlePrimaryAction}>
              Submit a Grievance <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate(user ? getDashboardTarget() : '#login')}
            >
              {user ? 'Open Dashboard' : 'Sign In'}
            </button>
          </div>

          {/* Grievance Tracking Input */}
          <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'left' }}>
            <form onSubmit={handleTrack} style={{
              display: 'flex', gap: '8px',
              background: 'var(--bg-secondary)', border: `1px solid ${trackError ? 'var(--secondary)' : 'var(--border-color)'}`,
              borderRadius: '8px', padding: '4px 4px 4px 14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '9px' }} />
              <input
                id="hero-track-input"
                type="text"
                placeholder="Enter tracking ID (e.g., EDU-2026-00001)"
                value={trackId}
                onChange={e => {
                  setTrackId(e.target.value);
                  if (trackError) setTrackError('');
                }}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'var(--font-sans)'
                }}
                aria-label="Tracking ID"
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                Track
              </button>
            </form>

            {trackError ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                marginTop: '6px', fontSize: '0.75rem', color: 'var(--secondary)'
              }}>
                <AlertCircle size={13} />
                <span>{trackError}</span>
              </div>
            ) : (
              <div style={{
                marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center'
              }}>
                Public status overview available. Detailed grievance logs require student sign-in.
              </div>
            )}
          </div>
        </div>

        {/* Explore Departments Link */}
        <a
          href="#departments"
          onClick={handleScrollToDepartments}
          style={{
            marginTop: '44px',
            color: 'var(--text-muted)', display: 'inline-flex', flexDirection: 'column',
            alignItems: 'center', gap: '4px', fontSize: '0.8125rem', textDecoration: 'none',
            fontWeight: 500, cursor: 'pointer'
          }}
        >
          <span>Explore departments</span>
          <ChevronDown size={15} />
        </a>
      </section>

      {/* Trust Indicators */}
      <section style={{
        padding: '36px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Indicator 1 */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '12px 16px', borderRadius: '8px',
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Shield size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  Secure grievance submission
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Encrypted data transmission with optional anonymous reporting for sensitive concerns.
                </p>
              </div>
            </div>

            {/* Indicator 2 */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '12px 16px', borderRadius: '8px',
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Clock size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  Transparent status updates
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Real-time ticket progression with milestone updates and institutional SLA tracking.
                </p>
              </div>
            </div>

            {/* Indicator 3 */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '12px 16px', borderRadius: '8px',
              background: 'var(--bg-primary)', border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Building2 size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  Department-level accountability
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Direct assignment to official department officers with senior dean-level escalation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '64px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
              fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
            }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '0.9375rem' }}>
              A straightforward three-step resolution pathway built to resolve complaints systematically.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {STEPS.map((s) => (
              <div
                key={s.step}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: 'var(--primary)',
                  marginBottom: '12px'
                }}>
                  {s.step}
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Departments Section */}
      <section id="departments" style={{ padding: '64px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
                fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
              }}>
                Educational Departments
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', fontSize: '0.9375rem', margin: 0 }}>
                Grievances are directed to authorized department representatives for formal evaluation and redressal.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrimaryAction}
            >
              File a Complaint
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {DEPARTMENTS.map((dept) => {
              const IconComponent = dept.icon;
              return (
                <div
                  key={dept.code}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '18px',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#93C5FD';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: '#EFF6FF', border: '1px solid #BFDBFE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComponent size={18} color="var(--primary)" />
                      </div>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)',
                        padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px'
                      }}>
                        {dept.code}
                      </span>
                    </div>
                    <h3 style={{
                      fontWeight: 600, fontSize: '0.9375rem',
                      color: 'var(--text-primary)', marginBottom: '6px'
                    }}>
                      {dept.name}
                    </h3>
                    <p style={{
                      fontSize: '0.8125rem', color: 'var(--text-secondary)',
                      lineHeight: 1.5, margin: 0
                    }}>
                      {dept.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ padding: '64px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
              fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px'
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
              Information regarding complaint submission, routing logic, and grievance resolution policies.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                    aria-expanded={isOpen}
                  >
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 20px 18px',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '14px'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section style={{ padding: '56px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.625rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px'
          }}>
            Institutional Redressal, Made Simple
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.65, fontSize: '0.9375rem' }}>
            Whether you have an academic inquiry, facility concern, or urgent student safety issue, EduGrieve provides structured, auditable resolution.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={handlePrimaryAction}>
              Submit a Grievance <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate(user ? getDashboardTarget() : '#login')}>
              {user ? 'View Dashboard' : 'Sign In'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>EduGrieve</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>— Institutional Grievance Redressal Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
          <button
            onClick={() => navigate('#track')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            Track Status
          </button>
          <button
            onClick={() => navigate('#login')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('#register')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            Register
          </button>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', width: '100%', textAlign: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          © {new Date().getFullYear()} EduGrieve. Designed for university and college student grievance management.
        </div>
      </footer>
    </div>
  );
}
