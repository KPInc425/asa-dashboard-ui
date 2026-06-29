import React from 'react';
import type { User } from './types';

interface ProfileTabProps {
  currentUser: User;
  profileForm: {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    timezone: string;
    language: string;
  };
  isDeveloperMode: boolean;
  saving: boolean;
  onProfileFormChange: (updates: Partial<ProfileTabProps['profileForm']>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleDeveloperMode: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  profileForm,
  isDeveloperMode,
  saving,
  onProfileFormChange,
  onSubmit,
  onToggleDeveloperMode,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-base-content">Profile Information</h2>

      <form onSubmit={onSubmit} className="space-y-6">
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
                  onChange={(e) => onProfileFormChange({ firstName: e.target.value })}
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
                  onChange={(e) => onProfileFormChange({ lastName: e.target.value })}
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
                onChange={(e) => onProfileFormChange({ displayName: e.target.value })}
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
                onChange={(e) => onProfileFormChange({ email: e.target.value })}
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
                  onChange={(e) => onProfileFormChange({ timezone: e.target.value })}
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
                  onChange={(e) => onProfileFormChange({ language: e.target.value })}
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
                  onChange={onToggleDeveloperMode}
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
  );
};

export default ProfileTab;
