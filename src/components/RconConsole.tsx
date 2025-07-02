import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { containerApi, type RconResponse } from '../services';

interface CommandHistory {
  command: string;
  response: string;
  timestamp: Date;
  success: boolean;
}

const RconConsole = () => {
  const { containerName } = useParams<{ containerName: string }>();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filteredHistory, setFilteredHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Common ARK commands for auto-completion
  const commonCommands = [
    'listplayers',
    'saveworld',
    'shutdown',
    'broadcast',
    'kickplayer',
    'banplayer',
    'teleportplayer',
    'giveitem',
    'spawndino',
    'destroywilddinos',
    'settimeofday',
    'setplayerpos',
    'cheat fly',
    'cheat walk',
    'cheat god',
    'cheat infinitestats',
    'admincheat setplayerpos',
    'admincheat teleport',
    'admincheat summon',
    'admincheat destroy'
  ];

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !containerName) return;

    setIsLoading(true);
    setError('');

    try {
      const response: RconResponse = await containerApi.sendRconCommand(containerName, command);
      
      const newEntry: CommandHistory = {
        command: command,
        response: response.response || response.message,
        timestamp: new Date(),
        success: response.success
      };

      setHistory(prev => [...prev, newEntry]);
      setCommand('');
      setHistoryIndex(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex].command);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (filteredHistory.length > 0) {
        setCommand(filteredHistory[0]);
        setShowSuggestions(false);
      }
    }
  };

  const handleCommandChange = (value: string) => {
    setCommand(value);
    setHistoryIndex(-1);
    
    if (value.trim()) {
      const filtered = commonCommands.filter(cmd => 
        cmd.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredHistory(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredHistory([]);
      setShowSuggestions(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getLogLevelColor = (response: string) => {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('error') || lowerResponse.includes('failed')) {
      return 'text-error';
    }
    if (lowerResponse.includes('warning')) {
      return 'text-warning';
    }
    if (lowerResponse.includes('success') || lowerResponse.includes('saved')) {
      return 'text-success';
    }
    return 'text-base-content';
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="ark-slide-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">RCON Console</h1>
              <p className="text-base-content/70">
                Remote Console for {containerName}
              </p>
            </div>
            <Link
              to="/containers"
              className="btn btn-outline btn-primary ark-hover-glow"
            >
              ← Back to Servers
            </Link>
          </div>
        </div>

        {/* Console Output */}
        <div className="ark-glass rounded-xl flex-1 flex flex-col ark-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h2 className="text-lg font-semibold text-primary">Console Output</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-base-content/70">
                {history.length} commands
              </span>
              <button
                onClick={clearHistory}
                className="btn btn-sm btn-outline btn-error ark-hover-glow"
              >
                Clear
              </button>
            </div>
          </div>

          <div 
            ref={consoleRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-2"
            style={{ minHeight: '400px' }}
          >
            {history.length === 0 ? (
              <div className="text-center py-12 text-base-content/50">
                <div className="text-4xl mb-4">💬</div>
                <p>No commands executed yet</p>
                <p className="text-sm">Start by typing a command below</p>
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-primary font-bold">$</span>
                    <span className="text-accent">{entry.command}</span>
                    <span className="text-base-content/30 text-xs">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`ml-4 ${getLogLevelColor(entry.response)}`}>
                    {entry.response.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex}>{line}</div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Command Input */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleCommandSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error ark-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center space-x-2">
                <span className="text-primary font-bold text-lg">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => handleCommandChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter RCON command..."
                  className="input input-bordered flex-1 font-mono ark-hover-scale"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !command.trim()}
                  className="btn btn-primary ark-gradient-primary ark-hover-glow"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>

              {/* Command Suggestions */}
              {showSuggestions && filteredHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-base-300 border border-base-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredHistory.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setCommand(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-base-200 text-sm font-mono"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Commands */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-base-content/70 mr-2">Quick commands:</span>
              {['listplayers', 'saveworld', 'broadcast', 'kickplayer'].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => setCommand(cmd)}
                  className="btn btn-xs btn-outline btn-primary ark-hover-glow"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="ark-glass rounded-xl p-4 ark-slide-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-semibold text-primary mb-3">Common Commands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-accent mb-2">Player Management</h4>
              <ul className="space-y-1 text-base-content/70">
                <li><code>listplayers</code> - List all online players</li>
                <li><code>kickplayer &lt;steamid&gt;</code> - Kick a player</li>
                <li><code>banplayer &lt;steamid&gt;</code> - Ban a player</li>
                <li><code>teleportplayer &lt;steamid&gt; &lt;x&gt; &lt;y&gt; &lt;z&gt;</code> - Teleport player</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-accent mb-2">Server Management</h4>
              <ul className="space-y-1 text-base-content/70">
                <li><code>saveworld</code> - Save the current world</li>
                <li><code>shutdown</code> - Shutdown the server</li>
                <li><code>broadcast &lt;message&gt;</code> - Send message to all players</li>
                <li><code>destroywilddinos</code> - Remove all wild dinosaurs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RconConsole; 