import React from 'react';
import { Link } from 'react-router-dom';
import type { Container } from '../../services';
import { containerNameToServerName } from '../../utils';
import { getStatusColor, getStatusIcon, renderPort, isAsaServer, getMapDisplayName } from './utils';

interface ServerTableRowProps {
  container: Container;
  index: number;
  actionLoading: string | null;
  onAction: (action: 'start' | 'stop' | 'restart', name: string) => void;
  onEdit: (config: any) => void;
  onModManage: () => void;
  onHide: (name: string) => void;
  getServerConfig: (name: string) => any;
}

const ServerTableRow: React.FC<ServerTableRowProps> = ({
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
    <tr
      key={container.name}
      className="transition-all duration-200"
      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
    >
      <td>
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-gradient-to-br from-primary to-accent text-primary-content rounded-full w-10">
              <span className="text-lg">🦖</span>
            </div>
          </div>
          <div>
            <div className="font-bold">{container.name}</div>
            {container.image && (
              <div className="text-sm opacity-50">{container.image}</div>
            )}
          </div>
        </div>
      </td>
      <td>
        <span className="badge badge-outline badge-sm">
          {container.type || 'Container'}
        </span>
      </td>
      <td>
        {container.map ? (
          <span className="text-sm font-medium">{getMapDisplayName(container.map)}</span>
        ) : (
          <span className="text-base-content/50">-</span>
        )}
      </td>
      <td>
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getStatusIcon(container.status)}</span>
          <span className={`badge ${getStatusColor(container.status)}`}>
            {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
          </span>
        </div>
      </td>
      <td>
        {container.ports ? (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(container.ports) ? (
              container.ports.map((port, i) => (
                <span key={i} className="badge badge-outline badge-sm">
                  {renderPort(port as any)}
                </span>
              ))
            ) : (
              <span className="badge badge-outline badge-sm">
                {container.ports}
              </span>
            )}
          </div>
        ) : (
          <span className="text-base-content/50">-</span>
        )}
      </td>
      <td>
        {container.created ? (
          <span className="text-sm text-base-content/70">
            {new Date(container.created).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-base-content/50">-</span>
        )}
      </td>
      <td>
        <div className="flex gap-2">
          <button
            className="btn btn-xs btn-success"
            title="Start Container"
            disabled={container.status === 'running' || actionLoading === container.name}
            onClick={() => onAction('start', container.name)}
          >
            ▶
          </button>
          <button
            className="btn btn-xs btn-warning"
            title="Restart Container"
            disabled={container.status !== 'running' || actionLoading === container.name}
            onClick={() => onAction('restart', container.name)}
          >
            ↻
          </button>
          <button
            className="btn btn-xs btn-error"
            title="Stop Container"
            disabled={container.status !== 'running' || actionLoading === container.name}
            onClick={() => onAction('stop', container.name)}
          >
            ■
          </button>
          <Link
            to={`/servers/${container.name}?tab=logs`}
            className="btn btn-xs btn-info"
            title="View Logs"
          >
            📝
          </Link>
          <Link
            to={`/rcon/${container.name}`}
            className={`btn btn-xs btn-secondary ${
              container.status !== 'running' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}
            title={container.status !== 'running' ? 'Server must be running for RCON' : 'RCON Console'}
            onClick={(e) => { if (container.status !== 'running') e.preventDefault(); }}
          >
            💻
          </Link>
          <Link
            to={`/configs?server=${encodeURIComponent(containerNameToServerName(container.name))}`}
            className="btn btn-xs btn-secondary"
            title="Edit Config"
          >
            ⚙️
          </Link>
          <button
            className="btn btn-xs btn-outline btn-info"
            title="Manage Mods"
            onClick={onModManage}
          >
            🎮
          </button>
          {isAsaServer(container.name) && (
            <button
              className="btn btn-xs btn-outline btn-accent"
              title="Edit Server Configuration"
              onClick={() => onEdit(getServerConfig(container.name))}
            >
              🛠️
            </button>
          )}
          <button
            className="btn btn-xs btn-outline btn-error"
            title="Hide Container"
            onClick={() => onHide(container.name)}
          >
            Hide
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ServerTableRow;
