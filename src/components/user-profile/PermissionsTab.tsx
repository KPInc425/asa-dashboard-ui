import React from 'react';
import type { User } from './types';

interface PermissionsTabProps {
  currentUser: User;
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({ currentUser }) => {
  return (
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

      {/* Permissions List */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Permissions</h3>
          {currentUser.permissions && currentUser.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentUser.permissions.map((permission) => (
                <div key={permission} className="badge badge-outline">{permission}</div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/70 text-sm">No specific permissions assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsTab;
