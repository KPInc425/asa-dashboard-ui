import React from "react";
import { useNavigate } from "react-router-dom";

const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🦖</div>
      <h2 className="text-2xl font-bold text-base-content mb-2">
        Welcome to ASA Management Suite
      </h2>
      <p className="text-base-content/70 mb-6">
        Get started by creating your first ARK server or cluster
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate("/provisioning")}
          className="btn btn-primary"
        >
          Create Server
        </button>
        <button
          onClick={() => navigate("/servers")}
          className="btn btn-outline"
        >
          View Servers
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
