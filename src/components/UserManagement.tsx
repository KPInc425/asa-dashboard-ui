import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import useUserManagement from './user-management/useUserManagement';
import UserTable from './user-management/UserTable';
import UserFormModal from './user-management/UserFormModal';

const UserManagement: React.FC = () => {
  const {
    users,
    loading,
    saving,
    message,
    showCreateForm,
    editingUser,
    createForm,
    editForm,
    passwordRequirements,
    passwordsMatch,
    setMessage,
    setShowCreateForm,
    setEditingUser,
    setCreateForm,
    setEditForm,
    handleCreateUser,
    handleEditUser,
    handleDeleteUser,
    startEditUser,
  } = useUserManagement();

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
        <UserFormModal
          mode="create"
          show={showCreateForm}
          saving={saving}
          form={createForm}
          passwordRequirements={passwordRequirements}
          passwordsMatch={passwordsMatch}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateUser}
          onChange={setCreateForm}
        />

        {/* Edit User Modal */}
        {editingUser && (
          <UserFormModal
            mode="edit"
            show={true}
            saving={saving}
            form={editForm}
            editingUser={editingUser}
            onClose={() => setEditingUser(null)}
            onSubmit={handleEditUser}
            onChange={setEditForm}
          />
        )}

        {/* Users Table */}
        <UserTable
          users={users}
          onEdit={startEditUser}
          onDelete={handleDeleteUser}
        />
      </div>
    </div>
  );
};

export default UserManagement; 