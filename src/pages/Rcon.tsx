import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ServerDetailsRconConsole from '../components/ServerDetailsRconConsole';

interface CardServer {
  name: string;
  status: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual' | string;
  type: 'container' | 'native' | 'cluster' | 'cluster-server' | 'individual';
  map?: string;
  clusterName?: string;
}

const RconPage: React.FC = () => {
  const [servers, setServers] = useState<CardServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<CardServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/native-servers');
        if (response.data && Array.isArray(response.data.servers)) {
          const mappedServers = response.data.servers.map((s: any) => ({
            ...s,
            type: (s.type === 'native' || s.type === 'cluster' || s.type === 'container' || s.type === 'cluster-server' || s.type === 'individual') ? s.type : 'native',
          })) as CardServer[];
          setServers(mappedServers);
        } else {
          setError('Failed to load servers');
        }
      } catch (err) {
        setError('Failed to load servers');
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  // Minimal card for RCON selection
  const renderServerCard = (server: CardServer) => (
    <div
      key={server.name}
      className={`bg-base-200 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex flex-col items-center justify-center p-6 min-h-[160px] relative ${selectedServer?.name === server.name ? 'ring-2 ring-primary' : ''}`}
      onClick={() => setSelectedServer(server)}
    >
      <div className="font-bold text-primary text-lg mb-2 text-center">{server.name}</div>
      <span className={`badge mb-4 ${server.status === 'running' ? 'badge-success' : server.status === 'stopped' ? 'badge-error' : 'badge-outline'}`}>{server.status.charAt(0).toUpperCase() + server.status.slice(1)}</span>
      <button
        className="btn btn-primary btn-md w-full mt-auto"
        onClick={e => {
          e.stopPropagation();
          setSelectedServer(server);
        }}
      >
        Open RCON/Chat
      </button>
    </div>
  );

  // Custom list for RCON selection
  const renderServerList = () => (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Server</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {servers.map(server => (
            <tr
              key={server.name}
              className={selectedServer?.name === server.name ? 'ring-2 ring-primary' : ''}
              onClick={() => setSelectedServer(server)}
              style={{ cursor: 'pointer' }}
            >
              <td>{server.name}</td>
              <td>
                <span className={`badge ${server.status === 'running' ? 'badge-success' : server.status === 'stopped' ? 'badge-error' : 'badge-outline'}`}>{server.status.charAt(0).toUpperCase() + server.status.slice(1)}</span>
              </td>
              <td>
                <button
                  className="btn btn-primary btn-xs"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedServer(server);
                  }}
                >
                  Open RCON/Chat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">RCON Console & Chat</h1>
      <p className="mb-4 text-base-content/70">Select a server to open its RCON console and chat view.</p>
      <div className="mb-4 flex gap-2 items-center">
        <span className="text-sm text-base-content/60">View mode:</span>
        <button
          className={`btn btn-xs ${viewMode === 'cards' ? 'btn-active' : 'btn-outline'}`}
          onClick={() => setViewMode('cards')}
        >
          Cards
        </button>
        <button
          className={`btn btn-xs ${viewMode === 'list' ? 'btn-active' : 'btn-outline'}`}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
      </div>
      {loading ? (
        <div className="text-base-content/60">Loading servers...</div>
      ) : error ? (
        <div className="text-error">{error}</div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
              {servers.map(renderServerCard)}
            </div>
          ) : (
            <div className="mb-6">{renderServerList()}</div>
          )}
        </>
      )}
      {selectedServer && (
        <div className="mt-8">
          <ServerDetailsRconConsole serverName={selectedServer.name} />
        </div>
      )}
    </div>
  );
};

export default RconPage; 