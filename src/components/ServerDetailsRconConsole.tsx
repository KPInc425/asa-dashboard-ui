import React, { useState, useEffect, useRef } from 'react';
import { containerApi, type RconResponse } from '../services';
import yaml from 'js-yaml';
import socketService from '../services/socket';

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

interface ChatMessage {
  timestamp: Date;
  message: string;
  sender?: string;
  optimistic?: boolean; // Added for optimistic updates
}

interface ServerDetailsRconConsoleProps {
  serverName: string;
}

const ServerDetailsRconConsole: React.FC<ServerDetailsRconConsoleProps> = ({ serverName }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filteredCommands, setFilteredCommands] = useState<RconCommand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [rconCommands, setRconCommands] = useState<RconCommand[]>([]);
  const [activeView, setActiveView] = useState<'console' | 'chat'>('console');
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load RCON commands from YAML file
  useEffect(() => {
    const loadRconCommands = async () => {
      try {
        const response = await fetch('/rconCommands.yml');
        if (response.ok) {
          const yamlText = await response.text();
          const data = yaml.load(yamlText) as RconCommandsData;
          setRconCommands(data.rcon_commands || []);
        } else {
          console.warn('Could not load RCON commands YAML file');
          // Fallback to basic commands
          setRconCommands([
            { name: 'listplayers', syntax: 'listplayers', description: 'List all online players', category: 'Server & Player Management' },
            { name: 'saveworld', syntax: 'saveworld', description: 'Force a world save', category: 'Server & Player Management' },
            { name: 'broadcast', syntax: 'broadcast <message>', description: 'Send a message to all players', category: 'Chat & Messaging' },
            { name: 'GetChat', syntax: 'GetChat', description: 'Retrieve the latest chat buffer', category: 'Chat & Messaging' },
            { name: 'ServerChat', syntax: 'ServerChat <message>', description: 'Send a global chat message', category: 'Chat & Messaging' },
          ]);
        }
      } catch (error) {
        console.error('Error loading RCON commands:', error);
        setRconCommands([]);
      }
    };

    loadRconCommands();
  }, []);

  // Listen for chat:update events from Socket.IO for this server
  useEffect(() => {
    if (activeView !== 'chat') return;
    console.log('[ChatView] useEffect: subscribing to chat:update for', serverName);
    console.log('[ChatView] Socket connected:', socketService.isConnected());
    const handleChatUpdate = (data: { serverName: string; messages: any[] }) => {
      console.log('[ChatView] Received chat:update event for', data.serverName, data);
      if (data.serverName === serverName) {
        setChatMessages(prev => {
          // Remove optimistic messages that are now present in the server log
          const canonical = data.messages.map(m => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            optimistic: false
          }));
          // Keep optimistic messages that are not in the canonical log
          const optimistic = prev.filter(
            m => m.optimistic && !canonical.some(c => c.message === m.message && c.sender !== 'You')
          );
          return [...canonical, ...optimistic];
        });
      }
    };
    socketService.onCustomEvent('chat:update', handleChatUpdate);
    return () => {
      console.log('[ChatView] Unsubscribing from chat:update for', serverName);
      socketService.offCustomEvent('chat:update', handleChatUpdate);
    };
  }, [activeView, serverName]);

  useEffect(() => {
    console.log('[ChatView] Mounted for server', serverName);
  }, []);

  // Load command history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`rcon_history_${serverName}`);
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
  }, [serverName]);

  // Save command history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(`rcon_history_${serverName}`, JSON.stringify(history.slice(-100)));
    }
  }, [history, serverName]);

  useEffect(() => {
    if (consoleRef.current && activeView === 'console') {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
    if (chatRef.current && activeView === 'chat') {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [history, chatMessages, activeView]);

  const executeCommand = async (cmd: string): Promise<RconResponse> => {
    try {
      let response: RconResponse;
      try {
        response = await containerApi.sendNativeRconCommand(serverName, cmd);
      } catch (nativeError) {
        try {
          response = await containerApi.sendRconCommand(serverName, cmd);
        } catch (containerError) {
          throw new Error(`RCON connection failed. Server may not be running or RCON may not be configured.`);
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Only allow sending chat messages in chat view
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !serverName) return;

    setIsLoading(true);
    setError('');

    try {
      // Always send as ServerChat <message>
      await executeCommand(`ServerChat ${command}`);
      const now = new Date();
      setChatMessages(prev => [
        ...prev,
        {
          timestamp: now,
          sender: 'You',
          message: command.trim(),
          optimistic: true
        }
      ]);
      setCommand('');
      // No need to fetchChatMessages; backend will push update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send chat message';
      setError(errorMessage);
      setCommand('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !serverName) return;

    setIsLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const response = await executeCommand(command);
      
      const newEntry: CommandHistory = {
        command: command,
        response: response.response || response.message,
        timestamp: new Date(),
        success: response.success
      };

      setHistory(prev => [...prev, newEntry]);
      setCommand('');
      setHistoryIndex(-1);

      // No need to fetchChatMessages; backend will push update
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
    } else if (e.key === 'Tab' || (e.key === 'Enter' && showSuggestions)) {
      if (showSuggestions && filteredCommands.length > 0) {
        e.preventDefault();
        const selectedCmd = filteredCommands[selectedSuggestion];
        setCommand(selectedCmd.syntax);
        setShowSuggestions(false);
        setSelectedSuggestion(0);
        
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
      ).slice(0, 10);
      
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
    localStorage.removeItem(`rcon_history_${serverName}`);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeView === 'console' ? 'tab-active' : ''}`}
            onClick={() => setActiveView('console')}
          >
            🖥️ Console
          </button>
          <button
            className={`tab ${activeView === 'chat' ? 'tab-active' : ''}`}
            onClick={() => {
              setActiveView('chat');
              // fetchChatMessages(); // Now handled by useEffect
            }}
          >
            💬 Chat
          </button>
        </div>
      </div>

      {/* Console/Chat Output */}
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl flex-1 flex flex-col" style={{ minHeight: '400px' }}>
        <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-300/50">
          <div className="flex items-center space-x-3">
            <h4 className="text-lg font-semibold text-primary">
              {activeView === 'console' ? '🖥️ Console Window' : '💬 Chat Messages'}
            </h4>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-base-content/70">
              {activeView === 'console' ? `${history.length} commands` : `${chatMessages.length} messages`}
            </span>
            <button
              onClick={activeView === 'console' ? clearHistory : clearChat}
              className="btn btn-sm btn-outline btn-error"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {activeView === 'console' ? (
          <div
            ref={consoleRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-3 bg-black/90 text-green-400"
            style={{ minHeight: '300px' }}
          >
            {history.length === 0 ? (
              <div className="text-center py-12 text-green-400/60">
                <div className="text-4xl mb-4">💻</div>
                <p className="text-lg">Console Ready</p>
                <p className="text-sm">Type a command below to get started</p>
                <div className="mt-4 text-xs text-green-400/40">
                  <p>• Use ↑↓ arrow keys to navigate command history</p>
                  <p>• Press Tab to use command suggestions</p>
                  <p>• Type to see auto-complete suggestions</p>
                </div>
              </div>
            ) : (
              <div className="bg-base-200 rounded-lg p-2 mb-2 max-h-80 overflow-y-auto">
                {history.map((entry, index) => (
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
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            ref={chatRef}
            className="flex-1 p-4 overflow-y-auto space-y-2 bg-base-100"
            style={{ minHeight: '300px' }}
          >
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-base-content/50">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg">No chat messages</p>
                <p className="text-sm">Chat will update automatically</p>
              </div>
            ) : (
              <div className="bg-base-200 rounded-lg p-2 mb-2 max-h-80 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-2 rounded hover:bg-base-200">
                    <span className="text-xs text-base-content/50 min-w-[60px]">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="font-semibold text-primary min-w-[100px]">
                      {msg.sender}:
                    </span>
                    <span className="text-base-content flex-1">
                      {msg.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Command Input */}
      <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4">
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {activeView === 'console' ? (
          <form onSubmit={handleCommandSubmit}>
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
              {showSuggestions && (
                <div className="absolute top-full left-8 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
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
            <div className="flex flex-wrap gap-2 mt-3">
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
        ) : (
          <form onSubmit={handleChatSubmit}>
            <div className="relative">
              <div className="flex items-center space-x-2">
                <span className="text-primary font-bold text-lg">💬</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter chat message..."
                  className="input input-bordered flex-1"
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServerDetailsRconConsole; 