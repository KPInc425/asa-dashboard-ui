import React from "react";
import type { DebugInfo } from "./types";

interface DebugModalProps {
  debugInfo: DebugInfo;
  onClose: () => void;
}

const DebugModal: React.FC<DebugModalProps> = ({ debugInfo, onClose }) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh]">
        <h3 className="font-bold text-lg mb-4">Debug Information</h3>
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          <div>
            <h4 className="font-semibold text-sm text-base-content/70 mb-2">
              Timestamp
            </h4>
            <p className="text-sm">{debugInfo.timestamp}</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-base-content/70 mb-2">
              Environment Variables
            </h4>
            <pre className="text-xs bg-base-200 p-3 rounded-lg overflow-auto text-base-content">
              {JSON.stringify(debugInfo.environment, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-base-content/70 mb-2">
              Config
            </h4>
            <pre className="text-xs bg-base-200 p-3 rounded-lg overflow-auto text-base-content">
              {JSON.stringify(debugInfo.config, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-base-content/70 mb-2">
              Provisioner Paths
            </h4>
            <pre className="text-xs bg-base-200 p-3 rounded-lg overflow-auto text-base-content">
              {JSON.stringify(debugInfo.provisioner, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-base-content/70 mb-2">
              Clusters ({debugInfo.clusters.length})
            </h4>
            <pre className="text-xs bg-base-200 p-3 rounded-lg overflow-auto text-base-content">
              {JSON.stringify(debugInfo.clusters, null, 2)}
            </pre>
          </div>

          {debugInfo.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-error mb-2">
                Errors ({debugInfo.errors.length})
              </h4>
              <ul className="text-xs text-error">
                {debugInfo.errors.map((error, index) => (
                  <li key={index} className="mb-1">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
