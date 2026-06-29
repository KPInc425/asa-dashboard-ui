import { useState, useEffect } from "react";
import { provisioningApi, createServer } from "../../services/api-provisioning";
import { socketService, type JobProgress } from "../../services/socket";
import { useConfirm } from "../../contexts/ConfirmContext2";
import { useToast } from "../../contexts/ToastContext";
import type {
  SystemInfo,
  Cluster,
  WizardData,
  WizardStep,
  ServerConfig,
} from "../../types/provisioning";
import { getAvailableMaps } from "../../config/maps";

type Backup = {
  path: string;
  name: string;
  backupDate?: string;
  sizeFormatted?: string;
};

export default function useProvisioner() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");
  const [loading, setLoading] = useState(true);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [showGlobalConfigManager, setShowGlobalConfigManager] = useState(false);
  const [showGlobalModManager, setShowGlobalModManager] = useState(false);
  const [showServerBackupManager, setShowServerBackupManager] = useState(false);
  const [showMapManager, setShowMapManager] = useState(false);
  const [selectedServerForBackup, setSelectedServerForBackup] = useState<
    string | null
  >(null);

  // Standalone server creation state
  const [showStandaloneModal, setShowStandaloneModal] = useState(false);
  const [standaloneLoading, setStandaloneLoading] = useState(false);
  const [standaloneError, setStandaloneError] = useState<string | null>(null);
  const [standaloneSuccess, setStandaloneSuccess] = useState<string | null>(null);
  const [standaloneForm, setStandaloneForm] = useState({
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
  const [standaloneCustomMap, setStandaloneCustomMap] = useState(false);
  const [standaloneCustomMapName, setStandaloneCustomMapName] = useState("");
  const [wizardData, setWizardData] = useState<WizardData>({
    clusterName: "",
    description: "",
    serverCount: 1,
    basePort: 7777,
    portAllocationMode: "sequential",
    selectedMaps: [],
    customMapName: "",
    customMapDisplayName: "",
    customMapCount: 1,
    globalSessionName: "",
    maxPlayers: 70,
    adminPassword: "admin123",
    serverPassword: "",
    clusterPassword: "",
    harvestMultiplier: 2.0,
    xpMultiplier: 2.0,
    tamingMultiplier: 3.0,
    servers: [],
    foreground: false,
    sessionNameMode: "auto",
    customDynamicConfigUrl: "",
    disableBattleEye: false,

    // Enhanced configuration options
    individualServerSettings: false,
    serverConfigs: [],

    // Detailed game settings
    gameSettings: {
      harvestMultiplier: 2.0,
      xpMultiplier: 2.0,
      tamingMultiplier: 3.0,
      matingIntervalMultiplier: 0.5,
      eggHatchSpeedMultiplier: 10.0,
      babyMatureSpeedMultiplier: 20.0,
      dayCycleSpeedScale: 1.0,
      dayTimeSpeedScale: 1.0,
      nightTimeSpeedScale: 1.0,
      dinoDamageMultiplier: 1.0,
      playerDamageMultiplier: 1.0,
      structureDamageMultiplier: 1.0,
      playerResistanceMultiplier: 1.0,
      dinoResistanceMultiplier: 1.0,
      structureResistanceMultiplier: 1.0,
      difficultyOffset: 1.0,
      allowThirdPersonPlayer: true,
      alwaysNotifyPlayerLeft: true,
      alwaysNotifyPlayerJoined: true,
      serverCrosshair: true,
      serverForceNoHUD: false,
      serverThirdPersonPlayer: false,
      serverHardcore: false,
      serverShowMapPlayerLocation: true,
      serverEnablePvPGamma: true,
      serverAllowFlyerCarryPvE: true,
      serverDisableStructurePlacementCollision: true,
      serverAllowCaveBuildingPvE: true,
      serverAllowFlyingStaminaRecovery: true,
      serverAllowUnlimitedRespecs: true,
      serverPreventSpawnFlier: true,
      serverPreventOfflinePvP: true,
      serverPreventOfflinePvPInterval: 300,
      serverPreventOfflinePvPUseStructurePrevention: true,
      serverPreventOfflinePvPUseStructurePreventionRadius: 1000,
      maxPlatformSaddleStructureLimit: 130,
    },

    // Mod management
    globalMods: [],
    serverMods: {},

    // Port configuration
    portConfiguration: {
      basePort: 7777,
      portIncrement: 1,
      queryPortBase: 27015,
      queryPortIncrement: 1,
      rconPortBase: 32330,
      rconPortIncrement: 1,
    },

    // Cluster settings
    clusterSettings: {
      clusterId: "",
      clusterName: "",
      clusterDescription: "",
      clusterPassword: "",
      clusterOwner: "Admin",
    },

    autoStart: false,
  });
  const [availableMaps] = useState<
    { name: string; displayName: string; available: boolean }[]
  >(() =>
    getAvailableMaps().map((m) => ({
      name: m.name,
      displayName: m.displayName,
      available: m.available,
    })),
  );

  // Add state for restore modal
  const [restoreModal, setRestoreModal] = useState<{
    clusterName: string;
    backups: Backup[];
    open: boolean;
  } | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    loadSystemInfo();
    loadClusters();

    // Set up Socket.IO job progress listener - wrapped in try/catch for demo mode
    try {
      socketService.onJobProgress((progress) => {
        setJobProgress(progress);

        // If job is completed or failed, update status
        if (progress.status === "completed") {
          setStatusMessage("✅ Cluster created successfully!");
          setStatusType("success");
          setTimeout(() => {
            setStatusMessage(null);
            setShowWizard(false);
            setCurrentStep("welcome");
            setCurrentJobId(null);
            setJobProgress(null);
            loadClusters();
          }, 3000);
        } else if (progress.status === "failed") {
          setStatusMessage(
            `❌ Cluster creation failed: ${progress.error || "Unknown error"}`,
          );
          setStatusType("error");
          setTimeout(() => {
            setStatusMessage(null);
            setCurrentStep("review");
            setCurrentJobId(null);
            setJobProgress(null);
          }, 10000);
        }
      });

      socketService.onConnect(() => {});
      socketService.onDisconnect(() => {});
      socketService.onError(() => {});
    } catch (e) {
      // Socket.IO may not be available in demo mode - that's fine
      console.log("Socket.IO unavailable (expected in demo mode)");
    }

    // Cleanup Socket.IO listeners on unmount
    return () => {
      try {
        socketService.offJobProgress();
      } catch {}
    };
  }, []);

  // Poll for job status as fallback for Socket.IO
  useEffect(() => {
    if (currentJobId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await provisioningApi.getJobStatus(currentJobId);
          if (response.success && response.job) {
            const job = response.job;

            // Update job progress with the latest information
            if (
              job.progress &&
              Array.isArray(job.progress) &&
              job.progress.length > 0
            ) {
              const latestProgress = job.progress[job.progress.length - 1];

              // Calculate progress based on the number of progress entries and job status
              let progressPercent = 0;
              if (job.status === "completed") {
                progressPercent = 100;
              } else if (job.status === "failed") {
                progressPercent = 0;
              } else {
                // Estimate progress based on typical cluster creation steps
                const totalSteps = 5; // validation, directory creation, server installation, config creation, finalization
                const currentStep = Math.min(job.progress.length, totalSteps);
                progressPercent = Math.round((currentStep / totalSteps) * 100);
              }

              const progressData: JobProgress = {
                jobId: job.id as string,
                status: job.status as JobProgress["status"],
                progress: progressPercent,
                message: latestProgress.message || "",
                error: job.error as string | undefined,
              };
              setJobProgress(progressData);
            }

            if (job.status === "completed") {
              setStatusMessage("✅ Cluster created successfully!");
              setStatusType("success");
              setCurrentJobId(null);
              setJobProgress(null);
              loadClusters();
              setTimeout(() => {
                setStatusMessage(null);
                setShowWizard(false);
                setCurrentStep("welcome");
              }, 3000);
            } else if (job.status === "failed") {
              setStatusMessage(
                `❌ Cluster creation failed: ${job.error || "Unknown error"}`,
              );
              setStatusType("error");
              setCurrentJobId(null);
              setJobProgress(null);
              setTimeout(() => {
                setStatusMessage(null);
                setCurrentStep("review");
              }, 10000);
            }
          }
        } catch (error: unknown) {
          console.error("Failed to poll job status:", error);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [currentJobId]);

  const loadSystemInfo = async () => {
    try {
      const response = await provisioningApi.getSystemInfo();
      if (response.success) {
        setSystemInfo(response.status as SystemInfo);
        setStatusMessage("✅ System status refreshed");
        setStatusType("success");

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("Failed to load system info:", error);
      setStatusMessage(
        `❌ Failed to refresh system status: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadClusters = async () => {
    try {
      const response = await provisioningApi.listClusters();
      if (response.success) {
        setClusters((response.clusters || []) as unknown as Cluster[]);
      } else {
        setClusters([]);
      }
    } catch (error: unknown) {
      console.error("Failed to load clusters:", error);
      setClusters([]);
    }
  };

  const initializeSystem = async () => {
    try {
      setInstalling(true);
      setStatusMessage("Initializing system...");
      setStatusType("info");
      const response = await provisioningApi.initialize();
      if (response.success) {
        // After initialization, refresh system info
        await loadSystemInfo();
        setStatusMessage("System initialized successfully!");
        setStatusType("success");
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (error: unknown) {
      console.error("Failed to initialize system:", error);
      setStatusMessage(
        `Failed to initialize system: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");
      setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
    } finally {
      setInstalling(false);
    }
  };

  const installSteamCmd = async () => {
    try {
      setInstalling(true);
      setStatusMessage("Installing SteamCMD...");
      setStatusType("info");

      const response = await provisioningApi.installSteamCmd();
      if (response.success) {
        setStatusMessage(
          "✅ SteamCMD installed successfully! You can now create clusters.",
        );
        setStatusType("success");

        // Refresh system info to update SteamCMD status
        await loadSystemInfo();

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      }
    } catch (error: unknown) {
      console.error("Failed to install SteamCMD:", error);
      setStatusMessage(
        `❌ Failed to install SteamCMD: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");

      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 8000);
    } finally {
      setInstalling(false);
    }
  };

  const deleteCluster = async (clusterName: string, force: boolean = false) => {
    const message = force
      ? `Are you sure you want to FORCE DELETE cluster "${clusterName}"? This will remove the cluster directory completely, even if it's corrupted or incomplete.`
      : `Are you sure you want to delete cluster "${clusterName}"? This will remove all server data.`;

    const proceed = await showConfirm(message);
    if (!proceed) return;

    try {
      setLoading(true);
      setStatusMessage(`Deleting cluster "${clusterName}"...`);
      setStatusType("info");
      const response = await provisioningApi.deleteCluster(clusterName, {
        backupSaved: true,
        deleteFiles: true,
      });
      if (response.success) {
        setStatusMessage(
          `✅ Cluster "${clusterName}" ${force ? "force " : ""}deleted successfully!${response.data?.backupPath ? ` Backup saved to: ${response.data.backupPath}` : ""}`,
        );
        setStatusType("success");
        setTimeout(() => setStatusMessage(null), 5000);
        loadClusters();
      }
    } catch (error: unknown) {
      console.error("Failed to delete cluster:", error);
      setStatusMessage(
        `❌ Failed to delete cluster "${clusterName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");
      setTimeout(() => setStatusMessage(null), 10000);
      // If normal delete fails, offer force delete
      if (!force) {
        const shouldForceDelete = await showConfirm(
          `Failed to delete cluster "${clusterName}" normally. This might be due to a corrupted or incomplete cluster.\n\n` +
            `Would you like to try force deleting it? This will remove the cluster directory completely.`,
        );
        if (shouldForceDelete) {
          await deleteCluster(clusterName, true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const backupCluster = async (clusterName: string) => {
    try {
      setStatusMessage(`Backing up cluster "${clusterName}"...`);
      setStatusType("info");

      const response = await provisioningApi.backupCluster(clusterName);
      if (response.success) {
        setStatusMessage(
          `✅ Cluster "${clusterName}" backed up successfully! Backup location: ${response.data?.backupPath || "Unknown"}`,
        );
        setStatusType("success");
        setTimeout(() => setStatusMessage(null), 8000);
      }
    } catch (error: unknown) {
      console.error("Failed to backup cluster:", error);
      setStatusMessage(
        `❌ Failed to backup cluster "${clusterName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");
      setTimeout(() => setStatusMessage(null), 10000);
    }
  };

  const restoreCluster = async (clusterName: string) => {
    setStatusMessage("Loading available backups...");
    setStatusType("info");
    try {
      const response = await provisioningApi.getClusterBackups(clusterName);
      if (response.success && response.backups.length > 0) {
        setRestoreModal({
          clusterName,
          backups: response.backups.map(
            (b: {
              backupPath: string;
              backupName: string;
              created: string;
              size?: number;
            }) => ({
              path: b.backupPath,
              name: b.backupName,
              backupDate: b.created,
              sizeFormatted: b.size
                ? `${(b.size / 1024 / 1024).toFixed(2)} MB`
                : undefined,
            }),
          ),
          open: true,
        });
        setStatusMessage(null);
      } else {
        setStatusMessage(`No backups found for cluster "${clusterName}".`);
        setStatusType("warning");
        setTimeout(() => setStatusMessage(null), 6000);
      }
    } catch (error: unknown) {
      setStatusMessage(
        `❌ Failed to load backups: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");
      setTimeout(() => setStatusMessage(null), 10000);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreModal || !selectedBackup) return;
    try {
      setStatusMessage(
        `Restoring cluster "${restoreModal.clusterName}" from backup...`,
      );
      setStatusType("info");
      const response = await provisioningApi.restoreCluster(
        restoreModal.clusterName,
        { source: selectedBackup },
      );
      if (response.success) {
        setStatusMessage(
          `✅ Cluster "${restoreModal.clusterName}" restored successfully!`,
        );
        setStatusType("success");
        setTimeout(() => setStatusMessage(null), 5000);
        setRestoreModal(null);
        setSelectedBackup(null);
        loadClusters();
      }
    } catch (error: unknown) {
      setStatusMessage(
        `❌ Failed to restore cluster "${restoreModal?.clusterName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");
      setTimeout(() => setStatusMessage(null), 10000);
    }
  };

  const handleCreateStandaloneServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setStandaloneLoading(true);
    setStandaloneError(null);
    setStandaloneSuccess(null);

    try {
      const response = await createServer(standaloneForm);
      if (response.success) {
        setStandaloneSuccess(`Server "${standaloneForm.name}" created successfully!`);
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
        setTimeout(() => {
          setShowStandaloneModal(false);
          setStandaloneSuccess(null);
        }, 2000);
      } else {
        setStandaloneError(response.message || "Failed to create server");
      }
    } catch (err: unknown) {
      setStandaloneError(
        err instanceof Error ? err.message : "Failed to create server",
      );
    } finally {
      setStandaloneLoading(false);
    }
  };

  const formatGB = (bytes: number) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(1);
  };

  const toggleMap = (mapName: string) => {
    setWizardData((prev) => {
      const existingMap = prev.selectedMaps.find((map) => map.map === mapName);
      const mapInfo = availableMaps.find((map) => map.name === mapName);

      if (existingMap) {
        // Map exists, toggle its enabled state
        return {
          ...prev,
          selectedMaps: prev.selectedMaps.map((map) =>
            map.map === mapName ? { ...map, enabled: !map.enabled } : map,
          ),
        };
      } else if (mapInfo) {
        // Map doesn't exist, add it
        const newMap = {
          map: mapName,
          count: 1,
          enabled: true,
          displayName: mapInfo.displayName,
        };
        return {
          ...prev,
          selectedMaps: [...prev.selectedMaps, newMap],
        };
      }
      return prev;
    });
  };

  const updateMapCount = (mapName: string, count: number) => {
    setWizardData((prev) => {
      const existingMap = prev.selectedMaps.find((map) => map.map === mapName);
      const mapInfo = availableMaps.find((map) => map.name === mapName);

      if (existingMap) {
        // Map exists, update its count
        return {
          ...prev,
          selectedMaps: prev.selectedMaps.map((map) =>
            map.map === mapName ? { ...map, count } : map,
          ),
        };
      } else if (mapInfo) {
        // Map doesn't exist, add it with the specified count
        const newMap = {
          map: mapName,
          count: count,
          enabled: true,
          displayName: mapInfo.displayName,
        };
        return {
          ...prev,
          selectedMaps: [...prev.selectedMaps, newMap],
        };
      }
      return prev;
    });
  };

  const generateServers = (): ServerConfig[] => {
    // If wizardData.servers exists (from imported config), use it directly
    if (Array.isArray(wizardData.servers) && wizardData.servers.length > 0) {
      return wizardData.servers as ServerConfig[];
    }
    // Otherwise, generate from selectedMaps as before
    const servers: ServerConfig[] = [];
    let portCounter = wizardData.basePort || 7777;
    wizardData.selectedMaps.forEach((mapConfig) => {
      if (mapConfig.enabled) {
        for (let i = 0; i < mapConfig.count; i++) {
          const serverName =
            mapConfig.count === 1
              ? `${wizardData.clusterName}-${mapConfig.displayName || mapConfig.map}`
              : `${wizardData.clusterName}-${mapConfig.displayName || mapConfig.map}-${i + 1}`;
          const serverConfig: ServerConfig = {
            name: serverName,
            map: mapConfig.map,
            gamePort: portCounter,
            queryPort: portCounter + 1,
            rconPort: portCounter + 2,
            maxPlayers: wizardData.maxPlayers,
            adminPassword: wizardData.adminPassword,
            serverPassword: wizardData.serverPassword,
            rconPassword: wizardData.clusterPassword || "",
            harvestMultiplier: wizardData.harvestMultiplier,
            xpMultiplier: wizardData.xpMultiplier,
            tamingMultiplier: wizardData.tamingMultiplier,
            nameSuffix: mapConfig.displayName,
            sessionName: serverName,
          };
          servers.push(serverConfig);
          portCounter += 3;
        }
      }
    });
    return servers;
  };

  const createCluster = async () => {
    try {
      setCurrentStep("creating");
      setCurrentJobId(null); // Clear previous job ID
      setJobProgress(null);
      setStatusMessage("Creating cluster...");
      setStatusType("info");

      // Always include a non-empty servers array in the payload
      const payload = {
        ...wizardData,
        name: wizardData.clusterName,
        servers: generateServers(),
      };

      const response = await provisioningApi.createCluster(payload);
      if (response.success) {
        setCurrentJobId(response.jobId || null);
        setStatusMessage(
          "Cluster creation job started. Monitoring progress...",
        );
        setStatusType("info");
      } else {
        setStatusMessage(
          `❌ Failed to start cluster creation: ${response.message || "Unknown error"}`,
        );
        setStatusType("error");
        setCurrentStep("review");
      }
    } catch (error: unknown) {
      console.error("Failed to create cluster:", error);
      setStatusMessage(
        `❌ Failed to create cluster: ${error instanceof Error ? error.message : String(error)}`,
      );
      setStatusType("error");
      setCurrentStep("review");
    }
  };

  const getClusterStatus = (cluster: Cluster) => {
    // Support both cluster.config.servers (backend format) and
    // cluster.servers (mock/demo format with inline servers)
    const serversList = (cluster.config?.servers ||
      (cluster as any).servers ||
      []) as ServerConfig[];
    if (serversList.length > 0) {
      const running = serversList.filter(
        (s: ServerConfig) => s.status === "running",
      ).length;
      const stopped = serversList.filter(
        (s: ServerConfig) => s.status === "stopped",
      ).length;
      const total = serversList.length;
      if (running === total)
        return {
          status: "running",
          runningServers: running,
          totalServers: total,
        };
      if (stopped === total)
        return {
          status: "stopped",
          runningServers: running,
          totalServers: total,
        };
      if (running > 0 && running < total)
        return {
          status: "partial",
          runningServers: running,
          totalServers: total,
        };
      return {
        status: "unknown",
        runningServers: running,
        totalServers: total,
      };
    }
    return { status: "unknown", runningServers: 0, totalServers: 0 };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <span className="badge badge-success">Running</span>;
      case "stopped":
        return <span className="badge badge-error">Stopped</span>;
      case "partial":
        return <span className="badge badge-warning">Partial</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  // Wizard navigation
  const nextStep = () => {
    switch (currentStep) {
      case "welcome":
        setCurrentStep("cluster-basic");
        break;
      case "cluster-basic":
        if (wizardData.clusterName.trim()) {
          setCurrentStep("map-selection");
        } else {
          showToast("Please enter a cluster name", "warning");
        }
        break;
      case "map-selection":
        if (wizardData.selectedMaps.length > 0) {
          setCurrentStep("server-config");
        } else {
          showToast("Please select at least one map", "warning");
        }
        break;
      case "server-config":
        setCurrentStep("individual-servers");
        break;
      case "individual-servers":
        setCurrentStep("game-settings");
        break;
      case "game-settings":
        setCurrentStep("mods");
        break;
      case "mods":
        setCurrentStep("review");
        break;
      case "review":
        createCluster();
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case "cluster-basic":
        setCurrentStep("welcome");
        break;
      case "map-selection":
        setCurrentStep("cluster-basic");
        break;
      case "server-config":
        setCurrentStep("map-selection");
        break;
      case "individual-servers":
        setCurrentStep("server-config");
        break;
      case "game-settings":
        setCurrentStep("individual-servers");
        break;
      case "mods":
        setCurrentStep("game-settings");
        break;
      case "review":
        setCurrentStep("mods");
        break;
      default:
        break;
    }
  };

  // Determine if the current step is 'creating'
  const isCreating = currentStep === "creating";

  // Define the main wizard steps (excluding 'creating')
  const wizardSteps: WizardStep[] = [
    "welcome",
    "cluster-basic",
    "map-selection",
    "server-config",
    "individual-servers",
    "game-settings",
    "mods",
    "review",
  ];

  return {
    // State
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

    // Setters
    setShowWizard,
    setCurrentStep,
    setStatusMessage,
    setStatusType,
    setLoading,
    setShowGlobalConfigManager,
    setShowGlobalModManager,
    setShowServerBackupManager,
    setShowMapManager,
    setSelectedServerForBackup,
    setShowStandaloneModal,
    setStandaloneLoading,
    setStandaloneError,
    setStandaloneSuccess,
    setStandaloneForm,
    setStandaloneCustomMap,
    setStandaloneCustomMapName,
    setWizardData,
    setRestoreModal,
    setSelectedBackup,

    // Handlers
    loadSystemInfo,
    loadClusters,
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
    createCluster,
    getClusterStatus,
    getStatusBadge,
    nextStep,
    prevStep,
  };
}
