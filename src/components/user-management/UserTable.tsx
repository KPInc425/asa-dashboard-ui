import React from 'react';
import { getRoleBadgeColor } from './utils';
import type { User } from './types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (username: string) => void;
}

const getStatusBadge = (user: User) => {
  if (user.security?.emailVerified) {
    return <div className="badge badge-success badge-xs">Verified</div>;
  }
  return <div className="badge badge-warning badge-xs">Unverified</div>;
};

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title">Users ({users.length})</h2>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                          <span className="text-xs">
                            {user.profile?.displayName?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{user.profile?.displayName || user.username}</div>
                        <div className="text-sm opacity-50">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{user.email || 'No email'}</span>
                  </td>
                  <td>
                    <div className={`badge ${getRoleBadgeColor(user.role)} capitalize`}>
                      {user.role}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(user)}
                  </td>
                  <td>
                    <span className="text-sm">
                      {user.metadata?.createdAt
                        ? new Date(user.metadata.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm">
                      {user.metadata?.lastActivity
                        ? new Date(user.metadata.lastActivity).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="btn btn-sm btn-outline"
                      >
                        Edit
                      </button>
                      {user.username !== 'admin' && (
                        <button
                          onClick={() => onDelete(user.username)}
                          className="btn btn-sm btn-error"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
