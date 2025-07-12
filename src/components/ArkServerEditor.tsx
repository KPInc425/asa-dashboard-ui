import { useState, useEffect } from 'react';
import { environmentApi } from '../services';
import PasswordInput from './PasswordInput';

interface ArkServerFormData {
  name: string;
  containerName: string;
  image: string;
  gamePort: string;
  rconPort: string;
  serverName: string;
  mapName: string;
  serverPassword: string;
  adminPassword: string;
  maxPlayers: string;
  mods: string[];
  additionalArgs: string;
}

interface ArkServerEditorProps {
  server?: any;
  onSave: () => void;
  onCancel: () => void;
}

const ArkServerEditor = ({ server, onSave, onCancel }: ArkServerEditorProps) => {
  const [formData, setFormData] = useState<ArkServerFormData>({
    name: '',
    containerName: '',
    image: 'mschnitzer/asa-linux-server:latest',
    gamePort: '7777',
    rconPort: '32330',
    serverName: '',
    mapName: 'TheIsland',
    serverPassword: '',
    adminPassword: 'admin123',
    maxPlayers: '70',
    mods: [],
    additionalArgs: ''
  });

  const [availableMods, setAvailableMods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const mapOptions = [
    { value: 'TheIsland', label: 'The Island' },
    { value: 'TheCenter', label: 'The Center' },
    { value: 'ScorchedEarth', label: 'Scorched Earth' },
    { value: 'Aberration', label: 'Aberration' },
    { value: 'Extinction', label: 'Extinction' },
    { value: 'Genesis', label: 'Genesis' },
    { value: 'Genesis2', label: 'Genesis Part 2' },
    { value: 'LostIsland', label: 'Lost Island' },
    { value: 'Fjordur', label: 'Fjordur' },
    { value: 'CrystalIsles', label: 'Crystal Isles' },
    { value: 'Ragnarok', label: 'Ragnarok' },
    { value: 'Valguero', label: 'Valguero' }
  ];

  useEffect(() => {
    loadMods();
    if (server) {
      // Parse existing server configuration
      parseServerConfig(server);
    }
  }, [server]);

  const loadMods = async () => {
    try {
      const modsData = await environmentApi.getMods();
      setAvailableMods(modsData.mods);
    } catch (err) {
      console.error('Failed to load mods:', err);
    }
  };

  const parseServerConfig = (serverConfig: any) => {
    // This is a simplified parser - in a real implementation, you'd want more robust parsing
    const lines = serverConfig.lines;
    let parsedData: Partial<ArkServerFormData> = {
      name: serverConfig.name.replace('asa-server-', ''), // Remove prefix for display
      containerName: serverConfig.name,
      image: 'mschnitzer/asa-linux-server:latest',
      gamePort: '7777',
      rconPort: '32330',
      serverName: '',
      mapName: 'TheIsland',
      serverPassword: '',
      adminPassword: 'admin123',
      maxPlayers: '70',
      mods: [],
      additionalArgs: ''
    };

    lines.forEach((line: string) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('container_name:')) {
        parsedData.containerName = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('image:')) {
        parsedData.image = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.includes('7777:7777')) {
        const portMatch = trimmedLine.match(/"(\d+):7777"/);
        if (portMatch) {
          parsedData.gamePort = portMatch[1];
        }
      } else if (trimmedLine.includes('32330:32330')) {
        const portMatch = trimmedLine.match(/"(\d+):32330"/);
        if (portMatch) {
          parsedData.rconPort = portMatch[1];
        }
      } else if (trimmedLine.startsWith('- SERVER_NAME=')) {
        parsedData.serverName = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('- MAP_NAME=')) {
        parsedData.mapName = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('- SERVER_PASSWORD=')) {
        parsedData.serverPassword = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('- ADMIN_PASSWORD=')) {
        parsedData.adminPassword = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('- MAX_PLAYERS=')) {
        parsedData.maxPlayers = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('- MODS=')) {
        const modsString = trimmedLine.split('=')[1];
        parsedData.mods = modsString ? modsString.split(',') : [];
      } else if (trimmedLine.startsWith('- ADDITIONAL_ARGS=')) {
        parsedData.additionalArgs = trimmedLine.split('=')[1];
      }
    });

    setFormData(prev => ({ ...prev, ...parsedData }));
  };

  const handleInputChange = (field: keyof ArkServerFormData, value: string | string[]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate container name when server name changes
      if (field === 'name' && typeof value === 'string') {
        const baseName = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const containerName = baseName.startsWith('asa-server-') ? baseName : `asa-server-${baseName}`;
        newData.containerName = containerName;
      }
      
      return newData;
    });
  };

  const handleModToggle = (modId: string) => {
    setFormData(prev => ({
      ...prev,
      mods: prev.mods.includes(modId)
        ? prev.mods.filter(id => id !== modId)
        : [...prev.mods, modId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (server) {
        await environmentApi.updateArkServer(server.name, formData);
      } else {
        await environmentApi.addArkServer(formData);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {server ? 'Edit ARK Server' : 'Add New ARK Server'}
          </h2>
          <button
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Server Name *</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input input-bordered w-full"
                placeholder="theisland"
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Container Name</span>
                <span className="label-text-alt text-info">Auto-generated</span>
              </label>
              <input
                type="text"
                value={formData.containerName}
                onChange={(e) => handleInputChange('containerName', e.target.value)}
                className="input input-bordered w-full"
                placeholder="asa-server-theisland"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Docker Image</span>
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                className="input input-bordered w-full"
                placeholder="ark:latest"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Map</span>
              </label>
              <select
                value={formData.mapName}
                onChange={(e) => handleInputChange('mapName', e.target.value)}
                className="select select-bordered w-full"
              >
                {mapOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Game Port</span>
              </label>
              <input
                type="number"
                value={formData.gamePort}
                onChange={(e) => handleInputChange('gamePort', e.target.value)}
                className="input input-bordered w-full"
                placeholder="7777"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">RCON Port</span>
              </label>
              <input
                type="number"
                value={formData.rconPort}
                onChange={(e) => handleInputChange('rconPort', e.target.value)}
                className="input input-bordered w-full"
                placeholder="32330"
              />
            </div>
          </div>

          {/* Server Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Display Name</span>
              </label>
              <input
                type="text"
                value={formData.serverName}
                onChange={(e) => handleInputChange('serverName', e.target.value)}
                className="input input-bordered w-full"
                placeholder="My ARK Server"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Server Password</span>
              </label>
              <PasswordInput
                value={formData.serverPassword}
                onChange={(value) => handleInputChange('serverPassword', value)}
                placeholder="Leave empty for public server"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Admin Password</span>
              </label>
              <PasswordInput
                value={formData.adminPassword}
                onChange={(value) => handleInputChange('adminPassword', value)}
                placeholder="admin123"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Max Players</span>
              </label>
              <input
                type="number"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', e.target.value)}
                className="input input-bordered w-full"
                placeholder="70"
                min="1"
                max="100"
              />
            </div>
          </div>

          {/* Mods Selection */}
          <div>
            <label className="label">
              <span className="label-text">Mods</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3">
              {availableMods.map((mod) => (
                <div
                  key={mod.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.mods.includes(mod.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                  onClick={() => handleModToggle(mod.id)}
                >
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.mods.includes(mod.id)}
                      onChange={() => handleModToggle(mod.id)}
                      className="checkbox checkbox-primary checkbox-sm mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{mod.name}</h4>
                      <p className="text-xs text-base-content/70">{mod.description}</p>
                      <p className="text-xs text-base-content/50">by {mod.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Configuration */}
          <div>
            <label className="label">
              <span className="label-text">Additional Arguments</span>
            </label>
            <input
              type="text"
              value={formData.additionalArgs}
              onChange={(e) => handleInputChange('additionalArgs', e.target.value)}
              className="input input-bordered w-full"
              placeholder="-servergamelog -nosteam"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Saving...
                </>
              ) : (
                server ? 'Update Server' : 'Add Server'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArkServerEditor; 