import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Key, 
  Trash2, 
  ChevronDown, 
  ArrowRight, 
  CheckCircle2, 
  Bot,
  User,
  ExternalLink
} from 'lucide-react';

export default function AIChatBot({ navigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'model',
      content: "Hello! I'm the **JanSuniye Civic AI Assistant**. \n\nI can help you:\n- **Draft a grievance** with proper details\n- Find the **responsible department** and **SLA deadlines**\n- Explain municipal regulations or track complaint statuses.\n\nHow can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const cleanKey = tempApiKey.trim();
    setApiKey(cleanKey);
    if (cleanKey) {
      localStorage.setItem('gemini_api_key', cleanKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowSettings(false);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: 'model',
        content: cleanKey 
          ? "✅ **Google Gemini API Key saved!** All subsequent queries will be processed directly through Google's live Gemini model."
          : "ℹ️ **API Key removed.** Running in local intelligent civic assistant mode.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = async (textToSend = null) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Prepare history format
      const historyPayload = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content
      }));

      // Call chat API
      const response = await api.ai.chat(query.trim(), historyPayload);

      const aiMsg = {
        id: Date.now() + 1,
        role: 'model',
        content: response.reply || "I couldn't process that response. Please try rephrasing.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'model',
          content: "⚠️ I encountered an error communicating with the AI service. Please try again in a moment.",
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
        content: "Chat cleared! How else can I assist your municipal grievance inquiries?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Quick prompt chips
  const quickPrompts = [
    "Draft a pothole complaint for me",
    "Water pipe broken and leaking on main street",
    "Frequent power outages in my sector",
    "What is the SLA deadline for sanitation?",
    "How do I track an existing ticket?"
  ];

  // Simple formatter for markdown bold, bullet points, and code blocks
  const renderFormattedText = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, lineIdx) => {
      // Check for bullet lines
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Parse bold segments **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={partIdx} style={{ 
              background: 'var(--bg-tertiary)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontFamily: 'monospace',
              fontSize: '0.85em'
            }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} style={{ display: 'flex', gap: '8px', marginLeft: '6px', marginY: '3px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
            <div style={{ flex: 1 }}>{parts}</div>
          </div>
        );
      }

      return (
        <p key={lineIdx} style={{ margin: line.trim() ? '4px 0' : '6px 0', minHeight: line.trim() ? 'auto' : '8px' }}>
          {parts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Bubble in Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary animate-fade"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '9999px',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, #2563eb 0%, #0f172a 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}
          aria-label="Open AI Assistant"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)'
          }}>
            <Sparkles size={16} />
          </div>
          <span>Civic AI Chatbot</span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className="glass-panel animate-fade"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '580px',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -5px rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.25)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}>
                <Bot size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>JanSuniye Civic AI</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} title="Online"></div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {apiKey ? 'Powered by Google Gemini Live' : 'Intelligent Assistant Active'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
                title="AI Settings & API Key"
              >
                <Key size={16} />
              </button>
              <button
                onClick={clearChat}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
                title="Clear Conversation"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
                title="Minimize Chat"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Settings Drawer for API Key */}
          {showSettings && (
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Google Gemini API Key (Optional)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="input-control"
                    style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Save
                  </button>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  Stored locally in your browser. Leave blank to use built-in intelligent assistant.
                </span>
              </form>
            </div>
          )}

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--bg-primary)'
          }}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '3px',
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)'
                  }}>
                    <span>{isUser ? 'You' : 'Civic AI'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '14px',
                    borderTopRightRadius: isUser ? '2px' : '14px',
                    borderTopLeftRadius: isUser ? '14px' : '2px',
                    backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    lineHeight: 1.45,
                    boxShadow: 'var(--shadow-sm)',
                    wordBreak: 'break-word',
                    textAlign: 'left'
                  }}>
                    {renderFormattedText(msg.content)}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', padding: '8px 12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  animation: 'pulse 0.8s infinite alternate'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  animation: 'pulse 0.8s infinite alternate',
                  animationDelay: '0.2s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  animation: 'pulse 0.8s infinite alternate',
                  animationDelay: '0.4s'
                }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips Carousel */}
          {messages.length <= 3 && (
            <div style={{
              padding: '6px 12px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              whiteSpace: 'nowrap'
            }}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    borderRadius: '12px',
                    flexShrink: 0
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Ask anything about grievances, SLAs, departments..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              className="input-control"
              style={{
                borderRadius: '24px',
                padding: '8px 14px',
                fontSize: '0.85rem'
              }}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              className="btn btn-primary"
              style={{
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              disabled={loading || !input.trim()}
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
