import React from 'react';
import { useNativeServerManager } from './useNativeServerManager';
import ServerCard from './ServerCard';
import AddServerModal from './AddServerModal';
import StartBatModal from './StartBatModal';

const NativeServerManager: React.FC = () => {
  const {
    servers, loading, showAddModal, editingServer, showStartBatModal, selectedServer, startBatContent, formData,
    setShowAddModal, setEditingServer, setShowStartBatModal, setSelectedServer, setStartBatContent, setFormData,
    loadServers, handleSubmit, handleStart, handleStop, handleRestart, handleDelete, handleEdit,
    handleViewStartBat, handleUpdateStartBat, handleRegenerateStartBat, getStatusIcon, getStatusColor,
    showToast,
  } = useNativeServerManager();

  const handleFixRcon = async (serverName: string) => {
    try {
      const { api } = await import('../../services/api');
      const response = await api.post(`/api/native-servers/${serverName}/fix-rcon`);
      if (response.data.success) {
        showToast(`✅ ${response.data.message}\n\nPlease restart the server to apply the changes.`, 'success');
      } else {
        showToast(`❌ Failed to fix RCON: ${response.data.message}`, 'error');
      }
    } catch (error) {
      showToast(`❌ Error fixing RCON: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-base-content/70">Loading native servers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Native Servers & Clusters</h1>
              <p className="text-base-content/70">Manage your Windows ASA servers and clusters</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadServers()} className="btn btn-outline btn-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">➕ Add Server</button>
            </div>
          </div>
        </div>

        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">Server Status</h2>
          {servers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-base-content/70 mb-4">No native servers found</p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Add Your First Server</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <ServerCard
                  key={server.name}
                  server={server}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  onStart={handleStart}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewStartBat={handleViewStartBat}
                  onRegenerateStartBat={handleRegenerateStartBat}
                  onFixRcon={handleFixRcon}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddServerModal
          editingServer={editingServer}
          formData={formData}
          setFormData={setFormData}
          setShowAddModal={setShowAddModal}
          setEditingServer={setEditingServer}
          handleSubmit={handleSubmit}
        />
      )}

      {showStartBatModal && (
        <StartBatModal
          selectedServer={selectedServer}
          startBatContent={startBatContent}
          setStartBatContent={setStartBatContent}
          setShowStartBatModal={setShowStartBatModal}
          handleUpdateStartBat={handleUpdateStartBat}
        />
      )}
    </div>
  );
};

export default NativeServerManager;
