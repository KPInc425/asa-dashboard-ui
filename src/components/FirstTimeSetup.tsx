import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api as apiClient } from '../services/api';
import PasswordInput from './PasswordInput';

interface FirstTimeSetupProps {
  onComplete: () => void;
}

const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({ onComplete }) => {
  const { user, completeFirstTimeSetup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    username: user?.username || 'admin',
    newPassword: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: ''
  });

  const [passwordValidation, setPasswordValidation] = useState<any>(null);

  // Check if this is the default admin user
  const isDefaultAdmin = user?.username === 'admin' && 
                        (user?.profile?.firstName === 'Admin' || !user?.profile?.firstName);

  useEffect(() => {
    // If not default admin, complete immediately
    if (!isDefaultAdmin) {
      onComplete();
    }
  }, [isDefaultAdmin, onComplete]);

  // Validate password strength
  const validatePassword = async (password: string) => {
    if (!password) {
      setPasswordValidation(null);
      return;
    }

    try {
      const response = await apiClient.post('/api/auth/validate-password', { password });
      setPasswordValidation(response.data);
    } catch (error) {
      console.error('Password validation error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate password when typing
    if (name === 'newPassword') {
      validatePassword(value);
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, newPassword: value }));
    validatePassword(value);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate passwords match
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }

      // Validate password strength
      if (passwordValidation && !passwordValidation.valid) {
        setMessage({ type: 'error', text: 'Password does not meet security requirements' });
        return;
      }

      // Update user profile and credentials
      const updateData: any = {
        newPassword: formData.newPassword,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          displayName: formData.firstName && formData.lastName 
            ? `${formData.firstName} ${formData.lastName}` 
            : formData.firstName || formData.lastName || formData.username
        }
      };

      // Only include username if it's different
      if (formData.username !== 'admin') {
        updateData.username = formData.username;
      }

      const response = await apiClient.put('/api/auth/first-time-setup', updateData);
      
      if (response.data.success) {
        // Store new token and update user context
        if (response.data.token && response.data.user) {
          localStorage.setItem('auth_token', response.data.token);
          // Optionally, update user context immediately
          if (typeof completeFirstTimeSetup === 'function') {
            completeFirstTimeSetup();
          }
        }
        setMessage({ type: 'success', text: 'Setup completed successfully! Redirecting...' });
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Setup failed' });
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Setup failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not default admin
  if (!isDefaultAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🦖</span>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">
            Welcome to ASA Management Suite
          </h1>
          <p className="text-base-content/70">
            Please complete your initial setup to secure your account
          </p>
        </div>

        {/* Setup Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-6">Account Setup</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Section */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-lg">Account Information</h3>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Username</span>
                      <span className="label-text-alt text-warning">Recommended to change</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      className="input input-bordered w-full"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your preferred username"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        This will be your login username
                      </span>
                    </label>
                  </div>
                </div>
              </div>

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
                        name="firstName"
                        className="input input-bordered w-full"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Last Name</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        className="input input-bordered w-full"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Email Address</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="input input-bordered w-full"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-lg">Security</h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">New Password</span>
                        <span className="label-text-alt text-error">Required</span>
                      </label>
                      <PasswordInput
                        value={formData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter a strong password"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Confirm New Password</span>
                      </label>
                      <PasswordInput
                        value={formData.confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Confirm your new password"
                        required
                      />
                    </div>

                    {/* Password Validation */}
                    {passwordValidation && (
                      <div className="p-4 rounded-lg bg-base-300">
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

              {/* Message Display */}
              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  <span>{message.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  disabled={loading || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>
              <strong>Security Notice:</strong> You are currently using default credentials. 
              Please complete this setup to secure your account.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeSetup; 