import React from 'react';
import { Link } from 'react-router-dom';
import type { Container } from '../../services';
import { containerNameToServerName } from '../../utils';
import { getStatusColor, getStatusIcon, renderPort, isAsaServer, getMapDisplayName } from './utils';

interface ServerCardProps {
  container: Container;
  index: number;
  actionLoading: string | null;
  onAction: (action: 'start' | 'stop' | 'restart', name: string) => void;
  onEdit: (config: any) => void;
  onModManage: () => void;
  onHide: (name: string) => void;
  getServerConfig: (name: string) => any;
}

const ServerCard: React.FC<ServerCardProps> = ({
  container,
  index,
  actionLoading,
  onAction,
  onEdit,
  onModManage,
  onHide,
  getServerConfig,
}) => {
  return (
    <div
      key={container.name}
      className="bg-base-300 rounded-lg p-4 hover:scale-105 transition-all duration-200"
      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-gradient-to-br from-primary to-accent text-primary-content rounded-full w-10">
              <span className="text-lg">🦖</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-base-content">{container.name}</div>
            {container.image && <div className="text-sm opacity-50">{container.image}</div>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getStatusIcon(container.status)}</span>
          <span className={`badge ${getStatusColor(container.status)}`}>
            {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {container.type && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/70">Type:</span>
            <span className="text-base-content/70">{container.type}</span>
          </div>
        )}
        {container.map && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/70">Map:</span>
            <span className="text-base-content/70">{getMapDisplayName(container.map)}</span>
          </div>
        )}
        {container.ports && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/70">Ports:</span>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(container.ports) ? (
                container.ports.map((port, i) => (
                  <span key={i} className="badge badge-outline badge-xs">{renderPort(port as any)}</span>
                ))
              ) : (
                <span className="badge badge-outline badge-xs">{container.ports}</span>
              )}
            </div>
          </div>
        )}
        {container.created && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/70">Created:</span>
            <span className="text-base-content/70">{new Date(container.created).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="btn btn-xs btn-success" disabled={container.status === 'running' || actionLoading === container.name} onClick={() => onAction('start', container.name)}>▶ Start</button>
        <button className="btn btn-xs btn-warning" disabled={container.status !== 'running' || actionLoading === container.name} onClick={() => onAction('restart', container.name)}>↻ Restart</button>
        <button className="btn btn-xs btn-error" disabled={container.status !== 'running' || actionLoading === container.name} onClick={() => onAction('stop', container.name)}>■ Stop</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Link to={`/servers/${container.name}?tab=logs`} className="btn btn-xs btn-info">📝 Logs</Link>
        <Link to={`/rcon/${container.name}`} className={`btn btn-xs btn-secondary ${container.status !== 'running' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`} onClick={(e) => { if (container.status !== 'running') e.preventDefault(); }}>💻 RCON</Link>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Link to={`/configs?server=${encodeURIComponent(containerNameToServerName(container.name))}`} className="btn btn-xs btn-secondary">⚙️ Config</Link>
        <button className="btn btn-xs btn-outline btn-info" onClick={onModManage}>🎮 Mods</button>
      </div>

      {isAsaServer(container.name) && (
        <div className="mt-2">
          <button className="btn btn-xs btn-outline btn-accent w-full" onClick={() => onEdit(getServerConfig(container.name))}>🛠️ Edit Server Config</button>
        </div>
      )}

      <div className="mt-2">
        <button className="btn btn-xs btn-outline btn-error w-full" onClick={() => onHide(container.name)}>Hide Container</button>
      </div>
    </div>
  );
};

export default ServerCard;
