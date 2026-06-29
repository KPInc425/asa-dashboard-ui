import React from "react";
import { LogFile } from "./types";

interface LogViewerProps {
  logContent: string;
  logFile: LogFile | undefined;
  label: string;
  activeTab: string;
  formattedLog: React.ReactNode[];
  onCopy: (content: string) => void;
  onDownload: (content: string, filename: string) => void;
}

const LogViewer: React.FC<LogViewerProps> = ({
  logContent,
  logFile,
  label,
  activeTab,
  formattedLog,
  onCopy,
  onDownload,
}) => (
  <div>
    {/* Log Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <span className="text-lg font-semibold">{label}</span>
        <span className="badge badge-outline">
          {logFile?.path
            ? logFile.path.split(/[/\\]/).pop() || "Unknown"
            : "Unknown"}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onCopy(logContent)}
          className="btn btn-sm btn-outline"
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
        <button
          onClick={() => onDownload(logContent, `${activeTab}-logs.txt`)}
          className="btn btn-sm btn-outline"
          title="Download logs"
        >
          💾 Download
        </button>
      </div>
    </div>

    {/* Log Content */}
    <div className="bg-base-300 p-4 rounded-lg max-h-96 overflow-y-auto">
      {formattedLog}
    </div>
  </div>
);

export default LogViewer;
