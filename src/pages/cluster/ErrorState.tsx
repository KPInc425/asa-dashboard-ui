import { useNavigate } from "react-router-dom";

interface ErrorStateProps {
  error: string | null;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="alert alert-error">
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
          <span>{error || "Cluster not found"}</span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="btn btn-primary mt-4"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
