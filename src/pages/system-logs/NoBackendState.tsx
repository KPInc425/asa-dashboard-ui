import React from "react";
import { useEnvironment } from "../../contexts/EnvironmentContext";

const NoBackendState: React.FC = () => {
  const { currentEnvironment } = useEnvironment();

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-primary mb-2">System Logs</h1>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{currentEnvironment.name}</h2>
            <p className="text-base-content/70">
              {currentEnvironment.description ||
                "This environment is configured as read-only. System logs are not available without a backend API connection."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoBackendState;
