import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { configApi } from '../services';

interface ServerInfo {
  serverName: string;
  configFiles: string[];
  defaultFiles: string[];
}

// Configs Page: expects ?server=...&file=... query params.
// If file is not provided, the first config file for the selected server will be auto-selected.
// This enables direct linking from other parts of the app.
const Configs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [servers, setServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch servers on mount
  useEffect(() => {
    setIsLoadingServers(true);
    configApi.listServers()
      .then(res => {
        setServers(res.servers || []);
        // Auto-select first server if not set
        const urlServer = searchParams.get('server');
        if (!urlServer && res.servers.length > 0) {
          setSelectedServer(res.servers[0]);
          setSearchParams({ server: res.servers[0] });
        }
      })
      .catch(() => setError('Failed to load servers'))
      .finally(() => setIsLoadingServers(false));
    // eslint-disable-next-line
  }, []);

  // Handle query params for pre-selection
  useEffect(() => {
    const server = searchParams.get('server');
    const file = searchParams.get('file');
    if (server) setSelectedServer(server);
    if (file) setSelectedFile(file);
  }, [searchParams]);

  // Fetch config files when server changes
  useEffect(() => {
    if (!selectedServer) return;
    setIsLoadingFiles(true);
    setConfigFiles([]);
    setSelectedFile(null);
    setFileContent('');
    setError('');
    configApi.listConfigFiles(selectedServer)
      .then(res => {
        setConfigFiles(res.files || []);
        // Auto-select first file if not set
        const urlFile = searchParams.get('file');
        if (!urlFile && res.files.length > 0) {
          setSelectedFile(res.files[0]);
          setSearchParams({ server: selectedServer, file: res.files[0] });
        }
      })
      .catch(() => setError('Failed to load config files'))
      .finally(() => setIsLoadingFiles(false));
    // eslint-disable-next-line
  }, [selectedServer]);

  // Fetch file content when file changes
  useEffect(() => {
    if (!selectedServer || !selectedFile) return;
    setIsLoadingContent(true);
    setFileContent('');
    setError('');
    configApi.getConfigFile(selectedServer, selectedFile)
      .then(res => {
        setFileContent(res.content);
        setHasChanges(false);
      })
      .catch(() => setError('Failed to load config file'))
      .finally(() => setIsLoadingContent(false));
  }, [selectedServer, selectedFile]);

  const handleServerSelect = (server: string) => {
    setSelectedServer(server);
    setSearchParams({ server });
  };
  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    setSearchParams({ server: selectedServer || '', file });
  };
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
      setHasChanges(true);
    }
  };
  const handleSave = async () => {
    if (!selectedServer || !selectedFile) return;
    setIsSaving(true);
    setError('');
    try {
      await configApi.updateConfigFile(selectedServer, fileContent, selectedFile);
      setHasChanges(false);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Config saved!', type: 'success' } }));
    } catch {
      setError('Failed to save config');
    } finally {
      setIsSaving(false);
    }
  };
  const handleReset = () => {
    if (!selectedServer || !selectedFile) return;
    setIsLoadingContent(true);
    setError('');
    configApi.getConfigFile(selectedServer, selectedFile)
      .then(res => {
        setFileContent(res.content);
        setHasChanges(false);
      })
      .catch(() => setError('Failed to reload config file'))
      .finally(() => setIsLoadingContent(false));
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-base-200">
      {/* Servers List */}
      <div className="w-full md:w-1/4 p-4 border-r border-base-300 bg-base-100">
        <h2 className="text-lg font-bold mb-4 text-primary">Servers</h2>
        {isLoadingServers ? (
          <span className="loading loading-spinner loading-md"></span>
        ) : (
          <ul className="space-y-2">
            {servers.map(server => (
              <li key={server}>
                <button
                  className={`btn btn-block btn-sm ${selectedServer === server ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleServerSelect(server)}
                >
                  {server}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Config Files List */}
      <div className="w-full md:w-1/4 p-4 border-r border-base-300 bg-base-100">
        <h2 className="text-lg font-bold mb-4 text-secondary">Config Files</h2>
        {isLoadingFiles ? (
          <span className="loading loading-spinner loading-md"></span>
        ) : configFiles.length > 0 ? (
          <ul className="space-y-2">
            {configFiles.map(file => (
              <li key={file}>
                <button
                  className={`btn btn-block btn-xs ${selectedFile === file ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => handleFileSelect(file)}
                >
                  {file}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-base-content/50">No config files found.</span>
        )}
      </div>
      {/* Monaco Editor Panel */}
      <div className="flex-1 p-4 bg-base-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-accent mb-1">{selectedFile || 'Select a config file'}</h2>
            {selectedServer && selectedFile && (
              <span className="badge badge-outline badge-info mr-2">{selectedServer}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-secondary btn-sm"
              onClick={handleReset}
              disabled={!hasChanges || isLoadingContent}
            >
              Reset
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || isLoadingContent}
            >
              {isSaving ? <span className="loading loading-spinner loading-xs"></span> : 'Save'}
            </button>
          </div>
        </div>
        {error && (
          <div className="alert alert-error mb-2">
            <span>{error}</span>
          </div>
        )}
        <div className="h-[60vh] border border-base-300 rounded-xl overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="ini"
            value={fileContent}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              readOnly: isLoadingContent,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Configs; 