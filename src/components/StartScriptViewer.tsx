import React, { useState, useEffect } from 'react';
import { getStartScript } from '../services/api-provisioning';

interface StartScriptViewerProps {
  serverName: string;
  onClose: () => void;
}

interface StartScriptData {
  success: boolean;
  serverName: string;
  clusterName: string;
  scriptPath: string;
  content: string;
  lastModified: string;
}

const StartScriptViewer: React.FC<StartScriptViewerProps> = ({ serverName, onClose }) => {
  const [scriptData, setScriptData] = useState<StartScriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStartScript = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStartScript(serverName);
        setScriptData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load start script');
      } finally {
        setLoading(false);
      }
    };

    loadStartScript();
  }, [serverName]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = () => {
    if (scriptData?.content) {
      navigator.clipboard.writeText(scriptData.content);
    }
  };

  if (loading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-4xl">
          <div className="flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Loading start script...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-error">Error Loading Start Script</h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              ✕
            </button>
          </div>
          <div className="alert alert-error mb-4">
            <p>{error}</p>
          </div>
          <div className="modal-action">
            <button
              onClick={onClose}
              className="btn btn-ghost"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Start Script: {serverName}</h2>
            {scriptData && (
              <div className="text-sm text-base-content/70 mt-1">
                <span>Cluster: {scriptData.clusterName}</span>
                <span className="mx-2">•</span>
                <span>Last Modified: {formatDate(scriptData.lastModified)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            ✕
          </button>
        </div>

        {/* Script Path */}
        {scriptData && (
          <div className="mb-4 p-3 bg-base-200 rounded-lg">
            <div className="text-sm text-base-content/70 mb-1">Script Path:</div>
            <div className="font-mono text-sm break-all">{scriptData.scriptPath}</div>
          </div>
        )}

        {/* Script Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Script Content</h3>
            <button
              onClick={copyToClipboard}
              className="btn btn-primary btn-sm"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="bg-base-300 text-base-content p-4 rounded-lg overflow-auto max-h-[60vh] font-mono text-sm">
            <pre className="whitespace-pre-wrap">{scriptData?.content}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScriptViewer; 