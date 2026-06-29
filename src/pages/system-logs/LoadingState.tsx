import React from "react";

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="loading loading-spinner loading-lg mb-4"></div>
      <p className="text-base-content/70">Loading system logs...</p>
    </div>
  </div>
);

export default LoadingState;
