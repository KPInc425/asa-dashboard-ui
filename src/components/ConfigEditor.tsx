import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ConfigEditorProps {
  onClose: () => void;
}

interface ConfigVariable {
  value: string;
  isSensitive?: boolean;
  isSafe?: boolean;
}

interface ConfigData {
  config: Record<string, string | ConfigVariable>;
  mode: string;
  safeVars?: string[];
  hasAdminRights?: boolean;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ onClose }) => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [editingConfig, setEditingConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFullConfig, setShowFullConfig] = useState(false);
  const [restartAfterSave, setRestartAfterSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = showFullConfig ? '/api/configs/full' : '/api/configs';
      const response = await api.get(endpoint);
      
      if (response.success) {
        setConfig(response);
        
        // Initialize editing config with current values
        const initialEditing: Record<string, string> = {};
        Object.entries(response.config).forEach(([key, value]) => {
          if (typeof value === 'string') {
            initialEditing[key] = value;
          } else if (value && typeof value === 'object' && 'value' in value) {
            initialEditing[key] = value.value;
          }
        });
        setEditingConfig(initialEditing);
      } else {
        setError('Failed to load configuration');
      }
    } catch (err) {
      setError('Failed to load configuration');
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await api.put('/api/configs', {
        config: editingConfig,
        restart: restartAfterSave
      });

      if (response.success) {
        alert(response.message);
        onClose();
      } else {
        setError(response.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await api.post('/api/restart');

      if (response.success) {
        alert('API restart initiated successfully');
      } else {
        setError(response.message || 'Failed to restart API');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restart API');
      console.error('Error restarting API:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setEditingConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isVariableEditable = (key: string): boolean => {
    if (!config) return false;
    
    if (showFullConfig) {
      // In full config mode, only allow editing safe variables
      const variable = config.config[key] as ConfigVariable;
      return variable?.isSafe === true;
    } else {
      // In whitelisted mode, all variables are editable
      return true;
    }
  };

  const getVariableDisplayValue = (key: string, value: string | ConfigVariable): string => {
    if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object' && 'value' in value) {
      return value.value;
    }
    return '';
  };

  const isVariableSensitive = (key: string): boolean => {
    if (!config) return false;
    
    if (showFullConfig) {
      const variable = config.config[key] as ConfigVariable;
      return variable?.isSensitive === true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-red-600">Failed to load configuration</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configuration Editor</h2>
          <div className="flex gap-2">
            {config.hasAdminRights && (
              <button
                onClick={() => {
                  setShowFullConfig(!showFullConfig);
                  setTimeout(loadConfig, 100);
                }}
                className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                {showFullConfig ? 'Show Safe Only' : 'Show Full Config'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <strong>Mode:</strong> {config.mode} | 
            <strong> Safe Variables:</strong> {config.safeVars?.length || 0} |
            {config.hasAdminRights && <span className="text-green-600"> <strong>Admin Rights</strong></span>}
          </p>
          {showFullConfig && (
            <p className="text-sm text-orange-600 mt-1">
              <strong>Warning:</strong> Full configuration mode shows all variables. Only safe variables can be edited.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-4">
          {Object.entries(config.config).map(([key, value]) => {
            const displayValue = getVariableDisplayValue(key, value);
            const editable = isVariableEditable(key);
            const sensitive = isVariableSensitive(key);
            
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-medium text-gray-700">
                  {key}
                  {sensitive && <span className="text-red-500 ml-1">*</span>}
                  {!editable && <span className="text-gray-400 ml-1">(read-only)</span>}
                </label>
                <input
                  type={sensitive ? 'password' : 'text'}
                  value={editingConfig[key] || displayValue}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  disabled={!editable}
                  className={`flex-1 px-3 py-2 border rounded ${
                    editable 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'border-gray-200 bg-gray-100 text-gray-500'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={restartAfterSave}
              onChange={(e) => setRestartAfterSave(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Restart API after saving</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          
          {config.hasAdminRights && (
            <button
              onClick={handleRestart}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              {saving ? 'Restarting...' : 'Restart API'}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>

        {sensitive && (
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Variables marked with * are sensitive and should be handled with care.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigEditor; 