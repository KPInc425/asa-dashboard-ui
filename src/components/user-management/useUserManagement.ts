import { useState, useEffect, useCallback } from 'react';
import { api as apiClient } from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmContext2';
import { getPasswordValidationErrors, extractApiMessage } from './utils';
import { PASSWORD_REQUIREMENTS } from './constants';
import type { User, Message } from './types';

interface CreateForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface EditForm {
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

const INITIAL_CREATE_FORM: CreateForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'viewer',
  firstName: '',
  lastName: '',
  displayName: '',
};

const INITIAL_EDIT_FORM: EditForm = {
  email: '',
  role: '',
  firstName: '',
  lastName: '',
  displayName: '',
};

export default function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(INITIAL_CREATE_FORM);
  const [editForm, setEditForm] = useState<EditForm>(INITIAL_EDIT_FORM);

  const { showConfirm } = useConfirm();

  const passwordValidationErrors = getPasswordValidationErrors(createForm.password);
  const passwordRequirements = PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(createForm.password),
  }));
  const passwordsMatch =
    createForm.confirmPassword.length === 0 ||
    createForm.password === createForm.confirmPassword;

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
          displayName: createForm.displayName || createForm.username,
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'User created successfully' });
        setShowCreateForm(false);
        setCreateForm(INITIAL_CREATE_FORM);
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
          displayName: editForm.displayName,
        },
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
      displayName: user.profile?.displayName || user.username,
    });
  };

  return {
    // State
    users,
    loading,
    saving,
    message,
    showCreateForm,
    editingUser,
    createForm,
    editForm,
    // Derived
    passwordValidationErrors,
    passwordRequirements,
    passwordsMatch,
    // Actions
    setMessage,
    setShowCreateForm,
    setEditingUser,
    setCreateForm,
    setEditForm,
    loadUsers,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    startEditUser,
  };
}
