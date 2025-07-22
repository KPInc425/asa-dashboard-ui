import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ServerDetailsRconConsole from '../components/ServerDetailsRconConsole';

interface Server {
  name: string;
  status: string;
  type: string;
  map?: string;
  clusterName?: string;
}

const RconPage: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/native-servers');
        if (response.data && Array.isArray(response.data.servers)) {
          setServers(response.data.servers);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">RCON Console & Chat</h1>
      <p className="mb-4 text-base-content/70">Select a server to open its RCON console and chat view.</p>
      {loading ? (
        <div className="text-base-content/60">Loading servers...</div>
      ) : error ? (
        <div className="text-error">{error}</div>
      ) : (
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Select Server:</label>
          <select
            className="select select-bordered w-full max-w-md"
            value={selectedServer?.name || ''}
            onChange={e => {
              const server = servers.find(s => s.name === e.target.value) || null;
              setSelectedServer(server);
            }}
          >
            <option value="" disabled>Select a server...</option>
            {servers.map(server => (
              <option key={server.name} value={server.name}>
                {server.name} {server.map ? `(${server.map})` : ''} {server.clusterName ? `- ${server.clusterName}` : ''}
              </option>
            ))}
          </select>
        </div>
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