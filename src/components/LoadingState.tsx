import React from 'react';

interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingText?: string;
  errorText?: string;
  showSpinner?: boolean;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  onRetry,
  children,
  loadingText = 'Loading...',
  errorText = 'An error occurred',
  showSpinner = true,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          {showSpinner && (
            <div className="loading loading-spinner loading-lg mb-4"></div>
          )}
          <p className="text-base-content/70">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`alert alert-error ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <span>{errorText}: {error}</span>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-sm btn-outline ml-2">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState; 