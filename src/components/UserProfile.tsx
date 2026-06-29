/**
 * UserProfile
 *
 * This file is a re-export from the user-profile/ directory.
 * The component has been refactored into smaller focused modules.
 */
export { default } from './user-profile/UserProfile';
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-base-content/70">No specific permissions assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Login History */}
              {currentUser.security?.lastLogin && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">Last Login</h3>
                    <p className="text-base-content/70">
                      {new Date(currentUser.security.lastLogin).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 