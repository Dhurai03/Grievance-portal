import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, MessageSquare, X, Send, Trash2,
  ChevronDown, ArrowRight, CheckCircle2, Bot, User,
  Clock, ShieldAlert, FileText, Search
} from 'lucide-react';
import { API_BASE } from '../services/api';

export default function AIChatBot({ navigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'model',
      content: "Hello! I'm **EduGrieve AI**, your official Campus Grievance Assistant. 🎓\n\nI can help you:\n- **Draft clear complaints** with actionable details for department officers\n- **Check the real-time status** of your existing grievances\n- Explain college **SLA resolution deadlines** and anti-ragging protection\n\nHow can I assist you on campus today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem('token') || '');
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const activeToken = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      const reply = data.reply || "I've analyzed your inquiry. You can register this as a formal complaint via the Submit Grievance tab.";

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'model',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'model',
          content: "I am temporarily having trouble reaching the campus server. You can still file your complaint directly using the **Submit Grievance** form, and our system will route it automatically!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'model',
        content: "Chat cleared. What campus issue can I assist you with?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    { label: "🔍 Check My Ticket Status", query: "What is the status of my active grievances?" },
    { label: "✍️ Draft Exam Grievance", query: "Help me draft a complaint about semester marks missing from student portal" },
    { label: "🏢 Hostel Maintenance", query: "How to report broken bathroom pipe and water supply failure in hostel?" },
    { label: "⏱️ College SLAs", query: "What are the department resolution SLA timeframes?" },
    { label: "🚨 Anti-Ragging Help", query: "How do I report ragging confidentially and anonymously?" }
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '26px',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Campus Assistant"
      >
        {isOpen ? <X size={22} /> : (
          <div style={{ position: 'relative' }}>
            <Sparkles size={22} />
            <span style={{
              position: 'absolute', top: '-3px', right: '-3px',
              width: '9px', height: '9px', borderRadius: '50%',
              background: '#059669', border: '2px solid #ffffff'
            }} />
          </div>
        )}
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '88px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '540px',
          maxHeight: 'calc(100vh - 120px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  Campus Assistant
                </h3>
                <span style={{ fontSize: '0.6875rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                  AI Guidance · Official Policy Guardrails
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={clearChat}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                title="Clear Chat History"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none'
          }}>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.query)}
                disabled={loading}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: msg.role === 'user' ? 'var(--primary)' : '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: msg.role === 'user' ? '#fff' : 'var(--primary)',
                  flexShrink: 0, fontSize: '0.75rem', fontWeight: 600
                }}>
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>

                <div style={{
                  maxWidth: '82%',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '9px 12px',
                  borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '0.625rem',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    marginTop: '3px',
                    textAlign: 'right'
                  }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', flexShrink: 0
                }}>
                  <Bot size={13} />
                </div>
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  Processing inquiry...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask about drafting, SLAs, or ticket status..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
