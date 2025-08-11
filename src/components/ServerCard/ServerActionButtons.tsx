import React, { useState } from 'react';
import { api } from '../../services/api';
import { useDeveloper } from '../../contexts/DeveloperContext';
import RconDebugModal from '../RconDebugModal';

interface Server {
  name: string;
  status: string;
  type: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
  rconPort?: number;
}

interface ServerActionButtonsProps {
  server: Server;
  actionLoading: string | null;
  onAction: (action: 'start' | 'stop' | 'restart', server: Server) => void;
  onViewDetails: (server: Server) => void;
}

const ServerActionButtons: React.FC<ServerActionButtonsProps> = ({
  server,
  actionLoading,
  onAction,
  onViewDetails
}) => {
  const { isDeveloperMode } = useDeveloper();
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  return (
    <div className="space-y-2">
      {/* Control buttons in a row */}
      <div className="flex gap-2 flex-wrap justify-center md:justify-start">
        <button
          title={`Start ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('start', server)}
          disabled={server.status === 'running' || actionLoading === server.name}
          className="btn btn-success btn-xs md:btn-sm min-w-[2.5rem] md:min-w-[3rem]"
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '▶️'
          )}
        </button>
        <button
          title={`Stop ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('stop', server)}
          disabled={server.status === 'stopped' || actionLoading === server.name}
          className="btn btn-error btn-xs md:btn-sm min-w-[2.5rem] md:min-w-[3rem]"
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '⏹️'
          )}
        </button>
        <button
          title={`Restart ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('restart', server)}
          disabled={server.status === 'stopped' || actionLoading === server.name}
          className="btn btn-warning btn-xs md:btn-sm min-w-[2.5rem] md:min-w-[3rem]"
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '🔄'
          )}
        </button>
      </div>
      
      {/* Full-width View Details button */}
      <button
        title="View Details"
        onClick={() => onViewDetails(server)}
        className="btn btn-primary btn-sm w-full text-xs md:text-sm"
      >
        🔍 View Details
      </button>
      
      {/* Fix RCON button for native servers - Only show in developer mode */}
      {isDeveloperMode && (server.type === 'native' || server.type === 'cluster-server' || server.type === 'individual') && server.rconPort && (
        <div className="flex gap-1">
          <button
            title="Fix RCON authentication issues"
            onClick={async () => {
              try {
                const response = await api.post(`/api/native-servers/${encodeURIComponent(server.name)}/fix-rcon`);
                if (response.data.success) {
                  alert(`✅ ${response.data.message}\n\nPlease restart the server to apply the changes.`);
                } else {
                  alert(`❌ Failed to fix RCON: ${response.data.message}`);
                }
              } catch (error) {
                alert(`❌ Error fixing RCON: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="btn btn-warning btn-xs md:btn-sm flex-1 text-xs"
          >
            🔧 Fix RCON
          </button>
          <button
            title="Debug RCON configuration"
            onClick={async () => {
              try {
                const response = await api.get(`/api/native-servers/${encodeURIComponent(server.name)}/debug-rcon`);
                if (response.data.success && response.data.debug) {
                  setDebugInfo(response.data.debug);
                  setDebugModalOpen(true);
                } else {
                  alert(`❌ Debug failed: ${response.data.message || 'Unknown error'}`);
                }
              } catch (error) {
                const errorMessage = (error as any).response?.data?.message || (error as Error).message || 'Unknown error';
                alert(`❌ Debug error: ${errorMessage}`);
              }
            }}
            className="btn btn-info btn-xs md:btn-sm min-w-[2.5rem]"
          >
            🔍
          </button>
        </div>
      )}

      {/* RCON Debug Modal */}
      <RconDebugModal
        isOpen={debugModalOpen}
        onClose={() => setDebugModalOpen(false)}
        debugInfo={debugInfo}
        serverName={server.name}
      />
    </div>
  );
};

export default ServerActionButtons; 