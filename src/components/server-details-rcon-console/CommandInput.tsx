import React from 'react';
import type { RconCommand } from './types';

interface CommandInputProps {
  command: string;
  isLoading: boolean;
  error: string;
  showSuggestions: boolean;
  filteredCommands: RconCommand[];
  selectedSuggestion: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onCommandChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSuggestionClick: (suggestion: RconCommand) => void;
  onQuickCommand: (cmd: string) => void;
}

const CommandInput: React.FC<CommandInputProps> = ({
  command, isLoading, error, showSuggestions, filteredCommands,
  selectedSuggestion, inputRef, onCommandChange, onKeyDown,
  onSubmit, onSuggestionClick, onQuickCommand,
}) => {
  return (
    <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4">
      {error && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="relative">
          <div className="flex items-center space-x-2">
            <span className="text-primary font-bold text-lg">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => onCommandChange(e.target.value)}
              onKeyDown={onKeyDown}
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
                  onClick={() => onSuggestionClick(suggestion)}
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
              onClick={() => onQuickCommand(cmd)}
              className="btn btn-xs btn-outline btn-primary"
            >
              {cmd}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default CommandInput;
