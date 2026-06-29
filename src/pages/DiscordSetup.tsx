/**
 * DiscordSetup
 *
 * This file is a re-export from the discord-setup/ directory.
 * The component has been refactored into smaller focused modules.
 */
export { default } from './discord-setup/DiscordSetup';
                </div>
                <div className="modal-action">
                  <button type="button" className="btn" onClick={() => setShowBotConfig(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordSetup; 