import React, { useState, useEffect } from 'react';
import { getStartScript } from '../services/api';

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading start script...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Start Script</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Start Script: {serverName}</h2>
            {scriptData && (
              <div className="text-sm text-gray-600 mt-1">
                <span>Cluster: {scriptData.clusterName}</span>
                <span className="mx-2">•</span>
                <span>Last Modified: {formatDate(scriptData.lastModified)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Script Path */}
        {scriptData && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Script Path:</div>
            <div className="font-mono text-sm break-all">{scriptData.scriptPath}</div>
          </div>
        )}

        {/* Script Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Script Content</h3>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[60vh] font-mono text-sm">
            <pre className="whitespace-pre-wrap">{scriptData?.content}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScriptViewer; 