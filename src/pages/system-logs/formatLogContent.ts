import React from "react";

export const formatLogContent = (content: string): React.ReactNode[] => {
  if (!content) return [<div key="empty">No logs available</div>];

  return content
    .split("\n")
    .reverse()
    .map((line, index) => {
      // Improved log level detection
      let logLevel = "info";

      // Check for JSON log format first
      try {
        if (line.trim() && line.includes('"level"')) {
          const match = line.match(/"level":\s*"?([^",\s]+)"?/);
          if (match) {
            logLevel = match[1].toLowerCase();
          }
        }
      } catch (error) {
        // Fallback to text-based detection
      }

      // If still 'info', check for text-based log level indicators
      if (logLevel === "info") {
        const lowerLine = line.toLowerCase();

        // Check for error indicators
        if (
          lowerLine.includes("error") ||
          lowerLine.includes("failed") ||
          lowerLine.includes("exception") ||
          lowerLine.includes("fatal") ||
          lowerLine.includes("critical")
        ) {
          logLevel = "error";
        }
        // Check for warning indicators
        else if (
          lowerLine.includes("warn") ||
          lowerLine.includes("warning") ||
          lowerLine.includes("deprecated")
        ) {
          logLevel = "warn";
        }
        // Check for info indicators
        else if (
          lowerLine.includes("info") ||
          lowerLine.includes("started") ||
          lowerLine.includes("connected") ||
          lowerLine.includes("listening") ||
          lowerLine.includes("ready")
        ) {
          logLevel = "info";
        }
        // Check for debug indicators
        else if (lowerLine.includes("debug") || lowerLine.includes("trace")) {
          logLevel = "debug";
        }
        // Default to neutral for lines without clear indicators
        else {
          logLevel = "neutral";
        }
      }

      let className = "font-mono text-sm";
      if (logLevel === "error") className += " text-error";
      else if (logLevel === "warn") className += " text-warning";
      else if (logLevel === "info") className += " text-info";
      else if (logLevel === "debug") className += " text-base-content/50";
      else className += " text-base-content"; // neutral and default

      return (
        <div key={`${index}-${line?.slice(0, 30)}`} className={className}>
          {line || "\u00A0"}
        </div>
      );
    });
};
