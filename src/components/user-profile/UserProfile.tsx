import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDeveloper } from '../../contexts/DeveloperContext';
import { api as apiClient } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import type { User, Message } from './types';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import PermissionsTab from './PermissionsTab';

const UserProfile: React.FC = () => {
  const { logout } = useAuth();
  const { isDeveloperMode, toggleDeveloperMode } = useDeveloper();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordValidation, setPasswordValidation] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/auth/me');

      if (response.data.success) {
        const userData = response.data.user;
        setCurrentUser(userData);
        setProfileForm({
          firstName: userData.profile?.firstName || '',
          lastName: userData.profile?.lastName || '',
          displayName: userData.profile?.displayName || userData.username,
          email: userData.email || '',
          timezone: userData.profile?.timezone || 'UTC',
          language: userData.profile?.language || 'en'
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setMessage({ type: 'error', text: 'Failed to load user profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await apiClient.put('/api/auth/profile', {
        email: profileForm.email,
        profile: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          displayName: profileForm.displayName,
          timezone: profileForm.timezone,
          language: profileForm.language
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        await loadUserProfile();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to update profile' });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    try {
      const response = await apiClient.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordValidation(null);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to change password' });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = async (password: string) => {
    if (password.length === 0) {
      setPasswordValidation(null);
      return;
    }
    try {
      const response = await apiClient.post('/api/auth/validate-password', { password });
      setPasswordValidation(response.data);
    } catch (error) {
      console.error('Error validating password:', error);
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setPasswordForm(prev => ({ ...prev, newPassword: value }));
    validatePassword(value);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setPasswordForm(prev => ({ ...prev, confirmPassword: value }));
  };

  const handleCurrentPasswordChange = (value: string) => {
    setPasswordForm(prev => ({ ...prev, currentPassword: value }));
  };

  const handleResendVerification = async () => {
    try {
      const response = await apiClient.post('/api/auth/resend-verification');
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Verification email sent' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to send verification email' });
      }
    } catch (error: any) {
      console.error('Error resending verification:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send verification email'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
      logout();
    } catch (error) {
      console.error('Error during logout:', error);
      logout();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-base-content mb-4">User Not Found</h2>
          <p className="text-base-content/70">Unable to load user profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-8 text-primary-content">
          <div className="flex items-center space-x-4">
            <div className="avatar placeholder">
              <div className="bg-primary-content bg-opacity-20 rounded-full w-20 h-20">
                <span className="text-2xl font-bold text-primary-content">
                  {currentUser.profile?.displayName?.charAt(0).toUpperCase() || currentUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{currentUser.profile?.displayName || currentUser.username}</h1>
              <p className="text-primary-content/80">@{currentUser.username}</p>
              <div className="badge badge-primary-content badge-outline capitalize mt-2">{currentUser.role}</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mx-6 mt-4`}>
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs tabs-boxed mx-6 mt-4">
          <button
            className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button
            className={`tab ${activeTab === 'security' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`tab ${activeTab === 'permissions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            🔑 Permissions
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <ProfileTab
              currentUser={currentUser}
              profileForm={profileForm}
              isDeveloperMode={isDeveloperMode}
              saving={saving}
              onProfileFormChange={(updates) => setProfileForm(prev => ({ ...prev, ...updates }))}
              onSubmit={handleProfileSubmit}
              onToggleDeveloperMode={toggleDeveloperMode}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              currentUser={currentUser}
              passwordForm={passwordForm}
              passwordValidation={passwordValidation}
              saving={saving}
              onCurrentPasswordChange={handleCurrentPasswordChange}
              onNewPasswordChange={handleNewPasswordChange}
              onConfirmPasswordChange={handleConfirmPasswordChange}
              onSubmit={handlePasswordChange}
              onResendVerification={handleResendVerification}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionsTab currentUser={currentUser} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
