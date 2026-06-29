import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { provisioningApi } from "../services/api";
import { useDeveloper } from "../contexts/DeveloperContext";
import { useEnvironment } from "../contexts/EnvironmentContext";
import { SystemLogs, ServiceInfo, LogTab, LogFile } from "./system-logs/types";
import { getLogTabMeta } from "./system-logs/logTabUtils";
import { formatLogContent } from "./system-logs/formatLogContent";
import LoadingState from "./system-logs/LoadingState";
import NoBackendState from "./system-logs/NoBackendState";
import LogHeader from "./system-logs/LogHeader";
import LogControls from "./system-logs/LogControls";
import ErrorAlert from "./system-logs/ErrorAlert";
import LogTabs from "./system-logs/LogTabs";
import LogViewer from "./system-logs/LogViewer";
import NoLogContent from "./system-logs/NoLogContent";
import NoLogsAvailable from "./system-logs/NoLogsAvailable";
import DebugModal from "./system-logs/DebugModal";

const SystemLogs: React.FC = () => {
  const navigate = useNavigate();
  const { isDeveloperMode } = useDeveloper();
  const { currentEnvironment } = useEnvironment();
  const [logs, setLogs] = useState<SystemLogs>({});
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("combined");
  const [lines, setLines] = useState<number>(100);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [showDebugModal, setShowDebugModal] = useState<boolean>(false);
  const [debugData, setDebugData] = useState<any>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await provisioningApi.getSystemLogs("all", lines);

      if (response.success) {
        setLogs(response as unknown as SystemLogs);
        setServiceInfo(response.serviceInfo as unknown as ServiceInfo);
      } else {
        setError("Failed to load system logs");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load system logs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [lines]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh]);

  // Get available tabs based on existing log files or new backend keys
  const availableTabs = useMemo(() => {
    const tabs = new Map<string, LogTab>();

    const addTab = (tab: LogTab) => {
      if (!tabs.has(tab.key)) {
        tabs.set(tab.key, tab);
      }
    };

    if (logs.logFiles && typeof logs.logFiles === "object") {
      Object.keys(logs.logFiles)
        .sort((left, right) => right.localeCompare(left))
        .forEach((key) => {
          const logFile = logs.logFiles![key];
          if (logFile && logFile.exists) {
            addTab(getLogTabMeta(key));
          }
        });

      if (tabs.size > 0) {
        return Array.from(tabs.values());
      }
    }

    if (logs.api && logs.api.content)
      addTab({ key: "api", sourceKey: "api", label: "API Logs", icon: "📝" });
    if (logs.server && logs.server.content)
      addTab({
        key: "server",
        sourceKey: "server",
        label: "Server Logs",
        icon: "🖥️",
      });
    if (logs.docker && logs.docker.content)
      addTab({
        key: "docker",
        sourceKey: "docker",
        label: "Docker Logs",
        icon: "🐳",
      });
    if (logs.combined?.exists)
      addTab({
        key: "combined",
        sourceKey: "combined",
        label: "Combined Logs",
        icon: "📋",
      });
    if (logs.error?.exists)
      addTab({
        key: "error",
        sourceKey: "error",
        label: "Error Logs",
        icon: "❌",
      });
    if (logs.asaApiService?.exists)
      addTab({
        key: "asaApiService",
        sourceKey: "asaApiService",
        label: "API Service",
        icon: "🔧",
      });
    if (logs.nodeOut?.exists)
      addTab({
        key: "nodeOut",
        sourceKey: "nodeOut",
        label: "Node Stdout",
        icon: "📤",
      });
    if (logs.nodeErr?.exists)
      addTab({
        key: "nodeErr",
        sourceKey: "nodeErr",
        label: "Node Stderr",
        icon: "📥",
      });
    if (logs.serviceOut?.exists)
      addTab({
        key: "serviceOut",
        sourceKey: "serviceOut",
        label: "Service Stdout",
        icon: "⚙️",
      });
    if (logs.serviceErr?.exists)
      addTab({
        key: "serviceErr",
        sourceKey: "serviceErr",
        label: "Service Stderr",
        icon: "⚠️",
      });

    return Array.from(tabs.values());
  }, [logs]);

  // Set initial active tab to first available
  useEffect(() => {
    if (
      availableTabs.length > 0 &&
      !availableTabs.find((tab) => tab.key === activeTab)
    ) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs]);

  // Memoize the rendered log content to avoid reprocessing on unrelated renders
  // Support new backend log object structure
  const activeTabMeta = availableTabs.find((tab) => tab.key === activeTab);
  const currentLog = activeTabMeta
    ? logs.logFiles?.[activeTabMeta.sourceKey] ||
      (logs[activeTabMeta.sourceKey as keyof SystemLogs] as any)
    : undefined;
  const currentLogContent = currentLog?.content || "";

  const formattedLog = useMemo(
    () => formatLogContent(currentLogContent),
    [currentLogContent],
  );

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadLogs = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const debugSystemLogs = async () => {
    try {
      console.log("🔍 Debug: Checking system logs...");

      // Try to get system logs with debug info
      const response = await provisioningApi.getSystemLogs("all", lines);
      console.log("🔍 Debug: System logs response:", response);

      if (response.success) {
        const debugInfo = {
          serviceInfo: response.serviceInfo,
          logFiles: response.logFiles,
          availableTabs: availableTabs,
          currentActiveTab: activeTab,
          logsObjectKeys: Object.keys(logs),
          currentLogContent: currentLogContent
            ? `${currentLogContent.length} characters`
            : "No content",
        };

        console.log("🔍 Debug: System logs debug info:", debugInfo);
        setDebugData(debugInfo);
        setShowDebugModal(true);
      } else {
        setDebugData({ error: "Failed to get system logs debug info" });
        setShowDebugModal(true);
      }
    } catch (error) {
      console.error("🔍 Debug: Error getting system logs:", error);
      setDebugData({
        error:
          "Error getting debug info: " +
          (error instanceof Error ? error.message : "Unknown error"),
      });
      setShowDebugModal(true);
    }
  };

  const copyDebugData = () => {
    if (debugData) {
      navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    }
  };

  if (loading && Object.keys(logs).length === 0) {
    return <LoadingState />;
  }

  // Deep-link-only mode: no backend configured
  if (currentEnvironment.backends.length === 0) {
    return <NoBackendState />;
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <LogHeader
          serviceInfo={serviceInfo}
          logs={logs}
          isDeveloperMode={isDeveloperMode}
          onDebug={debugSystemLogs}
          onBack={() => navigate("/")}
        />

        {/* Controls */}
        <LogControls
          lines={lines}
          onLinesChange={setLines}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          loading={loading}
          onRefresh={loadLogs}
        />

        {/* Error Display */}
        {error && <ErrorAlert error={error} />}

        {/* Logs Display */}
        {availableTabs.length > 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-0">
              {/* Tabs */}
              <LogTabs
                tabs={availableTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              <div className="p-4">
                {currentLogContent ? (
                  <LogViewer
                    logContent={currentLogContent}
                    logFile={currentLog}
                    label={
                      availableTabs.find((tab) => tab.key === activeTab)
                        ?.label || activeTab
                    }
                    activeTab={activeTab}
                    formattedLog={formattedLog}
                    onCopy={copyToClipboard}
                    onDownload={downloadLogs}
                  />
                ) : (
                  <NoLogContent />
                )}
              </div>
            </div>
          </div>
        ) : (
          <NoLogsAvailable serviceInfo={serviceInfo} />
        )}

        {/* Debug Modal */}
        <DebugModal
          show={showDebugModal}
          debugData={debugData}
          onCopy={copyDebugData}
          onClose={() => setShowDebugModal(false)}
        />
      </div>
    </div>
  );
};

export default SystemLogs;
