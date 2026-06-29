/**
 * ServerLogViewer
 *
 * This file is a re-export from the server-log-viewer/ directory.
 * The component has been refactored into smaller focused modules.
 */
export { default } from './server-log-viewer/ServerLogViewer';
export type { ServerLogViewerProps } from './server-log-viewer/types';
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log Level Legend */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-sm">Log Level Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔴</span>
                <span className="text-error">Error</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🟡</span>
                <span className="text-warning">Warning</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔵</span>
                <span className="text-info">Info</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚪</span>
                <span className="text-base-content/50">Debug</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerLogViewer; 