import type { Cluster } from "./types";

interface NewServer {
  name: string;
  map: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
  maxPlayers: number;
  adminPassword: string;
  serverPassword: string;
}

interface AvailableMap {
  name: string;
  displayName: string;
}

interface AddServerModalProps {
  cluster: Cluster | null;
  newServer: NewServer;
  isCustomMap: boolean;
  customMapName: string;
  availableMaps: AvailableMap[];
  onServerChange: (server: NewServer) => void;
  onCustomMapChange: (isCustom: boolean) => void;
  onCustomMapNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const AddServerModal: React.FC<AddServerModalProps> = ({
  cluster,
  newServer,
  isCustomMap,
  customMapName,
  availableMaps,
  onServerChange,
  onCustomMapChange,
  onCustomMapNameChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">
          ➕ Add Server to {cluster?.name}
        </h3>
        <p className="text-xs text-base-content/60 mb-4">
          Configure the new server. Ports are auto-incremented from the highest
          existing ports.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Server Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="MyServer"
                value={newServer.name}
                onChange={(e) =>
                  onServerChange({ ...newServer, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Map</span>
              </label>
              <select
                className="select select-bordered select-sm w-full"
                value={isCustomMap ? "__custom__" : newServer.map}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    onCustomMapChange(true);
                    onServerChange({
                      ...newServer,
                      map: customMapName || "CustomMap",
                    });
                  } else {
                    onCustomMapChange(false);
                    onServerChange({ ...newServer, map: e.target.value });
                  }
                }}
              >
                {availableMaps.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.displayName}
                  </option>
                ))}
                <option value="__custom__">Custom Map...</option>
              </select>
              {isCustomMap && (
                <input
                  type="text"
                  className="input input-bordered input-sm w-full mt-2"
                  placeholder="Enter exact map name (e.g., MyCustomMap)"
                  value={customMapName}
                  onChange={(e) => {
                    onCustomMapNameChange(e.target.value);
                    onServerChange({
                      ...newServer,
                      map: e.target.value || "CustomMap",
                    });
                  }}
                />
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Game Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={newServer.gamePort}
                onChange={(e) =>
                  onServerChange({
                    ...newServer,
                    gamePort: parseInt(e.target.value) || 7777,
                  })
                }
                min={1024}
                max={65535}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Query Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={newServer.queryPort}
                onChange={(e) =>
                  onServerChange({
                    ...newServer,
                    queryPort: parseInt(e.target.value) || 27015,
                  })
                }
                min={1024}
                max={65535}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">RCON Port</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={newServer.rconPort}
                onChange={(e) =>
                  onServerChange({
                    ...newServer,
                    rconPort: parseInt(e.target.value) || 32330,
                  })
                }
                min={1024}
                max={65535}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Max Players</span>
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={newServer.maxPlayers}
                onChange={(e) =>
                  onServerChange({
                    ...newServer,
                    maxPlayers: parseInt(e.target.value) || 70,
                  })
                }
                min={1}
                max={255}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Admin Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered input-sm w-full"
                placeholder="admin123"
                value={newServer.adminPassword}
                onChange={(e) =>
                  onServerChange({
                    ...newServer,
                    adminPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Server Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered input-sm w-full"
                placeholder="(optional)"
                value={newServer.serverPassword}
                onChange={(e) =>
                  onServerChange({
                    ...newServer,
                    serverPassword: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              ➕ Add Server
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServerModal;
