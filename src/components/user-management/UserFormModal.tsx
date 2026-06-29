import React from 'react';
import PasswordInput from '../PasswordInput';
import type { User } from './types';

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

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  error: string;
  met: boolean;
}

interface UserFormModalProps {
  mode: 'create';
  show: boolean;
  saving: boolean;
  form: CreateForm;
  passwordRequirements: PasswordRequirement[];
  passwordsMatch: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (form: CreateForm) => void;
}

interface UserFormModalEditProps {
  mode: 'edit';
  show: boolean;
  saving: boolean;
  form: EditForm;
  editingUser: User;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (form: EditForm) => void;
}

type Props = UserFormModalProps | UserFormModalEditProps;

const UserFormModal: React.FC<Props> = (props) => {
  if (props.mode === 'create' && props.show) {
    const { form, saving, passwordRequirements, passwordsMatch, onClose, onSubmit, onChange } = props;

    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Create New User</h3>

          <form onSubmit={onSubmit} className="space-y-4">
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
                  value={form.username}
                  onChange={(e) => onChange({ ...form, username: e.target.value })}
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
                  value={form.email}
                  onChange={(e) => onChange({ ...form, email: e.target.value })}
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
                  value={form.password}
                  onChange={(value) => onChange({ ...form, password: value })}
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
                  value={form.confirmPassword}
                  onChange={(value) => onChange({ ...form, confirmPassword: value })}
                  autoComplete="new-password"
                  error={!passwordsMatch ? 'Passwords do not match' : undefined}
                  required
                />
                {form.confirmPassword && passwordsMatch && (
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
                  value={form.firstName}
                  onChange={(e) => onChange({ ...form, firstName: e.target.value })}
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
                  value={form.lastName}
                  onChange={(e) => onChange({ ...form, lastName: e.target.value })}
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
                value={form.displayName}
                onChange={(e) => onChange({ ...form, displayName: e.target.value })}
                placeholder="Leave empty to use username"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Role *</span>
              </label>
              <select
                className="select select-bordered"
                value={form.role}
                onChange={(e) => onChange({ ...form, role: e.target.value })}
                required
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="modal-action">
              <button type="button" onClick={onClose} className="btn btn-ghost">
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
    );
  }

  if (props.mode === 'edit' && props.show) {
    const { form, saving, editingUser, onClose, onSubmit, onChange } = props;

    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit User: {editingUser.username}</h3>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
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
                  value={form.firstName}
                  onChange={(e) => onChange({ ...form, firstName: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Last Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={form.lastName}
                  onChange={(e) => onChange({ ...form, lastName: e.target.value })}
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
                value={form.displayName}
                onChange={(e) => onChange({ ...form, displayName: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Role</span>
              </label>
              <select
                className="select select-bordered"
                value={form.role}
                onChange={(e) => onChange({ ...form, role: e.target.value })}
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="modal-action">
              <button type="button" onClick={onClose} className="btn btn-ghost">
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
    );
  }

  return null;
};

export default UserFormModal;
