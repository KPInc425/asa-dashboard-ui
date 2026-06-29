import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { apiService } from "../services/api";
import { useServers } from "../hooks/useServerData";
import LoadingSpinner from "../components/LoadingSpinner";
import GlobalModManager from "../components/GlobalModManager";
import { useDeveloper } from "../contexts/DeveloperContext";
import { useToast } from "../contexts/ToastContext";
import { provisioningApi } from "../services/api";
import { useEnvironment } from "../contexts/EnvironmentContext";
import StatCard from "./dashboard/StatCard";
import SystemInfoCard from "./dashboard/SystemInfoCard";
import QuickActionButton from "./dashboard/QuickActionButton";
import ErrorAlert from "./dashboard/ErrorAlert";
import ClusterList from "./dashboard/ClusterList";
import RecentServers from "./dashboard/RecentServers";
import EmptyState from "./dashboard/EmptyState";
import DebugModal from "./dashboard/DebugModal";
import DeepLinkOnlyView from "./dashboard/DeepLinkOnlyView";
import type { Cluster, NativeServer, DashboardStats, DebugInfo, SystemInfo } from "./dashboard/types";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDeveloperMode } = useDeveloper();
  const { showToast } = useToast();
  const { currentEnvironment, supportsCapability } = useEnvironment();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    runningServers: 0,
    stoppedServers: 0,
    totalPlayers: 0,
    totalClusters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGlobalModManager, setShowGlobalModManager] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Use centralized server data hook - shares cache with Servers page
  const { data: serverData, isLoading: serversLoading } = useServers({
    refetchInterval: 30_000, // Refresh every 30 seconds on dashboard
  });

  // Convert to NativeServer format for backward compatibility
  const nativeServers: NativeServer[] = React.useMemo(() => {
    return (serverData || []).map((s) => ({
      name: s.name,
      status: s.status as string,
      image: s.image || "",
      created: s.created || "",
      type: s.type,
      clusterName: s.clusterName,
      map: s.map,
      gamePort: s.gamePort,
      queryPort: s.queryPort,
      rconPort: s.rconPort,
      maxPlayers: s.maxPlayers,
      serverPath: s.serverPath,
    }));
  }, [serverData]);

  // Update stats when server data changes
  useEffect(() => {
    if (serverData) {
      const totalServers = serverData.length;
      const runningServers = serverData.filter(
        (s) => s.status === "running",
      ).length;
      const stoppedServers = totalServers - runningServers;

      setStats((prev) => ({
        ...prev,
        totalServers,
        runningServers,
        stoppedServers,
      }));
    }
  }, [serverData]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [systemResponse, clustersResponse] = await Promise.all([
        api.get("/api/system/info"),
        apiService.provisioning
          .listClusters()
          .catch(() => ({ success: false, clusters: [] })),
      ]);

      if (systemResponse.data.success) {
        setSystemInfo(systemResponse.data.systemInfo);
      }

      if (clustersResponse.success) {
        setClusters(clustersResponse.clusters as Cluster[]);
        setStats((prev) => ({
          ...prev,
          totalClusters: clustersResponse.clusters.length,
        }));
      }
    } catch (err: any) {
      setError("Failed to load dashboard data");
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDebugClick = async () => {
    try {
      setDebugLoading(true);
      const response = await api.get("/api/provisioning/debug");
      setDebugInfo(response.data);
      setShowDebugModal(true);
    } catch (error) {
      console.error("Failed to get debug info:", error);
      showToast(
        "Failed to get debug info. Check console for details.",
        "error",
      );
    } finally {
      setDebugLoading(false);
    }
  };

  // Import cluster config handler
  const handleImportClick = () => {
    setImportError(null);
    setImportSuccess(null);
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await provisioningApi.importClusterConfig(file);
      if (result.success) {
        setImportSuccess(result.message || "Cluster imported successfully");
        await loadDashboardData();
      } else {
        setImportError(result.message || "Failed to import cluster");
      }
    } catch (err: any) {
      setImportError(err.message || "Failed to import cluster");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getModeDisplayName = (mode: string) => {
    switch (mode) {
      case "docker":
        return "Docker Mode";
      case "native":
        return "Native Windows Mode";
      case "hybrid":
        return "Hybrid Mode";
      default:
        return mode;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemoryUsage = (usage: any) => {
    if (!usage) return "N/A";

    if (usage.total && usage.used) {
      const gb = usage.used / 1024 / 1024 / 1024;
      return `${gb.toFixed(1)} GB`;
    }

    if (
      usage.heapUsed &&
      typeof usage.heapUsed === "number" &&
      !isNaN(usage.heapUsed)
    ) {
      const mb = usage.heapUsed / 1024 / 1024;
      return `${mb.toFixed(1)} MB (API)`;
    }

    return "N/A";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return "text-success";
      case "stopped":
        return "text-error";
      case "starting":
        return "text-warning";
      case "stopping":
        return "text-info";
      default:
        return "text-base-content/50";
    }
  };

  const getClusterStatus = (cluster: Cluster) => {
    // Handle both old and new cluster formats
    const servers = cluster.config?.servers || cluster.servers || [];
    if (servers.length > 0) {
      // Count servers with different statuses
      const running = servers.filter((s: any) => s.status === "running").length;
      const stopped = servers.filter((s: any) => s.status === "stopped").length;
      const unknown = servers.filter(
        (s: any) => !s.status || s.status === "unknown",
      ).length;
      const total = servers.length;

      // If we have unknown status servers, try to get real-time status
      if (unknown > 0) {
        return `${total} servers (${running} running, ${stopped} stopped, ${unknown} unknown)`;
      }

      return `${total} servers (${running} running, ${stopped} stopped)`;
    }
    return "No servers";
  };

  if (loading && serversLoading) {
    return <LoadingSpinner />;
  }

  // Deep-link-only mode: no backend configured, show external links
  if (currentEnvironment.backends.length === 0) {
    return (
      <DeepLinkOnlyView
        name={currentEnvironment.name}
        description={currentEnvironment.description || ""}
        links={currentEnvironment.links ?? {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {isDeveloperMode && supportsCapability("canViewStatus") && (
            <div className="flex gap-2">
              <button
                onClick={handleDebugClick}
                disabled={debugLoading}
                className="btn btn-outline btn-warning"
              >
                {debugLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "🐛 Debug Info"
                )}
              </button>
            </div>
          )}
        </div>

        {error && <ErrorAlert message={error} />}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            bgColor="bg-primary"
            icon="🦖"
            label="Total Servers"
            value={stats.totalServers}
          />
          <StatCard
            bgColor="bg-success"
            icon="🟢"
            label="Running"
            value={stats.runningServers}
            valueColor="text-success"
          />
          <StatCard
            bgColor="bg-error"
            icon="🔴"
            label="Stopped"
            value={stats.stoppedServers}
            valueColor="text-error"
          />
          <StatCard
            bgColor="bg-secondary"
            icon="🏗️"
            label="Clusters"
            value={stats.totalClusters}
          />
        </div>

        {/* System Information */}
        {systemInfo && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-base-content mb-4">
              System Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SystemInfoCard
                bgColor="bg-primary"
                letter="M"
                label="Mode"
                value={getModeDisplayName(systemInfo.mode)}
              />
              <SystemInfoCard
                bgColor="bg-success"
                letter="U"
                label="Uptime"
                value={formatUptime(systemInfo.uptime)}
              />
              <SystemInfoCard
                bgColor="bg-secondary"
                letter="M"
                label="Memory"
                value={formatMemoryUsage(systemInfo.memoryUsage)}
              />
              <SystemInfoCard
                bgColor="bg-accent"
                letter="P"
                label="Platform"
                value={systemInfo.platform}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <QuickActionButton
              icon="🦖"
              title="Manage Servers"
              description="View and control all servers"
              onClick={() => navigate("/servers")}
            />
            <QuickActionButton
              icon="🏗️"
              title="Create Server"
              description="Set up new servers and clusters"
              onClick={() => navigate("/provisioning")}
            />
            {supportsCapability("canEditConfig") && (
              <QuickActionButton
                icon="⚙️"
                title="Global Settings"
                description="Configure Game.ini files"
                onClick={() => navigate("/global-configs")}
              />
            )}
            {supportsCapability("canUpdateMods") && (
              <QuickActionButton
                icon="🧩"
                title="Global Mods"
                description="Add or remove mods"
                onClick={() => setShowGlobalModManager(true)}
              />
            )}
            <QuickActionButton
              icon="💬"
              title="Discord Setup"
              description="Configure notifications"
              onClick={() => navigate("/discord")}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ClusterList
            clusters={clusters}
            importLoading={importLoading}
            importError={importError}
            importSuccess={importSuccess}
            handleImportClick={handleImportClick}
            getClusterStatus={getClusterStatus}
          />
          <RecentServers
            servers={nativeServers}
            getStatusColor={getStatusColor}
          />
        </div>

        {/* Empty State */}
        {clusters.length === 0 && nativeServers.length === 0 && (
          <EmptyState />
        )}
      </div>

      {/* Debug Modal */}
      {showDebugModal && debugInfo && (
        <DebugModal
          debugInfo={debugInfo}
          onClose={() => setShowDebugModal(false)}
        />
      )}

      {/* Global Mod Manager Modal */}
      {showGlobalModManager && (
        <GlobalModManager onClose={() => setShowGlobalModManager(false)} />
      )}
    </div>
  );
};

export default Dashboard;
