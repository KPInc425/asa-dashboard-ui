import React from "react";
import { useNavigate } from "react-router-dom";
import type { Cluster } from "./types";

interface ClusterListProps {
  clusters: Cluster[];
  importLoading: boolean;
  importError: string | null;
  importSuccess: string | null;
  handleImportClick: () => void;
  getClusterStatus: (cluster: Cluster) => string;
}

const ClusterList: React.FC<ClusterListProps> = ({
  clusters,
  importLoading,
  importError,
  importSuccess,
  handleImportClick,
  getClusterStatus,
}) => {
  const navigate = useNavigate();

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h3 className="card-title">Clusters ({clusters.length})</h3>
        <div className="mb-3 flex flex-wrap gap-2 items-center">
          <button
            className="btn btn-outline btn-info"
            onClick={handleImportClick}
            disabled={importLoading}
          >
            {importLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "⬆️ Import/Restore Cluster"
            )}
          </button>
          {importError && (
            <div className="alert alert-error mt-2">
              <span>{importError}</span>
            </div>
          )}
          {importSuccess && (
            <div className="alert alert-success mt-2">
              <span>{importSuccess}</span>
            </div>
          )}
        </div>
        {clusters.length === 0 ? (
          <p className="text-base-content/70">No clusters found</p>
        ) : (
          <div className="space-y-3">
            {clusters.map((cluster) => (
              <div
                key={cluster.name}
                className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{cluster.name}</h4>
                  <p className="text-sm text-base-content/70">
                    {getClusterStatus(cluster)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/clusters/${encodeURIComponent(cluster.name)}`,
                    )
                  }
                  className="btn btn-ghost btn-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterList;
