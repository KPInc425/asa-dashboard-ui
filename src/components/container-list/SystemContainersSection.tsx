import React from 'react';
import type { Container } from '../../services';
import { SYSTEM_LINKS } from './constants';
import { getStatusColor, getStatusIcon, renderPort } from './utils';

interface SystemContainersSectionProps {
  systemContainers: Container[];
  onHide: (name: string) => void;
}

const SystemContainersSection: React.FC<SystemContainersSectionProps> = ({ systemContainers, onHide }) => {
  return (
    <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">System Containers</h2>

      <div className="hidden lg:block overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Container</th>
              <th>Status</th>
              <th>Ports</th>
              <th>Links</th>
              <th>Hide</th>
            </tr>
          </thead>
          <tbody>
            {systemContainers.map((container) => (
              <tr key={container.name}>
                <td>{container.name}</td>
                <td>{getStatusIcon(container.status)} {container.status}</td>
                <td>
                  {container.ports ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(container.ports) ? (
                        container.ports.map((port, i) => (
                          <span key={i} className="badge badge-outline badge-sm">{renderPort(port as any)}</span>
                        ))
                      ) : (
                        <span className="badge badge-outline badge-sm">{container.ports}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-base-content/50">-</span>
                  )}
                </td>
                <td>
                  {SYSTEM_LINKS[container.name] ? (
                    <a href={SYSTEM_LINKS[container.name].url} className="btn btn-xs btn-primary" target="_blank" rel="noopener noreferrer">
                      {SYSTEM_LINKS[container.name].label}
                    </a>
                  ) : (
                    <span className="text-base-content/50">-</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-xs btn-outline btn-error" onClick={() => onHide(container.name)}>Hide</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-4">
        {systemContainers.map((container) => (
          <div key={container.name} className="bg-base-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-base-content">{container.name}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{getStatusIcon(container.status)}</span>
                  <span className={`badge ${getStatusColor(container.status)}`}>
                    {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                  </span>
                </div>
              </div>
              <button className="btn btn-xs btn-outline btn-error" onClick={() => onHide(container.name)}>Hide</button>
            </div>
            {container.ports && (
              <div className="mb-3">
                <div className="text-sm text-base-content/70 mb-1">Ports:</div>
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
            {SYSTEM_LINKS[container.name] && (
              <a href={SYSTEM_LINKS[container.name].url} className="btn btn-xs btn-primary" target="_blank" rel="noopener noreferrer">
                {SYSTEM_LINKS[container.name].label}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemContainersSection;
