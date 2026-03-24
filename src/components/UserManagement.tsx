import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import { api as apiClient, ApiError } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useConfirm } from '../contexts/ConfirmContext2';
import PasswordInput from './PasswordInput';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
    avatar: string | null;
    timezone: string;
    language: string;
  };
  security: {
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin: string;
  };
  metadata: {
    createdAt: string;
    lastActivity: string;
  };
}

interface Message {
  type: 'success' | 'error';
  text: string;
  details?: string[];
}

interface ApiErrorPayload {
  message?: string;
  errors?: string[];
}

const PASSWORD_REQUIREMENTS = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
    error: 'Password must be at least 8 characters long',
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
    error: 'Password must contain at least one uppercase letter',
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
    error: 'Password must contain at least one lowercase letter',
  },
  {
    id: 'number',
    label: 'At least one number',
    test: (password: string) => /\d/.test(password),
    error: 'Password must contain at least one number',
  },
  {
    id: 'special',
    label: 'At least one special character',
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    error: 'Password must contain at least one special character',
  },
  {
    id: 'common-patterns',
    label: 'Must not contain common patterns like 123, abc, password, admin, or qwerty',
    test: (password: string) => !/(123|abc|password|admin|qwerty)/i.test(password),
    error: 'Password cannot contain common patterns',
  },
] as const;

const getPasswordValidationErrors = (password: string) => {
  if (!password) {
    return [];
  }

  return PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.test(password)).map(
    (requirement) => requirement.error
  );
};

const extractApiMessage = (error: unknown, fallbackText: string): Message => {
  if (error instanceof ApiError) {
    const data = error.data as ApiErrorPayload | undefined;
    return {
      type: 'error',
      text: data?.message || error.message || fallbackText,
      details: Array.isArray(data?.errors) ? data.errors : undefined,
    };
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: ApiErrorPayload } }).response;
    return {
      type: 'error',
      text: response?.data?.message || fallbackText,
      details: Array.isArray(response?.data?.errors) ? response?.data?.errors : undefined,
    };
  }

  if (error instanceof Error) {
    return { type: 'error', text: error.message || fallbackText };
  }

  return { type: 'error', text: fallbackText };
};

