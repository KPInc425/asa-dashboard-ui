import React from "react";

interface ErrorStateProps {
  error: string | null;
  onBack: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onBack }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error || "Server not found"}</span>
        </div>
        <button onClick={onBack} className="btn btn-primary">
          ← Back to Servers
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
