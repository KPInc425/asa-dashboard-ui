import React from "react";
import { ServiceInfo, SystemLogs } from "./types";

interface LogHeaderProps {
  serviceInfo: ServiceInfo | null;
  logs: SystemLogs;
  isDeveloperMode: boolean;
  onDebug: () => void;
  onBack: () => void;
}

const LogHeader: React.FC<LogHeaderProps> = ({
  serviceInfo,
  logs,
  isDeveloperMode,
  onDebug,
  onBack,
}) => (
  <div className="animate-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
          <span className="text-2xl">📋</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            System Logs
          </h1>
          <p className="text-base-content/70">
            Monitor backend system logs for debugging and troubleshooting
          </p>
          {serviceInfo && (
            <div className="text-sm text-base-content/60 mt-1">
              Mode:{" "}
              {serviceInfo.mode === "docker"
                ? "Docker"
                : serviceInfo.isWindowsService
                  ? "Native (Windows Service)"
                  : "Native (Development)"}{" "}
              | Logs: {Object.keys(logs).length} files available
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {isDeveloperMode && (
          <button
            onClick={onDebug}
            className="btn btn-warning hover:shadow-lg hover:shadow-warning/25"
            title="Debug system logs discovery"
          >
            🔍 Debug Logs
          </button>
        )}
        <button
          onClick={onBack}
          className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  </div>
);

export default LogHeader;
