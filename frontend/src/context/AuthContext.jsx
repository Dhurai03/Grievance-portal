import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.getMe();
      setUser(data.user);
      fetchUnreadCount();
    } catch (_) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.getNotifications({ unreadOnly: true, limit: 1 });
      setUnreadNotifications(data.unreadCount || 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Poll notifications every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    fetchUnreadCount();
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUnreadNotifications(0);
  };

  const refreshUser = fetchMe;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refreshUser,
      unreadNotifications, setUnreadNotifications, fetchUnreadCount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
