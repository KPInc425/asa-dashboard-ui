import React from 'react';
import type { User } from './types';
import PasswordInput from '../PasswordInput';

interface SecurityTabProps {
  currentUser: User;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordValidation: any;
  saving: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResendVerification: () => void;
  onLogout: () => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  currentUser,
  passwordForm,
  passwordValidation,
  saving,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onResendVerification,
  onLogout,
}) => {
  return (
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
                  <button onClick={onResendVerification} className="btn btn-sm btn-outline">
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

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg">Current Password</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Current Password</span>
                  </label>
                  <PasswordInput
                    value={passwordForm.currentPassword}
                    onChange={onCurrentPasswordChange}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
              </div>
            </div>

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
                      onChange={onNewPasswordChange}
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
                      onChange={onConfirmPasswordChange}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>

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
            <button onClick={onLogout} className="btn btn-error">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
