import React, { useState } from 'react';

interface OptimisticButtonProps {
  onClick: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  optimisticText?: string;
  successText?: string;
  errorText?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const OptimisticButton: React.FC<OptimisticButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  optimisticText,
  successText,
  errorText,
  onSuccess,
  onError
}) => {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading || isOptimistic) return;

    setIsOptimistic(true);
    setError(null);
    setIsSuccess(false);

    try {
      await onClick();
      setIsSuccess(true);
      onSuccess?.();
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setIsOptimistic(false);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      
      // Reset error state after 3 seconds
      setTimeout(() => {
        setError(null);
        setIsOptimistic(false);
      }, 3000);
    }
  };

  const getButtonText = () => {
    if (error) return errorText || 'Error';
    if (isSuccess) return successText || 'Success!';
    if (isOptimistic) return optimisticText || 'Processing...';
    return children;
  };

  const getButtonClass = () => {
    let baseClass = `btn btn-${variant} btn-${size}`;
    
    if (isSuccess) {
      baseClass = `btn btn-success btn-${size}`;
    } else if (error) {
      baseClass = `btn btn-error btn-${size}`;
    } else if (isOptimistic) {
      baseClass = `btn btn-warning btn-${size}`;
    }
    
    if (disabled || loading || isOptimistic) {
      baseClass += ' btn-disabled';
    }
    
    return `${baseClass} ${className}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || isOptimistic}
      className={getButtonClass()}
    >
      {(isOptimistic || loading) && (
        <span className="loading loading-spinner loading-xs mr-2"></span>
      )}
      {isSuccess && (
        <span className="mr-2">✅</span>
      )}
      {error && (
        <span className="mr-2">❌</span>
      )}
      {getButtonText()}
    </button>
  );
};

export default OptimisticButton; 