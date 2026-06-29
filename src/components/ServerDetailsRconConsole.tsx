/**
 * ServerDetailsRconConsole
 *
 * This file is a re-export from the server-details-rcon-console/ directory.
 * The component has been refactored into smaller focused modules.
 */
export { default } from './server-details-rcon-console/ServerDetailsRconConsole';
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