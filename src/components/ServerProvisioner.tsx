import React from "react";
import GlobalConfigManager from "./GlobalConfigManager";
import GlobalModManager from "./GlobalModManager";
import ServerBackupManager from "./ServerBackupManager";
import {
  WelcomeStep,
  ClusterBasicStep,
  MapSelectionStep,
  GameSettingsStep,
  CreatingStep,
  ReviewStep,
  ServerConfigStep,
} from "./provisioning";
import IndividualServersStep from "./provisioning/IndividualServersStep";
import ModsStep from "./provisioning/ModsStep";
import { Link } from "react-router-dom";
import MapManager from "./MapManager";
import useProvisioner from "./provisioning/useProvisioner";

const ServerProvisioner: React.FC = () => {
  const {
    systemInfo,
    clusters,
    showWizard,
    currentStep,
    installing,
    statusMessage,
    statusType,
    loading,
    currentJobId,
    jobProgress,
    showGlobalConfigManager,
    showGlobalModManager,
    showServerBackupManager,
    showMapManager,
    selectedServerForBackup,
    showStandaloneModal,
    standaloneLoading,
    standaloneError,
    standaloneSuccess,
    standaloneForm,
    standaloneCustomMap,
    standaloneCustomMapName,
    wizardData,
    availableMaps,
    restoreModal,
    selectedBackup,
    isCreating,
    wizardSteps,
    setShowWizard,
    setShowGlobalConfigManager,
    setShowGlobalModManager,
    setShowServerBackupManager,
    setShowMapManager,
    setSelectedServerForBackup,
    setShowStandaloneModal,
    setStandaloneForm,
    setStandaloneCustomMap,
    setStandaloneCustomMapName,
    setStandaloneError,
    setStandaloneSuccess,
    setWizardData,
    setCurrentStep,
    setRestoreModal,
    setSelectedBackup,
    initializeSystem,
    installSteamCmd,
    deleteCluster,
    backupCluster,
    restoreCluster,
    handleRestoreConfirm,
    handleCreateStandaloneServer,
    formatGB,
    toggleMap,
    updateMapCount,
    generateServers,
    getClusterStatus,
    getStatusBadge,
    nextStep,
    prevStep,
  } = useProvisioner();

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🦖</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">
                  ASA Server Provisioner
                </h1>
                <p className="text-base-content/70">
                  Create and manage ARK: Survival Ascended server clusters with
                  ease
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGlobalConfigManager(true)}
                className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
              >
                ⚙️ Global Config
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-base-content/70">
                Loading system information and cluster data...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* System Status Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-info to-primary rounded-lg flex items-center justify-center">
                      <span className="text-xl">💻</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">System Status</h3>
                      <p className="text-sm text-base-content/70">
                        System requirements & setup
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">SteamCMD:</span>
                      <span
                        className={`badge badge-sm ${systemInfo?.steamCmdInstalled ? "badge-success" : "badge-error"}`}
                      >
                        {systemInfo?.steamCmdInstalled
                          ? "Installed"
                          : "Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Disk Space:</span>
                      <span className="font-mono text-xs">
                        {formatGB(systemInfo?.diskSpace?.free || 0)} GB free
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Memory:</span>
                      <span className="font-mono text-xs">
                        {formatGB(systemInfo?.memory?.free || 0)} GB available
                      </span>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={initializeSystem}
                      disabled={installing}
                    >
                      {installing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Initialize"
                      )}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={installSteamCmd}
                      disabled={installing}
                    >
                      {installing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Install SteamCMD"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cluster Management Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-success to-accent rounded-lg flex items-center justify-center">
                      <span className="text-xl">🏗️</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Cluster Management</h3>
                      <p className="text-sm text-base-content/70">
                        Create and manage clusters
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">
                        Total Clusters:
                      </span>
                      <span className="badge badge-neutral badge-sm">
                        {clusters.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Running:</span>
                      <span className="badge badge-success badge-sm">
                        {
                          clusters.filter(
                            (c) => getClusterStatus(c).status === "running",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">Stopped:</span>
                      <span className="badge badge-error badge-sm">
                        {
                          clusters.filter(
                            (c) => getClusterStatus(c).status === "stopped",
                          ).length
                        }
                      </span>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowWizard(true)}
                    >
                      ➕ Create Cluster
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-warning to-error rounded-lg flex items-center justify-center">
                      <span className="text-xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Quick Actions</h3>
                      <p className="text-sm text-base-content/70">
                        Common management tasks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      className="btn btn-outline btn-sm w-full justify-start"
                      onClick={() => setShowGlobalConfigManager(true)}
                    >
                      ⚙️ Global Configuration
                    </button>
                    <button
                      className="btn btn-outline btn-sm w-full justify-start"
                      onClick={() => setShowGlobalModManager(true)}
                    >
                      🎮 Global Mod Management
                    </button>
                    <button
                      className="btn btn-outline btn-sm w-full justify-start"
                      onClick={() => {
                        setSelectedServerForBackup(null);
                        setShowServerBackupManager(true);
                      }}
                    >
                      💾 Server Backup Manager
                    </button>
                    <button
                      className="btn btn-outline btn-sm w-full justify-start"
                      onClick={() => setShowMapManager(true)}
                    >
                      🗺️ Map Manager
                    </button>
                    <button
                      className="btn btn-primary btn-sm w-full justify-start"
                      onClick={() => {
                        setStandaloneForm({
                          name: "",
                          map: "TheIsland",
                          gamePort: 7777,
                          queryPort: 27015,
                          rconPort: 32330,
                          maxPlayers: 70,
                          adminPassword: "admin123",
                          serverPassword: "",
                          disableBattleEye: false,
                        });
                        setStandaloneCustomMap(false);
                        setStandaloneCustomMapName("");
                        setStandaloneError(null);
                        setStandaloneSuccess(null);
                        setShowStandaloneModal(true);
                      }}
                    >
                      ➕ Quick Add Standalone Server
                    </button>
                  </div>
                </div>
              </div>

              {/* System Info Card */}
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
                      <span className="text-xl">ℹ️</span>
                    </div>
                    <div>
                      <h3 className="card-title text-lg">System Info</h3>
                      <p className="text-sm text-base-content/70">
                        Technical details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Node:</span>
                      <span className="font-mono">
                        {systemInfo?.nodeVersion}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">CPU Cores:</span>
                      <span className="font-mono">{systemInfo?.cpuCores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Platform:</span>
                      <span className="font-mono">{systemInfo?.platform}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clusters List */}
            {clusters.length > 0 && (
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4">
                    <span className="text-2xl">🏗️</span>
                    Existing Clusters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clusters.map((cluster) => {
                      const status = getClusterStatus(cluster);
                      return (
                        <div
                          key={cluster.name}
                          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                        >
                          <div className="card-body p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Link
                                to={`/clusters/${encodeURIComponent(cluster.name)}`}
                                className="font-semibold text-primary hover:underline"
                              >
                                {cluster.name}
                              </Link>
                              {getStatusBadge(status.status)}
                            </div>

                            <div className="space-y-1 text-sm text-base-content/70">
                              <div className="flex justify-between">
                                <span>Servers:</span>
                                <span>
                                  {status.runningServers}/{status.totalServers}{" "}
                                  running
                                </span>
                              </div>
                              {cluster.config?.description && (
                                <div className="text-xs italic">
                                  {cluster.config.description}
                                </div>
                              )}
                            </div>

                            <div className="card-actions justify-end mt-3 space-x-1">
                              <button
                                className="btn btn-xs btn-outline btn-info"
                                onClick={() => backupCluster(cluster.name)}
                                title="Backup cluster data"
                              >
                                💾
                              </button>
                              <button
                                className="btn btn-xs btn-outline btn-warning"
                                onClick={() => restoreCluster(cluster.name)}
                                title="Restore cluster data"
                              >
                                🔄
                              </button>
                              <button
                                className="btn btn-xs btn-outline btn-error"
                                onClick={() => deleteCluster(cluster.name)}
                                title="Delete cluster"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-primary">
                  Cluster Creation Wizard
                </h2>
                {/* Only show step count if not creating */}
                {!isCreating && (
                  <p className="text-base-content/70 mt-2">
                    Step {wizardSteps.indexOf(currentStep as WizardStep) + 1} of{" "}
                    {wizardSteps.length}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar: Only show if not creating */}
            {!isCreating && (
              <div className="mb-6">
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((wizardSteps.indexOf(currentStep as WizardStep) + 1) / wizardSteps.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="min-h-[400px]">
              {currentStep === "welcome" && <WelcomeStep />}
              {currentStep === "cluster-basic" && (
                <ClusterBasicStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "map-selection" && (
                <MapSelectionStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  toggleMap={toggleMap}
                  updateMapCount={updateMapCount}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "server-config" && (
                <ServerConfigStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "individual-servers" && (
                <IndividualServersStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "game-settings" && (
                <GameSettingsStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "mods" && (
                <ModsStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "review" && (
                <ReviewStep
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  availableMaps={availableMaps}
                  generateServers={generateServers}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === "creating" && (
                <CreatingStep jobId={currentJobId} jobProgress={jobProgress} />
              )}
            </div>

            {/* Navigation Buttons: Hide when creating */}
            {!isCreating && (
              <div className="flex justify-between mt-6 pt-6 border-t border-base-300">
                <button
                  className="btn btn-outline"
                  onClick={prevStep}
                  disabled={currentStep === "welcome"}
                >
                  ← Previous
                </button>
                <button className="btn btn-primary" onClick={nextStep}>
                  {currentStep === "review" ? "🚀 Create Cluster" : "Next →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Config Manager Modal */}
      {showGlobalConfigManager && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">
                Global Configuration
              </h2>
              <button
                onClick={() => setShowGlobalConfigManager(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
            <GlobalConfigManager clusterName="global" />
          </div>
        </div>
      )}

      {/* Global Mod Manager Modal */}
      {showGlobalModManager && (
        <GlobalModManager onClose={() => setShowGlobalModManager(false)} />
      )}

      {/* Map Manager Modal */}
      {showMapManager && (
        <MapManager onClose={() => setShowMapManager(false)} />
      )}

      {/* Server Backup Manager Modal */}
      {showServerBackupManager && (
        <ServerBackupManager
          onClose={() => setShowServerBackupManager(false)}
          selectedServer={selectedServerForBackup || undefined}
        />
      )}

      {/* Restore Cluster Modal */}
      {restoreModal && restoreModal.open && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              Restore Cluster: {restoreModal.clusterName}
            </h3>
            <div className="mb-4">
              <label className="label">
                <span className="label-text font-semibold">Select Backup</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedBackup || ""}
                onChange={(e) => setSelectedBackup(e.target.value)}
              >
                <option value="" disabled>
                  Select a backup...
                </option>
                {restoreModal.backups.map((backup) => (
                  <option key={backup.path} value={backup.path}>
                    {backup.name} (
                    {backup.backupDate?.slice(0, 19).replace("T", " ") ||
                      "Unknown date"}
                    , {backup.sizeFormatted || "Unknown size"})
                  </option>
                ))}
              </select>
              {selectedBackup && (
                <div className="mt-2 text-xs text-base-content/70">
                  Path: {selectedBackup}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setRestoreModal(null);
                  setSelectedBackup(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRestoreConfirm}
                disabled={!selectedBackup}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Server Creation Modal */}
      {showStandaloneModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">➕ Create Standalone Server</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowStandaloneModal(false)}
                disabled={standaloneLoading}
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-base-content/60 mb-4">
              Create a single server not attached to any cluster.
            </p>
            <form onSubmit={handleCreateStandaloneServer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Server Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="MyServer"
                    value={standaloneForm.name}
                    onChange={(e) =>
                      setStandaloneForm({ ...standaloneForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Map</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={standaloneCustomMap ? "__custom__" : standaloneForm.map}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setStandaloneCustomMap(true);
                        setStandaloneForm({
                          ...standaloneForm,
                          map: standaloneCustomMapName || "CustomMap",
                        });
                      } else {
                        setStandaloneCustomMap(false);
                        setStandaloneForm({ ...standaloneForm, map: e.target.value });
                      }
                    }}
                  >
                    {availableMaps.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.displayName}
                      </option>
                    ))}
                    <option value="__custom__">Custom Map...</option>
                  </select>
                  {standaloneCustomMap && (
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full mt-2"
                      placeholder="Enter exact map name (e.g., MyCustomMap)"
                      value={standaloneCustomMapName}
                      onChange={(e) => {
                        setStandaloneCustomMapName(e.target.value);
                        setStandaloneForm({
                          ...standaloneForm,
                          map: e.target.value || "CustomMap",
                        });
                      }}
                    />
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Game Port</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={standaloneForm.gamePort}
                    onChange={(e) =>
                      setStandaloneForm({
                        ...standaloneForm,
                        gamePort: parseInt(e.target.value) || 7777,
                      })
                    }
                    min={1024}
                    max={65535}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Query Port</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={standaloneForm.queryPort}
                    onChange={(e) =>
                      setStandaloneForm({
                        ...standaloneForm,
                        queryPort: parseInt(e.target.value) || 27015,
                      })
                    }
                    min={1024}
                    max={65535}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">RCON Port</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={standaloneForm.rconPort}
                    onChange={(e) =>
                      setStandaloneForm({
                        ...standaloneForm,
                        rconPort: parseInt(e.target.value) || 32330,
                      })
                    }
                    min={1024}
                    max={65535}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Players</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={standaloneForm.maxPlayers}
                    onChange={(e) =>
                      setStandaloneForm({
                        ...standaloneForm,
                        maxPlayers: parseInt(e.target.value) || 70,
                      })
                    }
                    min={1}
                    max={255}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Admin Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered input-sm w-full"
                    placeholder="admin123"
                    value={standaloneForm.adminPassword}
                    onChange={(e) =>
                      setStandaloneForm({
                        ...standaloneForm,
                        adminPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Server Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered input-sm w-full"
                    placeholder="(optional)"
                    value={standaloneForm.serverPassword}
                    onChange={(e) =>
                      setStandaloneForm({
                        ...standaloneForm,
                        serverPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="standalone-disable-battleeye"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={standaloneForm.disableBattleEye}
                  onChange={(e) =>
                    setStandaloneForm({
                      ...standaloneForm,
                      disableBattleEye: e.target.checked,
                    })
                  }
                />
                <label htmlFor="standalone-disable-battleeye" className="label-text text-sm">
                  Disable BattleEye
                </label>
              </div>

              {standaloneError && (
                <div className="alert alert-error">{standaloneError}</div>
              )}
              {standaloneSuccess && (
                <div className="alert alert-success">{standaloneSuccess}</div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowStandaloneModal(false)}
                  disabled={standaloneLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={standaloneLoading || !standaloneForm.name.trim()}
                >
                  {standaloneLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "➕ Create Server"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 alert alert-${statusType} shadow-lg z-50 max-w-md`}
        >
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ServerProvisioner;
