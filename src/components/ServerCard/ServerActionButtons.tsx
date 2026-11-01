import React, { useState } from 'react';
import { api } from '../../services/api';
import { useDeveloper } from '../../contexts/DeveloperContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext2';
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
  onDelete?: (server: Server) => void;
}

const ServerActionButtons: React.FC<ServerActionButtonsProps> = ({
  server,
  actionLoading,
  onAction,
  onViewDetails,
  onDelete
}) => {
  const { isDeveloperMode } = useDeveloper();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  return (
    <div className="space-y-2">
      {/* Controls: three compact icon buttons, then Details, then a quiet delete.
          Everything on one row so the action area stops eating the card. */}
      <div className="flex items-center gap-1.5">
        <button
          title={`Start ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('start', server)}
          disabled={server.status === 'running' || actionLoading === server.name}
          className="btn btn-outline btn-success btn-sm btn-square"
          aria-label={`Start ${server.type === 'cluster' ? 'cluster' : 'server'}`}
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '▶'
          )}
        </button>
        <button
          title={`Stop ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('stop', server)}
          disabled={server.status === 'stopped' || actionLoading === server.name}
          className="btn btn-outline btn-error btn-sm btn-square"
          aria-label={`Stop ${server.type === 'cluster' ? 'cluster' : 'server'}`}
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '■'
          )}
        </button>
        <button
          title={`Restart ${server.type === 'cluster' ? 'cluster' : 'server'}`}
          onClick={() => onAction('restart', server)}
          disabled={server.status === 'stopped' || actionLoading === server.name}
          className="btn btn-outline btn-warning btn-sm btn-square"
          aria-label={`Restart ${server.type === 'cluster' ? 'cluster' : 'server'}`}
        >
          {actionLoading === server.name ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            '⟳'
          )}
        </button>

        <button
          title="View Details"
          onClick={() => onViewDetails(server)}
          className="btn btn-primary btn-sm flex-1"
        >
          Details
        </button>

        {/* Delete — only for standalone servers, not clusters or cluster-servers */}
        {onDelete && server.type !== 'cluster' && server.type !== 'cluster-server' && (
          <button
            title="Delete Server"
            aria-label={`Delete ${server.name}`}
            onClick={async () => {
              const confirmed = await showConfirm(`Are you sure you want to permanently delete "${server.name}"? This cannot be undone.`);
              if (confirmed) {
                onDelete(server);
              }
            }}
            className="btn btn-ghost btn-sm btn-square text-error/70 hover:bg-error/15 hover:text-error"
          >
            🗑
          </button>
        )}
      </div>
      
      {/* Fix RCON button for native servers - Only show in developer mode */}
      {isDeveloperMode && (server.type === 'native' || server.type === 'cluster-server' || server.type === 'individual') && server.rconPort && (
        <div className="flex gap-1">
          <button
            title="Fix RCON authentication issues"
            onClick={async () => {
              try {
                const response = await api.post(`/api/native-servers/${encodeURIComponent(server.name)}/fix-rcon`);
                if (response.data.success) {
                  showToast(`✅ ${response.data.message}\n\nPlease restart the server to apply the changes.`, 'success');
                } else {
                  showToast(`❌ Failed to fix RCON: ${response.data.message}`, 'error');
                }
              } catch (error) {
                showToast(`❌ Error fixing RCON: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
              }
            }}
            className="btn btn-warning btn-xs md:btn-sm flex-1 text-xs"
          >
            🔧 Fix RCON
          </button>
          
            <button
              title="Debug RCON configuration"
              aria-label="Debug RCON configuration"
              onClick={async () => {
                try {
                  const response = await api.get(`/api/native-servers/${encodeURIComponent(server.name)}/debug-rcon`);
                  if (response.data.success && response.data.debug) {
                    setDebugInfo(response.data.debug);
                    setDebugModalOpen(true);
                  } else {
                    showToast(`❌ Debug failed: ${response.data.message || 'Unknown error'}`, 'error');
                  }
                } catch (error) {
                  const errorMessage = (error as any).response?.data?.message || (error as Error).message || 'Unknown error';
                  showToast(`❌ Debug error: ${errorMessage}`, 'error');
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