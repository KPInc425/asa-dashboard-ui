import React from "react";
import { ServiceInfo } from "./types";

interface NoLogsAvailableProps {
  serviceInfo: ServiceInfo | null;
}

const NoLogsAvailable: React.FC<NoLogsAvailableProps> = ({ serviceInfo }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📋</div>
    <h3 className="text-xl font-semibold mb-2">No Logs Available</h3>
    <p className="text-base-content/70">
      No system logs are currently available. This might be because the log
      files don't exist yet or the system hasn't generated any logs.
    </p>
    {serviceInfo && (
      <div className="mt-4 p-4 bg-base-200 rounded-lg">
        <h4 className="font-semibold mb-2">Service Information:</h4>
        <div className="text-sm text-left space-y-1">
          <div>
            Mode:{" "}
            {serviceInfo.mode === "docker"
              ? "Docker"
              : serviceInfo.isWindowsService
                ? "Native (Windows Service)"
                : "Native (Development)"}
          </div>
          <div>Working Directory: {serviceInfo.currentWorkingDirectory}</div>
          <div>Log Base Path: {serviceInfo.logBasePath}</div>
          <div>Process ID: {serviceInfo.processId}</div>
        </div>
      </div>
    )}
  </div>
);

export default NoLogsAvailable;
