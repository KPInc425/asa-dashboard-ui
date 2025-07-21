import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDeveloper } from '../contexts/DeveloperContext';
import { api as apiClient } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import PasswordInput from './PasswordInput';

interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string | null;
  timezone: string;
  language: string;
}

interface UserSecurity {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  profile: UserProfile;
  security: UserSecurity;
  metadata: {
    createdAt: string;
    lastActivity: string;
  };
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

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
        await loadUserProfile(); // Reload to get updated data
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
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
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

  // const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setPasswordForm(prev => ({ ...prev, [name]: value }));
  //   
  //   if (name === 'newPassword') {
  //     validatePassword(value);
  //   }
  // };

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
      logout(); // Still logout even if API call fails
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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content">Profile Information</h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">First Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Enter your first name"
                        />
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Last Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Display Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="How your name appears to others"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Contact Information</h3>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Email Address</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered w-full"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Timezone</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          value={profileForm.timezone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Language</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          value={profileForm.language}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="ja">Japanese</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Developer Mode Toggle */}
                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text font-medium">
                          🛠️ Developer Mode
                          <div className="text-xs text-base-content/60 mt-1">
                            Show debug elements and developer tools
                          </div>
                        </span>
                        <input 
                          type="checkbox" 
                          className="toggle toggle-primary" 
                          checked={isDeveloperMode}
                          onChange={toggleDeveloperMode}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className={`btn btn-primary ${saving ? 'loading' : ''}`}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content">Security Settings</h2>
              
              {/* Email Verification Status */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Email Verification</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base-content/70">
                        {currentUser.security?.emailVerified 
                          ? 'Your email is verified' 
                          : 'Please verify your email address'
                        }
                      </p>
                      {currentUser.email && (
                        <p className="text-sm text-base-content/50">{currentUser.email}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {currentUser.security?.emailVerified ? (
                        <div className="badge badge-success">Verified</div>
                      ) : (
                        <>
                          <div className="badge badge-warning">Unverified</div>
                          <button 
                            onClick={handleResendVerification}
                            className="btn btn-sm btn-outline"
                          >
                            Resend
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-base-content/70">
                      {currentUser.security?.twoFactorEnabled 
                        ? 'Two-factor authentication is enabled' 
                        : 'Add an extra layer of security to your account'
                      }
                    </p>
                    <div className="flex items-center space-x-2">
                      {currentUser.security?.twoFactorEnabled ? (
                        <div className="badge badge-success">Enabled</div>
                      ) : (
                        <button className="btn btn-sm btn-outline">Enable</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Change Password</h3>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {/* Current Password Section */}
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h3 className="card-title text-lg">Current Password</h3>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Current Password</span>
                          </label>
                          <PasswordInput
                            value={passwordForm.currentPassword}
                            onChange={handleCurrentPasswordChange}
                            placeholder="Enter your current password"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* New Password Section */}
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h3 className="card-title text-lg">New Password</h3>
                        <div className="space-y-4">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">New Password</span>
                            </label>
                            <PasswordInput
                              value={passwordForm.newPassword}
                              onChange={handleNewPasswordChange}
                              placeholder="Enter your new password"
                              required
                            />
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">Confirm New Password</span>
                            </label>
                            <PasswordInput
                              value={passwordForm.confirmPassword}
                              onChange={handleConfirmPasswordChange}
                              placeholder="Confirm your new password"
                              required
                            />
                          </div>

                          {/* Password Validation */}
                          {passwordValidation && (
                            <div className="mt-4 p-4 rounded-lg bg-base-300">
                              <div className={`text-sm font-medium ${passwordValidation.valid ? 'text-success' : 'text-error'}`}>
                                Password Strength: {passwordValidation.valid ? 'Valid' : 'Invalid'}
                              </div>
                              {passwordValidation.errors && passwordValidation.errors.length > 0 && (
                                <ul className="text-xs text-error mt-2 space-y-1">
                                  {passwordValidation.errors.map((error: string, index: number) => (
                                    <li key={index} className="flex items-center">
                                      <span className="mr-2">•</span>
                                      {error}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        className={`btn btn-primary ${saving ? 'loading' : ''}`}
                        disabled={saving}
                      >
                        {saving ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Logout */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Session Management</h3>
                  <p className="text-base-content/70">Sign out of your current session</p>
                  <div className="card-actions justify-end">
                    <button onClick={handleLogout} className="btn btn-error">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-base-content">Permissions & Access</h2>
              
              {/* Role Information */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Role Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">Role:</span>
                      <div className="badge badge-primary capitalize">{currentUser.role}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">User ID:</span>
                      <span className="text-sm font-mono">{currentUser.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">Created:</span>
                      <span className="text-sm">
                        {currentUser.metadata?.createdAt 
                          ? new Date(currentUser.metadata.createdAt).toLocaleDateString()
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">Last Activity:</span>
                      <span className="text-sm">
                        {currentUser.metadata?.lastActivity 
                          ? new Date(currentUser.metadata.lastActivity).toLocaleDateString()
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Permissions</h3>
                  <div className="space-y-2">
                    {currentUser.permissions && currentUser.permissions.length > 0 ? (
                      currentUser.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-base-content/70">No specific permissions assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Login History */}
              {currentUser.security?.lastLogin && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">Last Login</h3>
                    <p className="text-base-content/70">
                      {new Date(currentUser.security.lastLogin).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 