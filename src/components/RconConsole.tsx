import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { containerApi, type RconResponse } from '../services';
import yaml from 'js-yaml';

interface CommandHistory {
  command: string;
  response: string;
  timestamp: Date;
  success: boolean;
}

interface RconCommand {
  name: string;
  syntax: string;
  description: string;
  category: string;
}

interface RconCommandsData {
  rcon_commands: RconCommand[];
}

const RconConsole = () => {
  const { containerName } = useParams<{ containerName: string }>();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filteredCommands, setFilteredCommands] = useState<RconCommand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [rconCommands, setRconCommands] = useState<RconCommand[]>([]);
  const [commandsByCategory, setCommandsByCategory] = useState<Record<string, RconCommand[]>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load RCON commands from YAML file
  useEffect(() => {
    const loadRconCommands = async () => {
      try {
        const response = await fetch('/rconCommands.yml');
        if (response.ok) {
          const yamlText = await response.text();
          const data = yaml.load(yamlText) as RconCommandsData;
          setRconCommands(data.rcon_commands || []);
          
          // Group commands by category
          const categories: Record<string, RconCommand[]> = {};
          data.rcon_commands.forEach(cmd => {
            if (!categories[cmd.category]) {
              categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
          });
          setCommandsByCategory(categories);
        } else {
          console.warn('Could not load RCON commands YAML file');
          // Fallback to basic commands
          setRconCommands([
            { name: 'listplayers', syntax: 'listplayers', description: 'List all online players', category: 'Server & Player Management' },
            { name: 'saveworld', syntax: 'saveworld', description: 'Force a world save', category: 'Server & Player Management' },
            { name: 'broadcast', syntax: 'broadcast <message>', description: 'Send a message to all players', category: 'Server & Player Management' },
            { name: 'kickplayer', syntax: 'kickplayer <SteamID>', description: 'Kick a player from the server', category: 'Server & Player Management' }
          ]);
        }
      } catch (error) {
        console.error('Error loading RCON commands:', error);
        // Use fallback commands
        setRconCommands([]);
      }
    };

    loadRconCommands();
  }, []);

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`rcon_history_${containerName}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })));
      } catch (error) {
        console.error('Error loading command history:', error);
      }
    }
  }, [containerName]);

  // Save command history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(`rcon_history_${containerName}`, JSON.stringify(history.slice(-100))); // Keep last 100 commands
    }
  }, [history, containerName]);

  // Enhanced auto-scroll functionality
  useEffect(() => {
    const scrollToBottom = (element: HTMLElement) => {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    };

    if (consoleRef.current) {
      scrollToBottom(consoleRef.current);
    }
  }, [history]);

  // Additional scroll trigger for new messages
  useEffect(() => {
    const scrollToBottom = (element: HTMLElement) => {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    };

    // Auto-scroll when new messages are added
    if (consoleRef.current && history.length > 0) {
      scrollToBottom(consoleRef.current);
    }
  }, [history.length]);

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
    setShowSuggestions(false);

    try {
      // Try native server RCON first, fallback to container RCON
      let response: RconResponse;
      try {
        response = await containerApi.sendNativeRconCommand(containerName, command);
      } catch (nativeError) {
        console.warn('Native RCON failed, trying container RCON:', nativeError);
        try {
          response = await containerApi.sendRconCommand(containerName, command);
        } catch (containerError) {
          console.error('Both RCON methods failed:', { nativeError, containerError });
          throw new Error(`RCON connection failed. Server may not be running or RCON may not be configured.`);
        }
      }
      
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to send command';
      setError(errorMessage);
      
      const newEntry: CommandHistory = {
        command: command,
        response: errorMessage,
        timestamp: new Date(),
        success: false
      };
      setHistory(prev => [...prev, newEntry]);
      setCommand('');
      setHistoryIndex(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredCommands.length > 0) {
        setSelectedSuggestion(prev => Math.max(0, prev - 1));
      } else if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredCommands.length > 0) {
        setSelectedSuggestion(prev => Math.min(filteredCommands.length - 1, prev + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex].command);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (showSuggestions && filteredCommands.length > 0) {
        e.preventDefault();
        const selectedCmd = filteredCommands[selectedSuggestion];
        setCommand(selectedCmd.syntax);
        setShowSuggestions(false);
        setSelectedSuggestion(0);
        
        // Focus input and position cursor after command name
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const spaceIndex = selectedCmd.syntax.indexOf(' ');
            if (spaceIndex !== -1) {
              inputRef.current.setSelectionRange(spaceIndex + 1, selectedCmd.syntax.length);
            }
          }
        }, 0);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(0);
    }
  };

  const handleCommandChange = (value: string) => {
    setCommand(value);
    setHistoryIndex(-1);
    
    if (value.trim()) {
      const filtered = rconCommands.filter(cmd => 
        cmd.name.toLowerCase().includes(value.toLowerCase()) ||
        cmd.description.toLowerCase().includes(value.toLowerCase()) ||
        cmd.syntax.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions
      
      setFilteredCommands(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestion(0);
    } else {
      setFilteredCommands([]);
      setShowSuggestions(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`rcon_history_${containerName}`);
  };

  const getCommandsByCategory = (category: string) => {
    if (category === 'all') {
      return rconCommands;
    }
    return commandsByCategory[category] || [];
  };

  const categories = Object.keys(commandsByCategory);

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-primary mb-2">RCON Console</h1>
              <p className="text-sm md:text-base text-base-content/70">
                Remote Console for {containerName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="btn btn-outline btn-info btn-sm"
              >
                {showHelp ? '📖 Hide Help' : '❓ Show Help'}
              </button>
              <Link
                to="/containers"
                className="btn btn-outline btn-primary btn-sm hover:shadow-lg hover:shadow-primary/25"
              >
                ← Back to Servers
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        {showHelp && (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Category Filter */}
              <div className="lg:w-1/4">
                <h3 className="text-lg font-semibold text-primary mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`btn btn-sm w-full ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    All Commands ({rconCommands.length})
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`btn btn-sm w-full text-left ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {category} ({commandsByCategory[category].length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Commands List */}
              <div className="lg:w-3/4">
                <h3 className="text-lg font-semibold text-primary mb-3">
                  {selectedCategory === 'all' ? 'All Commands' : selectedCategory}
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {getCommandsByCategory(selectedCategory).map((cmd, index) => (
                    <div key={index} className="bg-base-300 p-3 rounded border-l-4 border-accent">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-bold text-primary">{cmd.name}</code>
                        <button
                          onClick={() => {
                            setCommand(cmd.syntax);
                            setShowHelp(false);
                            inputRef.current?.focus();
                          }}
                          className="btn btn-xs btn-accent"
                        >
                          Use
                        </button>
                      </div>
                      <p className="text-xs text-base-content/70 mb-2">{cmd.description}</p>
                      <code className="text-xs bg-base-100 px-2 py-1 rounded inline-block">
                        {cmd.syntax}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Console Output */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-300/50">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-primary">🖥️ Console Window</h2>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-base-content/70">
                {history.length} messages
              </span>
              <button
                onClick={clearHistory}
                className="btn btn-sm btn-outline btn-error hover:shadow-lg hover:shadow-error/25"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          <div
            ref={consoleRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-3 bg-black/90 text-green-400"
            style={{ minHeight: '400px', maxHeight: '500px' }}
          >
            {history.length === 0 ? (
              <div className="text-center py-12 text-green-400/60">
                <div className="text-4xl mb-4">💻</div>
                <p className="text-lg">Console Ready</p>
                <p className="text-sm">Type a command below to get started</p>
                <div className="mt-4 text-xs text-green-400/40">
                  <p>• Use ↑↓ arrow keys to navigate command history</p>
                  <p>• Press Tab or Enter to use command suggestions</p>
                  <p>• Type to see auto-complete suggestions</p>
                </div>
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2 bg-blue-900/30 p-2 rounded border-l-4 border-blue-500">
                    <span className="text-blue-400 font-bold">$</span>
                    <span className="text-yellow-400 font-medium">{entry.command}</span>
                    <span className="text-blue-400/50 text-xs">
                      [{entry.timestamp.toLocaleTimeString()}]
                    </span>
                  </div>
                  
                  <div className={`ml-4 p-2 rounded border-l-4 ${
                    entry.success 
                      ? 'bg-green-900/30 border-green-500 text-green-400' 
                      : 'bg-red-900/30 border-red-500 text-red-400'
                  }`}>
                    {entry.response.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="text-sm">
                        {line || '\u00A0'}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Command Input */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4">
          <form onSubmit={handleCommandSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
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
                  className="input input-bordered flex-1 font-mono"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !command.trim()}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>

              {/* Command Suggestions */}
              {showSuggestions && filteredCommands.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-8 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {filteredCommands.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setCommand(suggestion.syntax);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-base-200 border-l-4 ${
                        index === selectedSuggestion ? 'bg-base-200 border-primary' : 'border-transparent'
                      }`}
                    >
                      <div className="font-mono text-sm font-bold text-primary">{suggestion.name}</div>
                      <div className="text-xs text-base-content/70 mb-1">{suggestion.description}</div>
                      <div className="text-xs font-mono bg-base-300 px-2 py-1 rounded inline-block">
                        {suggestion.syntax}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Commands */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-base-content/70 mr-2">Quick commands:</span>
              {['listplayers', 'saveworld', 'broadcast', 'destroywilddinos'].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => setCommand(cmd)}
                  className="btn btn-xs btn-outline btn-primary"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RconConsole; 