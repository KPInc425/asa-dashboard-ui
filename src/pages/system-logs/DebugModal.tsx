import React from "react";

interface DebugModalProps {
  show: boolean;
  debugData: any;
  onCopy: () => void;
  onClose: () => void;
}

const DebugModal: React.FC<DebugModalProps> = ({
  show,
  debugData,
  onCopy,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[80vh]">
        <h3 className="font-bold text-lg mb-4">
          🔍 System Logs Debug Information
        </h3>
        <div className="flex justify-end mb-4">
          <button
            onClick={onCopy}
            className="btn btn-sm btn-outline btn-primary"
          >
            📋 Copy to Clipboard
          </button>
        </div>
        <div className="bg-base-300 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default DebugModal;
