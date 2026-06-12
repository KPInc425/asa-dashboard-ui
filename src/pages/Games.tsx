import React, { useState } from "react";
import GameManager from "../components/GameManager";

const GamesPage: React.FC = () => {
  const [showManager, setShowManager] = useState(true);

  if (!showManager) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Game Types</h2>
          <p className="text-base-content/70 mb-6">
            Manage which game types can be provisioned and managed through this
            dashboard.
          </p>
          <button
            onClick={() => setShowManager(true)}
            className="btn btn-primary"
          >
            Open Game Manager
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <GameManager onClose={() => setShowManager(false)} />
    </div>
  );
};

export default GamesPage;
