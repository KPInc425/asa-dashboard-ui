import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { provisioningApi } from "../../services/api-provisioning";
import { socketService, type JobProgress } from "../../services/socket";
import { useToast } from "../../contexts/ToastContext";
import { getAvailableMaps } from "../../config/maps";
import type { Cluster, ClusterBackup, ServerBackup } from "./types";

export interface NewServerForm {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
}

export function useClusterDetails() {
  const { clusterName } = useParams<{ clusterName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "mods" | "configs" | "servers"
  >("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backups, setBackups] = useState<ClusterBackup[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [downloadBackupLoading, setDownloadBackupLoading] = useState<
    string | null
  >(null);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const [serverBackups, setServerBackups] = useState<
    Record<string, ServerBackup[]>
  >({});
  const [serverBackupLoading, setServerBackupLoading] = useState<
    Record<string, boolean>
  >({});
  const [serverBackupError, setServerBackupError] = useState<
    Record<string, string>
  >({});
  const [downloadServerBackupLoading, setDownloadServerBackupLoading] =
    useState<Record<string, boolean>>({});
  const [showServerBackupModal, setShowServerBackupModal] = useState<
    string | null
  >(null);
  const [showServerRestoreModal, setShowServerRestoreModal] = useState<
    string | null
  >(null);
  const [serverRestoreFile, setServerRestoreFile] = useState<
    Record<string, File | null>
  >({});
  const [serverRestoreLoading, setServerRestoreLoading] = useState<
    Record<string, boolean>
  >({});
  const [serverRestoreError, setServerRestoreError] = useState<
    Record<string, string>
  >({});
  const [serverRestoreSuccess, setServerRestoreSuccess] = useState<
    Record<string, string>
  >({});

  const [showBackupOptionsModal, setShowBackupOptionsModal] = useState(false);
  const [showRestoreOptionsModal, setShowRestoreOptionsModal] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    saves: true,
    configs: true,
    logs: true,
  });
  const [restoreOptions, setRestoreOptions] = useState({
    saves: true,
    configs: true,
    logs: true,
  });

  const [downloadNotification, setDownloadNotification] = useState<
    string | null
  >(null);
  const { showToast } = useToast();

  // Add Server to Cluster state
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [addServerLoading, setAddServerLoading] = useState(false);
  const [addServerError, setAddServerError] = useState<string | null>(null);
  const [addServerJobId, setAddServerJobId] = useState<string | null>(null);
  const [addServerProgress, setAddServerProgress] =
    useState<JobProgress | null>(null);
  const [newServer, setNewServer] = useState<NewServerForm>({
    name: "",
    map: "TheIsland",
    gamePort: 7777,
    queryPort: 27015,
    rconPort: 32330,
    maxPlayers: 70,
    adminPassword: "",
    serverPassword: "",
  });
  const [isCustomMap, setIsCustomMap] = useState(false);
  const [customMapName, setCustomMapName] = useState("");

  const availableMaps = getAvailableMaps().map((m) => ({
    name: m.name,
    displayName: m.displayName,
  }));

  // Calculate the next available ports based on existing servers
  const getNextPorts = () => {
    if (!cluster?.config?.servers || cluster.config.servers.length === 0) {
      return { gamePort: 7777, queryPort: 27015, rconPort: 32330 };
    }
    const maxGame = Math.max(
      ...cluster.config.servers.map((s) => s.gamePort || 7777),
    );
    const maxQuery = Math.max(
      ...cluster.config.servers.map((s) => s.queryPort || 27015),
    );
    const maxRcon = Math.max(
      ...cluster.config.servers.map((s) => s.rconPort || 32330),
    );
    return {
      gamePort: maxGame + 1,
      queryPort: maxQuery + 1,
      rconPort: maxRcon + 1,
    };
  };

  const resetNewServerForm = () => {
    const nextPorts = getNextPorts();
    setNewServer({
      name: "",
      map: "TheIsland",
      gamePort: nextPorts.gamePort,
      queryPort: nextPorts.queryPort,
      rconPort: nextPorts.rconPort,
      maxPlayers: 70,
      adminPassword: "",
      serverPassword: "",
    });
    setIsCustomMap(false);
    setCustomMapName("");
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cluster) return;

    setAddServerLoading(true);
    setAddServerError(null);
    setAddServerProgress(null);
    setShowAddServerModal(false);

    try {
      const response = await provisioningApi.addServerToCluster(
        cluster.name,
        newServer,
      );

      if (response.jobId) {
        setAddServerJobId(response.jobId);
        showToast(`Server "${newServer.name}" creation started...`, "info");
      } else if (response.success) {
        showToast(`Server "${newServer.name}" added successfully!`, "success");
        resetNewServerForm();
        setAddServerLoading(false);
        loadCluster();
      } else {
        setAddServerError(response.message || "Failed to add server");
        setAddServerLoading(false);
      }
    } catch (err: unknown) {
      setAddServerError(
        err instanceof Error ? err.message : "Failed to add server",
      );
      setAddServerLoading(false);
    }
  };

  const openAddServerModal = () => {
    resetNewServerForm();
    setAddServerError(null);
    setShowAddServerModal(true);
  };

  // Load cluster data
  const loadCluster = useCallback(async () => {
    if (!clusterName) return;

    setLoading(true);
    setError(null);

    try {
      const response = await provisioningApi.getClusterDetails(clusterName);

      if (response.success && response.cluster) {
        setCluster(response.cluster as unknown as Cluster);
      } else {
        setError(`Cluster "${clusterName}" not found`);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load cluster data",
      );
    } finally {
      setLoading(false);
    }
  }, [clusterName]);

  useEffect(() => {
    loadCluster();
  }, [loadCluster]);

  // Socket.IO listener for add-server job progress
  useEffect(() => {
    const handleJobProgress = (progress: JobProgress) => {
      if (addServerJobId && progress.jobId === addServerJobId) {
        setAddServerProgress(progress);

        if (progress.status === "completed") {
          showToast(
            progress.message || "Server added successfully!",
            "success",
          );
          setAddServerJobId(null);
          setAddServerProgress(null);
          setAddServerLoading(false);
          resetNewServerForm();
          loadCluster();
        } else if (progress.status === "failed") {
          setAddServerError(
            progress.error || progress.message || "Failed to add server",
          );
          setAddServerJobId(null);
          setAddServerProgress(null);
          setAddServerLoading(false);
        }
      }
    };

    try {
      socketService.onJobProgress(handleJobProgress);
    } catch {}

    return () => {
      try {
        socketService.offJobProgress();
      } catch {}
    };
  }, [addServerJobId, loadCluster, showToast]);

  // Poll for job status as fallback
  useEffect(() => {
    if (!addServerJobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await provisioningApi.getJobStatus(addServerJobId);
        if (response.success && response.job) {
          const job = response.job as Record<string, unknown>;
          setAddServerProgress({
            jobId: addServerJobId,
            status: job.status as "running" | "completed" | "failed",
            progress: job.progress as number,
            message: (job.message as string) || "",
            error: job.error as string | undefined,
          });

          if (job.status === "completed") {
            showToast(
              (job.message as string) || "Server added successfully!",
              "success",
            );
            setAddServerJobId(null);
            setAddServerProgress(null);
            setAddServerLoading(false);
            loadCluster();
          } else if (job.status === "failed") {
            setAddServerError(
              (job.error as string) ||
                (job.message as string) ||
                "Failed to add server",
            );
            setAddServerJobId(null);
            setAddServerProgress(null);
            setAddServerLoading(false);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [addServerJobId, loadCluster, showToast]);

  // Handle tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "mods", "configs", "servers"].includes(tabParam)
    ) {
      setActiveTab(tabParam as "overview" | "mods" | "configs" | "servers");
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (
    tab: "overview" | "mods" | "configs" | "servers",
  ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleClusterAction = async (action: "start" | "stop" | "restart") => {
    if (!cluster) return;

    setActionLoading(action);

    try {
      let response;
      switch (action) {
        case "start":
          response = await provisioningApi.startCluster(cluster.name);
          break;
        case "stop":
          response = await provisioningApi.stopCluster(cluster.name);
          break;
        case "restart":
          response = await provisioningApi.restartCluster(cluster.name);
          break;
      }

      if (response.success && clusterName) {
        const clusterResponse =
          await provisioningApi.getClusterDetails(clusterName);
        if (clusterResponse.success && clusterResponse.cluster) {
          setCluster(clusterResponse.cluster as unknown as Cluster);
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} cluster`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Download cluster config handler
  const handleDownloadConfig = async () => {
    if (!cluster) return;
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const blob = await provisioningApi.exportClusterConfig(cluster.name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cluster.name}-cluster.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Failed to download config");
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download backup modal handler
  const openBackupModal = async () => {
    if (!cluster) return;
    setShowBackupModal(true);
    setBackupLoading(true);
    setBackupError(null);
    try {
      const result: unknown = await provisioningApi.getClusterBackups(
        cluster.name,
      );
      if (
        typeof result === "object" &&
        result &&
        (result as { success: boolean }).success
      ) {
        setBackups((result as { backups: ClusterBackup[] }).backups || []);
      } else if (typeof result === "object" && result) {
        setBackupError(
          (result as { message?: string }).message || "Failed to load backups",
        );
      } else {
        setBackupError("Failed to load backups");
      }
    } catch {
      setBackupError("Failed to load backups");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async (backupName: string) => {
    if (!cluster) return;
    setDownloadBackupLoading(backupName);
    try {
      const blob = await provisioningApi.downloadClusterBackup(
        cluster.name,
        backupName,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backupName}.zip`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setDownloadNotification(
        "Download started. Your browser may prompt you to choose a location.",
      );
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
      setTimeout(() => setDownloadNotification(null), 4000);
    } catch {
      showToast("Failed to download backup", "error");
    } finally {
      setDownloadBackupLoading("");
    }
  };

  // Restore from backup modal handler
  const openRestoreModal = () => {
    setShowRestoreModal(true);
    setRestoreFile(null);
    setRestoreError(null);
    setRestoreSuccess(null);
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreFile(e.target.files?.[0] || null);
    setRestoreError(null);
    setRestoreSuccess(null);
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile || !cluster) {
      setRestoreError("Please select a backup ZIP file");
      return;
    }
    setRestoreLoading(true);
    setRestoreError(null);
    setRestoreSuccess(null);
    try {
      const result = await provisioningApi.restoreClusterBackup(
        restoreFile,
        cluster.name,
      );
      if (result.success) {
        setRestoreSuccess(result.message || "Cluster restored successfully");
      } else {
        setRestoreError(result.message || "Failed to restore cluster");
      }
    } catch {
      setRestoreError("Failed to restore cluster");
    } finally {
      setRestoreLoading(false);
    }
  };

  // Server backup modal handlers
  const openServerBackupModal = async (serverName: string) => {
    setShowServerBackupModal(serverName);
    setServerBackupLoading((prev) => ({ ...prev, [serverName]: true }));
    setServerBackupError((prev) => ({ ...prev, [serverName]: "" }));
    try {
      const result: unknown = await provisioningApi.listServerBackups();
      if (
        typeof result === "object" &&
        result &&
        (result as { success: boolean }).success
      ) {
        const filtered = (
          (result as { data?: { backups?: ServerBackup[] } }).data?.backups ||
          []
        ).filter((b: ServerBackup) => b.serverName === serverName);
        setServerBackups((prev) => ({ ...prev, [serverName]: filtered }));
      } else if (typeof result === "object" && result) {
        setServerBackupError((prev) => ({
          ...prev,
          [serverName]:
            (result as { message?: string }).message ||
            "Failed to load backups",
        }));
      } else {
        setServerBackupError((prev) => ({
          ...prev,
          [serverName]: "Failed to load backups",
        }));
      }
    } catch {
      setServerBackupError((prev) => ({
        ...prev,
        [serverName]: "Failed to load backups",
      }));
    } finally {
      setServerBackupLoading((prev) => ({ ...prev, [serverName]: false }));
    }
  };

  const handleDownloadServerBackup = async (
    serverName: string,
    backupName: string,
  ) => {
    setDownloadServerBackupLoading((prev) => ({ ...prev, [backupName]: true }));
    try {
      const blob = await provisioningApi.downloadServerBackup(
        serverName,
        backupName,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backupName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to download server backup", "error");
    } finally {
      setDownloadServerBackupLoading((prev) => ({
        ...prev,
        [backupName]: false,
      }));
    }
  };

  // Server restore modal handlers
  const openServerRestoreModal = (serverName: string) => {
    setShowServerRestoreModal(serverName);
    setServerRestoreFile((prev) => ({ ...prev, [serverName]: null }));
    setServerRestoreError((prev) => ({ ...prev, [serverName]: "" }));
    setServerRestoreSuccess((prev) => ({ ...prev, [serverName]: "" }));
  };

  const handleServerRestoreFileChange = (
    serverName: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setServerRestoreFile((prev) => ({
      ...prev,
      [serverName]: e.target.files?.[0] || null,
    }));
    setServerRestoreError((prev) => ({ ...prev, [serverName]: "" }));
    setServerRestoreSuccess((prev) => ({ ...prev, [serverName]: "" }));
  };

  const handleServerRestoreSubmit = async (
    serverName: string,
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    const file = serverRestoreFile[serverName];
    if (!file) {
      setServerRestoreError((prev) => ({
        ...prev,
        [serverName]: "Please select a backup ZIP file",
      }));
      return;
    }
    setServerRestoreLoading((prev) => ({ ...prev, [serverName]: true }));
    setServerRestoreError((prev) => ({ ...prev, [serverName]: "" }));
    setServerRestoreSuccess((prev) => ({ ...prev, [serverName]: "" }));
    try {
      const result = await provisioningApi.restoreServerBackup(file, serverName);
      if (result.success) {
        setServerRestoreSuccess((prev) => ({
          ...prev,
          [serverName]: result.message || "Server restored successfully",
        }));
      } else {
        setServerRestoreError((prev) => ({
          ...prev,
          [serverName]: result.message || "Failed to restore server",
        }));
      }
    } catch {
      setServerRestoreError((prev) => ({
        ...prev,
        [serverName]: "Failed to restore server",
      }));
    } finally {
      setServerRestoreLoading((prev) => ({ ...prev, [serverName]: false }));
    }
  };

  // Backup options modal handlers
  const handleBackupOptionsStart = async () => {
    if (!cluster) return;
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const response = await provisioningApi.backupCluster(cluster.name, {
        saves: backupOptions.saves,
        configs: backupOptions.configs,
        logs: backupOptions.logs,
      });
      if (!response.success) {
        setDownloadError(response.message || "Backup failed");
      }
    } catch (err: unknown) {
      setDownloadError(
        err instanceof Error ? err.message : "Backup failed",
      );
    } finally {
      setDownloadLoading(false);
      setShowBackupOptionsModal(false);
    }
  };

  const handleRestoreOptionsStart = async () => {
    if (!cluster) return;
    setRestoreLoading(true);
    setRestoreError(null);
    try {
      const response = await provisioningApi.restoreCluster(cluster.name, {
        saves: restoreOptions.saves,
        configs: restoreOptions.configs,
        logs: restoreOptions.logs,
      });
      if (!response.success) {
        setRestoreError(response.message || "Restore failed");
      }
    } catch (err: unknown) {
      setRestoreError(
        err instanceof Error ? err.message : "Restore failed",
      );
    } finally {
      setRestoreLoading(false);
      setShowRestoreOptionsModal(false);
    }
  };

  return {
    // State
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
    addServerLoading,
    addServerError,
    addServerProgress,
    newServer,
    isCustomMap,
    customMapName,
    availableMaps,
    // Setters
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
    setDownloadError,
    setDownloadLoading,
    setRestoreLoading,
    setRestoreError,
    setRestoreSuccess,
    // Handlers
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
  };
}
