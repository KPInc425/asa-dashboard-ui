import React from 'react';
import type { NativeServer } from './types';

interface ServerCardProps {
  server: NativeServer;
  getStatusIcon: (status: string) => string;
  getStatusColor: (status: string) => string;
  onStart: (name: string) => void;
  onStop: (name: string) => void;
  onRestart: (name: string) => void;
  onEdit: (server: NativeServer) => void;
  onDelete: (name: string) => void;
  onViewStartBat: (server: NativeServer) => void;
  onRegenerateStartBat: (name: string) => void;
  onFixRcon: (name: string) => void;
}

const ServerCard: React.FC<ServerCardProps> = ({
  server, getStatusIcon, getStatusColor, onStart, onStop, onRestart, onEdit, onDelete,
  onViewStartBat, onRegenerateStartBat, onFixRcon,
}) => {
  return (
    <div className="bg-base-300 rounded-lg p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base-content">{server.name}</h3>
          {server.type === 'cluster' && <span className="badge badge-primary badge-xs">Cluster</span>}
          {server.type === 'cluster-server' && <span className="badge badge-accent badge-xs">Cluster Server</span>}
          {server.type === 'individual' && <span className="badge badge-secondary badge-xs">Individual Server</span>}
        </div>
        <span className="text-2xl">{getStatusIcon(server.status)}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-base-content/70">Status:</span>
          <span className={getStatusColor(server.status)}>
            {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
          </span>
        </div>
        {server.serverCount && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Servers:</span>
            <span className="badge badge-outline badge-xs">{server.serverCount}</span>
          </div>
        )}
        {server.maps && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Maps:</span>
            <span className="text-xs text-base-content/70 truncate">{server.maps}</span>
          </div>
        )}
        {server.map && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Map:</span>
            <span className="text-xs text-base-content/70">{server.map}</span>
          </div>
        )}
        {server.clusterName && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Cluster:</span>
            <span className="text-xs text-base-content/70">{server.clusterName}</span>
          </div>
        )}
        {server.gamePort && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Port:</span>
            <span className="text-xs text-base-content/70">{server.gamePort}</span>
          </div>
        )}
        {server.ports && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Ports:</span>
            <span className="text-xs text-base-content/70 truncate">{server.ports}</span>
          </div>
        )}
        {server.created && (
          <div className="flex justify-between">
            <span className="text-base-content/70">Created:</span>
            <span className="text-xs">{new Date(server.created).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {server.type === 'cluster' && (
          <>
            <button onClick={() => onStart(server.name)} disabled={server.status === 'running'} className="btn btn-success btn-xs flex-1">▶️ Start Cluster</button>
            <button onClick={() => onStop(server.name)} disabled={server.status === 'stopped'} className="btn btn-error btn-xs flex-1">⏹️ Stop Cluster</button>
            <button onClick={() => onRestart(server.name)} disabled={server.status === 'stopped'} className="btn btn-warning btn-xs flex-1">🔄 Restart Cluster</button>
          </>
        )}
        {server.type === 'cluster-server' && (
          <>
            <button onClick={() => onStart(server.name)} disabled={server.status === 'running'} className="btn btn-success btn-xs flex-1">▶️ Start</button>
            <button onClick={() => onStop(server.name)} disabled={server.status === 'stopped'} className="btn btn-error btn-xs flex-1">⏹️ Stop</button>
            <button onClick={() => onRestart(server.name)} disabled={server.status === 'stopped'} className="btn btn-warning btn-xs flex-1">🔄 Restart</button>
            <button onClick={() => onViewStartBat(server)} className="btn btn-info btn-xs flex-1">📄 Start.bat</button>
            <button onClick={() => onRegenerateStartBat(server.name)} className="btn btn-warning btn-xs flex-1">🔄 Regenerate</button>
            <button onClick={() => onFixRcon(server.name)} className="btn btn-warning btn-xs flex-1">🔧 Fix RCON</button>
          </>
        )}
        {server.type === 'individual' && (
          <>
            <button onClick={() => onStart(server.name)} disabled={server.status === 'running'} className="btn btn-success btn-xs flex-1">▶️ Start</button>
            <button onClick={() => onStop(server.name)} disabled={server.status === 'stopped'} className="btn btn-error btn-xs flex-1">⏹️ Stop</button>
            <button onClick={() => onRestart(server.name)} disabled={server.status === 'stopped'} className="btn btn-warning btn-xs flex-1">🔄 Restart</button>
            <button onClick={() => onEdit(server)} className="btn btn-info btn-xs flex-1">✏️ Edit</button>
          </>
        )}
        {server.type !== 'cluster' && (
          <button onClick={() => onDelete(server.name)} className="btn btn-error btn-xs flex-1" aria-label={`Delete ${server.name}`}>🗑️</button>
        )}
      </div>
    </div>
  );
};

export default ServerCard;
