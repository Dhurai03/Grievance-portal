import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch logged in user profile on load
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const data = await api.auth.me();
      setUser(data.user);
      loadNotifications();
    } catch (error) {
      console.error('Failed to load user profile on startup:', error);
      // Clean stale token
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user notifications
  const loadNotifications = async () => {
    try {
      const notifs = await api.notifications.list();
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // User Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      addToast('Welcome back! Logged in successfully.', 'success');
      loadNotifications();
      return data.user;
    } catch (error) {
      addToast(error.message || 'Login failed. Please check credentials.', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // User Register (Citizens only)
  const register = async (email, password, name, phone) => {
    setLoading(true);
    try {
      const data = await api.auth.register({ email, password, name, phone });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      addToast('Registration successful! Welcome to the portal.', 'success');
      loadNotifications();
      return data.user;
    } catch (error) {
      addToast(error.message || 'Registration failed. Please try again.', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // User Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotifications([]);
    addToast('Logged out successfully. Goodbye!', 'info');
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: loadUser,
      notifications,
      refreshNotifications: loadNotifications,
      markNotificationRead,
      toasts,
      addToast,
      removeToast
    }}>
      {children}
      
      {/* Dynamic Toast Renderer overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            role="alert"
          >
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                opacity: 0.5,
                padding: '0 4px'
              }}
              aria-label="Close message"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
