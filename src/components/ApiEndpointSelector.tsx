import React, { useState, useEffect } from 'react';

interface ApiEndpointSelectorProps {
  onEndpointChange?: (endpoint: string) => void;
}

const ApiEndpointSelector: React.FC<ApiEndpointSelectorProps> = ({ onEndpointChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  // const { logout } = useAuth(); // Available if needed for logout on endpoint change

  // Load current endpoint from localStorage
  useEffect(() => {
    const currentEndpoint = localStorage.getItem('api_endpoint') || import.meta.env.VITE_API_URL || '/';
    setEndpoint(currentEndpoint);
  }, []);

  const validateEndpoint = (url: string): boolean => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `http://${url}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleEndpointChange = (newEndpoint: string) => {
    setEndpoint(newEndpoint);
    setIsValid(validateEndpoint(newEndpoint));
    setTestResult(null);
  };

  const testEndpoint = async () => {
    if (!isValid) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const testUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${testUrl}/health`, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: `Server responded with status: ${response.status}` });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveEndpoint = () => {
    if (!isValid) return;
    
    const normalizedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    localStorage.setItem('api_endpoint', normalizedEndpoint);
    
    // Notify parent component
    onEndpointChange?.(normalizedEndpoint);
    
    // Show success message
    setTestResult({ success: true, message: 'API endpoint saved successfully!' });
    
    // Close modal after a short delay
    setTimeout(() => {
      setIsOpen(false);
      setTestResult(null);
    }, 1500);
  };

  const resetToDefault = () => {
    const defaultEndpoint = import.meta.env.VITE_API_URL || '/';
    setEndpoint(defaultEndpoint);
    setIsValid(true);
    setTestResult(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-sm btn-outline btn-ghost"
        title="Configure API Endpoint"
      >
        🔗 API
      </button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Configure API Endpoint</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Backend API URL</span>
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:4000 or IP:PORT"
                  className={`input input-bordered w-full ${!isValid ? 'input-error' : ''}`}
                  value={endpoint}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                />
                {!isValid && (
                  <label className="label">
                    <span className="label-text-alt text-error">Please enter a valid URL</span>
                  </label>
                )}
              </div>

              <div className="text-sm text-base-content/70">
                <p>Current endpoint: <code className="bg-base-300 px-1 rounded">{endpoint}</code></p>
                <p className="mt-2">This will be used for all API communications. Changes require a page reload.</p>
              </div>

              {testResult && (
                <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={testEndpoint}
                  disabled={!isValid || isTesting}
                  className="btn btn-sm btn-outline"
                >
                  {isTesting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '🧪 Test Connection'
                  )}
                </button>
                <button
                  onClick={resetToDefault}
                  className="btn btn-sm btn-outline"
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => {
                  setIsOpen(false);
                  setTestResult(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!isValid}
                onClick={saveEndpoint}
              >
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiEndpointSelector; 