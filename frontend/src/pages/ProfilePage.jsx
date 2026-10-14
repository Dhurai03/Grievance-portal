import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User, Mail, Phone, Lock, Save, LogOut,
  GraduationCap, Building2, CheckCircle2, Shield
} from 'lucide-react';

export default function ProfilePage({ navigate }) {
  const { user, updateUser, logout } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await api.updateProfile({ name, phone, department });
      if (res.user) updateUser(res.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    }
    setSavingPassword(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Profile Badge */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,170,0.08))',
        border: '1px solid var(--border-active)', borderRadius: '20px',
        padding: '28px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white'
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                {user?.name}
              </h1>
              <span className={`badge badge-${user?.role}`}>{user?.role?.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {user?.email} • {user?.studentId ? `Roll No: ${user.studentId}` : (user?.designation || 'Staff')}
            </p>
          </div>
        </div>

        <button className="btn btn-ghost" onClick={logout} style={{ color: '#FF6B6B' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Personal Details Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--primary)" /> Profile Information
          </h2>

          {profileMsg.text && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem',
              background: profileMsg.type === 'success' ? 'rgba(0,212,170,0.15)' : 'rgba(255,107,107,0.15)',
              color: profileMsg.type === 'success' ? '#00D4AA' : '#FF6B6B'
            }}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text" required className="form-control"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email" disabled className="form-control"
                value={user?.email || ''} style={{ opacity: 0.7 }}
              />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="text" placeholder="+91 98765 43210" className="form-control"
                value={phone} onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Department / Branch</label>
              <input
                type="text" placeholder="e.g. Computer Science & Engineering" className="form-control"
                value={department} onChange={e => setDepartment(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ marginTop: '8px' }}>
              <Save size={15} /> {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#FFB347" /> Security & Password
          </h2>

          {passwordMsg.text && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem',
              background: passwordMsg.type === 'success' ? 'rgba(0,212,170,0.15)' : 'rgba(255,107,107,0.15)',
              color: passwordMsg.type === 'success' ? '#00D4AA' : '#FF6B6B'
            }}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password" required className="form-control"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">New Password</label>
              <input
                type="password" required minLength={6} className="form-control"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password" required minLength={6} className="form-control"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingPassword} style={{ marginTop: '8px' }}>
              <Lock size={15} /> {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
