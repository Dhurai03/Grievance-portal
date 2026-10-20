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
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', borderRadius: '10px',
        padding: '20px 24px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', fontWeight: 700, color: 'white'
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {user?.name}
              </h1>
              <span className={`badge badge-${user?.role}`}>{user?.role?.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
              {user?.email} · {user?.studentId ? `Roll No: ${user.studentId}` : (user?.designation || 'Staff')}
            </p>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={logout} style={{ color: '#DC2626' }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Personal Details Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <User size={16} color="var(--primary)" /> Profile Information
          </h2>

          {profileMsg.text && (
            <div style={{
              padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.8125rem',
              background: profileMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${profileMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: profileMsg.type === 'success' ? '#065F46' : '#991B1B'
            }}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile} style={{ marginTop: '4px' }}>
              <Save size={14} /> {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Lock size={16} color="var(--primary)" /> Security & Password
          </h2>

          {passwordMsg.text && (
            <div style={{
              padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.8125rem',
              background: passwordMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${passwordMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: passwordMsg.type === 'success' ? '#065F46' : '#991B1B'
            }}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            <button type="submit" className="btn btn-primary btn-sm" disabled={savingPassword} style={{ marginTop: '4px' }}>
              <Lock size={14} /> {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