const UserManagement: React.FC = () => {
  // const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
    firstName: '',
    lastName: '',
    displayName: ''
  });

  const [editForm, setEditForm] = useState({
    email: '',
    role: '',
    firstName: '',
    lastName: '',
    displayName: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const { showConfirm } = useConfirm();
  const passwordValidationErrors = getPasswordValidationErrors(createForm.password);
  const passwordRequirements = PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(createForm.password),
  }));
  const passwordsMatch = createForm.confirmPassword.length === 0 || createForm.password === createForm.confirmPassword;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/auth/users');
      
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to load users' });
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setMessage(extractApiMessage(error, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (createForm.password !== createForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setSaving(false);
      return;
    }

    if (passwordValidationErrors.length > 0) {
      setMessage({
        type: 'error',
        text: 'Password does not meet the required rules.',
        details: passwordValidationErrors,
      });
      setSaving(false);
      return;
    }

    try {
      const response = await apiClient.post('/api/auth/users', {
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        profile: {
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          displayName: createForm.displayName || createForm.username
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'User created successfully' });
        setShowCreateForm(false);
        setCreateForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'viewer',
          firstName: '',
          lastName: '',
          displayName: ''
        });
        await loadUsers();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to create user' });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage(extractApiMessage(error, 'Failed to create user'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await apiClient.put(`/api/auth/users/${editingUser.username}`, {
        email: editForm.email,
        role: editForm.role,
        profile: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          displayName: editForm.displayName
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'User updated successfully' });
        setEditingUser(null);
        await loadUsers();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to update user' });
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      setMessage(extractApiMessage(error, 'Failed to update user'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    const proceed = await showConfirm(`Are you sure you want to delete user "${username}"?`);
    if (!proceed) return;

    try {
      const response = await apiClient.delete(`/api/auth/users/${username}`);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'User deleted successfully' });
        await loadUsers();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to delete user' });
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage(extractApiMessage(error, 'Failed to delete user'));
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      email: user.email || '',
      role: user.role,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      displayName: user.profile?.displayName || user.username
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'badge-error';
      case 'operator': return 'badge-warning';
      case 'viewer': return 'badge-info';
      default: return 'badge-outline';
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.security?.emailVerified) {
      return <div className="badge badge-success badge-xs">Verified</div>;
    }
    return <div className="badge badge-warning badge-xs">Unverified</div>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-base-content">User Management</h1>
            <p className="text-base-content/70">Manage users and their permissions</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <div className="space-y-2">
              <span>{message.text}</span>
              {message.details && message.details.length > 0 && (
                <ul className="list-disc list-inside text-sm">
                  {message.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Create New User</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="create-user-username">
                      <span className="label-text">Username *</span>
                    </label>
                    <input
                      id="create-user-username"
                      name="username"
                      type="text"
                      className="input input-bordered"
                      value={createForm.username}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                      autoComplete="username"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label" htmlFor="create-user-email">
                      <span className="label-text">Email *</span>
                    </label>
                    <input
                      id="create-user-email"
                      name="email"
                      type="email"
                      className="input input-bordered"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="create-user-password">
                      <span className="label-text">Password *</span>
                    </label>
                    <PasswordInput
                      id="create-user-password"
                      name="new-password"
                      value={createForm.password}
                      onChange={(value) => setCreateForm(prev => ({ ...prev, password: value }))}
                      autoComplete="new-password"
                      required
                    />
                    <div className="mt-2 rounded-lg border border-base-300 bg-base-200/60 p-3 text-sm">
                      <p className="font-medium text-base-content">Password requirements</p>
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((requirement) => (
                          <div
                            key={requirement.id}
                            className={requirement.met ? 'text-success' : 'text-base-content/70'}
                          >
                            {requirement.met ? '✓' : '•'} {requirement.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label" htmlFor="create-user-confirm-password">
                      <span className="label-text">Confirm Password *</span>
                    </label>
                    <PasswordInput
                      id="create-user-confirm-password"
                      name="confirm-password"
                      value={createForm.confirmPassword}
                      onChange={(value) => setCreateForm(prev => ({ ...prev, confirmPassword: value }))}
                      autoComplete="new-password"
                      error={!passwordsMatch ? 'Passwords do not match' : undefined}
                      required
                    />
                    {createForm.confirmPassword && passwordsMatch && (
                      <div className="mt-2 text-sm text-success">Passwords match</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label" htmlFor="create-user-first-name">
                      <span className="label-text">First Name</span>
                    </label>
                    <input
                      id="create-user-first-name"
                      name="given-name"
                      type="text"
                      className="input input-bordered"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                      autoComplete="given-name"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label" htmlFor="create-user-last-name">
                      <span className="label-text">Last Name</span>
                    </label>
                    <input
                      id="create-user-last-name"
                      name="family-name"
                      type="text"
                      className="input input-bordered"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="create-user-display-name">
                    <span className="label-text">Display Name</span>
                  </label>
                  <input
                    id="create-user-display-name"
                    type="text"
                    className="input input-bordered"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Leave empty to use username"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={createForm.role}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                    required
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-action">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`btn btn-primary ${saving ? 'loading' : ''}`}
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Edit User: {editingUser.username}</h3>
              
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">First Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Last Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Display Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-action">
                  <button 
                    type="button" 
                    onClick={() => setEditingUser(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
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
          </div>
        )}

        {/* Users Table */}
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
                            : 'Unknown'
                          }
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {user.metadata?.lastActivity 
                            ? new Date(user.metadata.lastActivity).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => startEditUser(user)}
                            className="btn btn-sm btn-outline"
                          >
                            Edit
                          </button>
                          {user.username !== 'admin' && (
                            <button 
                              onClick={() => handleDeleteUser(user.username)}
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
      </div>
    </div>
  );
};

export default UserManagement; 