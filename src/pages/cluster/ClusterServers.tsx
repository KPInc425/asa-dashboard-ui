import { useNavigate } from "react-router-dom";
import { getStatusColor } from "./utils";
import type { Cluster } from "./types";

interface ClusterServersProps {
  cluster: Cluster;
  onAddServer: () => void;
  onServerBackup: (serverName: string) => void;
  onServerRestore: (serverName: string) => void;
}

const ClusterServers: React.FC<ClusterServersProps> = ({
  cluster,
  onAddServer,
  onServerBackup,
  onServerRestore,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="card-title">Cluster Servers</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/70">
            {cluster.config?.servers?.length || 0} servers
          </span>
          <button
            onClick={onAddServer}
            className="btn btn-primary btn-sm"
          >
            ➕ Add Server
          </button>
        </div>
      </div>

      {cluster.config?.servers && cluster.config.servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cluster.config.servers.map(
            (server: {
              name: string;
              status: string;
              map: string;
              gamePort: number;
              queryPort: number;
              rconPort: number;
            }) => (
              <div
                key={server.name}
                className="card bg-base-200 hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="card-title text-lg">{server.name}</h3>
                    <span
                      className={`badge ${getStatusColor(server.status)}`}
                    >
                      {server.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Map:</span>
                      <span>{server.map}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Port:</span>
                      <span>{server.gamePort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Query:</span>
                      <span>{server.queryPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">RCON:</span>
                      <span>{server.rconPort}</span>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button
                      onClick={() => navigate(`/servers/${server.name}`)}
                      className="btn btn-primary btn-sm"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => onServerBackup(server.name)}
                      className="btn btn-outline btn-secondary btn-sm"
                    >
                      🗄️ Backup
                    </button>
                    <button
                      onClick={() => onServerRestore(server.name)}
                      className="btn btn-outline btn-warning btn-sm"
                    >
                      ♻️ Restore
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-base-content/50">
          <div className="text-4xl mb-4">🖥️</div>
          <p className="text-lg">No servers in this cluster</p>
          <p className="text-sm mb-4">
            Add your first server to get started
          </p>
          <button
            onClick={onAddServer}
            className="btn btn-primary"
          >
            ➕ Add Your First Server
          </button>
        </div>
      )}
    </div>
  );
};

export default ClusterServers;
