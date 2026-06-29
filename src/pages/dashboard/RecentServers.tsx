import React from "react";
import { useNavigate } from "react-router-dom";
import type { NativeServer } from "./types";

interface RecentServersProps {
  servers: NativeServer[];
  getStatusColor: (status: string) => string;
}

const RecentServers: React.FC<RecentServersProps> = ({
  servers,
  getStatusColor,
}) => {
  const navigate = useNavigate();

  if (servers.length === 0) return null;

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">Recent Servers</h2>
          <button
            onClick={() => navigate("/servers")}
            className="btn btn-primary btn-sm"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {servers.slice(0, 3).map((server) => (
            <div
              key={server.name}
              className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-secondary-content text-sm">🖥️</span>
                </div>
                <div>
                  <h3 className="font-medium">{server.name}</h3>
                  <p className={`text-sm ${getStatusColor(server.status)}`}>
                    {server.status.charAt(0).toUpperCase() +
                      server.status.slice(1)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/servers/${server.name}`)}
                className="btn btn-ghost btn-xs"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentServers;
