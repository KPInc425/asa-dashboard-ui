import { useNavigate } from "react-router-dom";
import GlobalModManager from "../components/GlobalModManager";
import GlobalConfigManager from "../components/GlobalConfigManager";
import { useClusterDetails } from "./cluster/useClusterDetails";
import LoadingState from "./cluster/LoadingState";
import ErrorState from "./cluster/ErrorState";
import ClusterOverview from "./cluster/ClusterOverview";
import ClusterServers from "./cluster/ClusterServers";
import BackupModal from "./cluster/BackupModal";
import RestoreModal from "./cluster/RestoreModal";
import ServerBackupModal from "./cluster/ServerBackupModal";
import ServerRestoreModal from "./cluster/ServerRestoreModal";
import BackupOptionsModal from "./cluster/BackupOptionsModal";
import RestoreOptionsModal from "./cluster/RestoreOptionsModal";
import AddServerModal from "./cluster/AddServerModal";

const ClusterDetails: React.FC = () => {
  const navigate = useNavigate();
  const {
    cluster,
    loading,
    error,
    activeTab,
    actionLoading,
    downloadLoading,
    downloadError,
    showBackupModal,
    backups,
    backupLoading,
    backupError,
    downloadBackupLoading,
    showRestoreModal,
    restoreFile,
    restoreLoading,
    restoreError,
    restoreSuccess,
    serverBackups,
    serverBackupLoading,
    serverBackupError,
    downloadServerBackupLoading,
    showServerBackupModal,
    showServerRestoreModal,
    serverRestoreFile,
    serverRestoreLoading,
    serverRestoreError,
    serverRestoreSuccess,
    showBackupOptionsModal,
    showRestoreOptionsModal,
    backupOptions,
    restoreOptions,
    downloadNotification,
    showAddServerModal,
    addServerError,
    addServerProgress,
    newServer,
    isCustomMap,
    customMapName,
    availableMaps,
    setShowBackupModal,
    setShowRestoreModal,
    setShowServerBackupModal,
    setShowServerRestoreModal,
    setShowBackupOptionsModal,
    setShowRestoreOptionsModal,
    setBackupOptions,
    setRestoreOptions,
    setDownloadNotification,
    setShowAddServerModal,
    setAddServerError,
    setNewServer,
    setIsCustomMap,
    setCustomMapName,
    handleAddServer,
    openAddServerModal,
    handleTabChange,
    handleClusterAction,
    handleDownloadConfig,
    openBackupModal,
    handleDownloadBackup,
    openRestoreModal,
    handleRestoreFileChange,
    handleRestoreSubmit,
    openServerBackupModal,
    handleDownloadServerBackup,
    openServerRestoreModal,
    handleServerRestoreFileChange,
    handleServerRestoreSubmit,
    handleBackupOptionsStart,
    handleRestoreOptionsStart,
  } = useClusterDetails();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !cluster) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏗️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">
                  {cluster.name}
                </h1>
                <p className="text-base-content/70">
                  Cluster Management - {cluster.config?.servers?.length || 0}{" "}
                  servers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/")}
                className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Add Server Progress Banner */}
        {addServerProgress && addServerProgress.status === "running" && (
          <div className="alert alert-info shadow-lg">
            <div className="flex items-center gap-3 w-full">
              <span className="loading loading-spinner loading-sm"></span>
              <div className="flex-1">
                <p className="font-medium">
                  Adding server "{newServer.name || "..."}"...
                </p>
                <p className="text-sm text-base-content/70">
                  {addServerProgress.message || "Working..."}
                </p>
              </div>
              {typeof addServerProgress.progress === "number" && (
                <div className="w-24">
                  <progress
                    className="progress progress-primary w-full"
                    value={addServerProgress.progress}
                    max="100"
                  ></progress>
                  <span className="text-xs text-base-content/60">
                    {addServerProgress.progress}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {addServerError && (
          <div className="alert alert-error">
            <span>{addServerError}</span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setAddServerError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${activeTab === "mods" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("mods")}
          >
            🧩 Mods
          </button>
          <button
            className={`tab ${activeTab === "configs" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("configs")}
          >
            ⚙️ Configs
          </button>
          <button
            className={`tab ${activeTab === "servers" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("servers")}
          >
            🖥️ Servers
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-sm flex-1">
          <div className="card-body">
            {activeTab === "overview" && (
              <ClusterOverview
                cluster={cluster}
                actionLoading={actionLoading}
                downloadLoading={downloadLoading}
                downloadError={downloadError}
                onClusterAction={handleClusterAction}
                onDownloadConfig={handleDownloadConfig}
                onOpenBackupModal={openBackupModal}
                onOpenRestoreModal={openRestoreModal}
                onShowBackupOptions={() => setShowBackupOptionsModal(true)}
                onShowRestoreOptions={() => setShowRestoreOptionsModal(true)}
              />
            )}

            {activeTab === "mods" && (
              <GlobalModManager
                clusterName={cluster.name}
                onClose={() => handleTabChange("overview")}
              />
            )}

            {activeTab === "configs" && (
              <GlobalConfigManager clusterName={cluster.name} />
            )}

            {activeTab === "servers" && (
              <ClusterServers
                cluster={cluster}
                onAddServer={openAddServerModal}
                onServerBackup={openServerBackupModal}
                onServerRestore={openServerRestoreModal}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBackupModal && (
        <BackupModal
          backups={backups}
          backupLoading={backupLoading}
          backupError={backupError}
          downloadBackupLoading={downloadBackupLoading}
          onDownloadBackup={handleDownloadBackup}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {showRestoreModal && (
        <RestoreModal
          cluster={cluster}
          restoreFile={restoreFile}
          restoreLoading={restoreLoading}
          restoreError={restoreError}
          restoreSuccess={restoreSuccess}
          onFileChange={handleRestoreFileChange}
          onSubmit={handleRestoreSubmit}
          onClose={() => setShowRestoreModal(false)}
        />
      )}

      {showServerBackupModal && (
        <ServerBackupModal
          serverName={showServerBackupModal}
          backups={serverBackups[showServerBackupModal] || []}
          loading={serverBackupLoading[showServerBackupModal] || false}
          error={serverBackupError[showServerBackupModal] || ""}
          downloadLoading={downloadServerBackupLoading}
          onDownloadBackup={handleDownloadServerBackup}
          onClose={() => setShowServerBackupModal(null)}
        />
      )}

      {showServerRestoreModal && (
        <ServerRestoreModal
          serverName={showServerRestoreModal}
          restoreFile={serverRestoreFile[showServerRestoreModal] || null}
          restoreLoading={serverRestoreLoading[showServerRestoreModal] || false}
          restoreError={serverRestoreError[showServerRestoreModal] || ""}
          restoreSuccess={serverRestoreSuccess[showServerRestoreModal] || ""}
          onFileChange={handleServerRestoreFileChange}
          onSubmit={handleServerRestoreSubmit}
          onClose={() => setShowServerRestoreModal(null)}
        />
      )}

      {showBackupOptionsModal && (
        <BackupOptionsModal
          cluster={cluster}
          backupOptions={backupOptions}
          downloadLoading={downloadLoading}
          downloadError={downloadError}
          onOptionChange={setBackupOptions}
          onStartBackup={handleBackupOptionsStart}
          onClose={() => setShowBackupOptionsModal(false)}
        />
      )}

      {showRestoreOptionsModal && (
        <RestoreOptionsModal
          restoreOptions={restoreOptions}
          restoreLoading={restoreLoading}
          onOptionChange={setRestoreOptions}
          onStartRestore={handleRestoreOptionsStart}
          onClose={() => setShowRestoreOptionsModal(false)}
        />
      )}

      {downloadNotification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 alert alert-info shadow-lg z-50 max-w-md">
          <span>{downloadNotification}</span>
        </div>
      )}

      {showAddServerModal && (
        <AddServerModal
          cluster={cluster}
          newServer={newServer}
          isCustomMap={isCustomMap}
          customMapName={customMapName}
          availableMaps={availableMaps}
          onServerChange={setNewServer}
          onCustomMapChange={setIsCustomMap}
          onCustomMapNameChange={setCustomMapName}
          onSubmit={handleAddServer}
          onClose={() => setShowAddServerModal(false)}
        />
      )}
    </div>
  );
};

export default ClusterDetails;
