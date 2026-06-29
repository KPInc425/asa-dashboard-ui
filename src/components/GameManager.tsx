/**
 * GameManager
 *
 * This file is a re-export from the game-manager/ directory.
 * The component has been refactored into smaller focused modules.
 */
export { default } from './game-manager/GameManager';
export type { GameManagerProps } from './game-manager/types';
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(game)}
                          className="btn btn-ghost btn-xs text-base-content/50"
                          title="View configuration (built-in)"
                        >
                          👁️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameManager;
