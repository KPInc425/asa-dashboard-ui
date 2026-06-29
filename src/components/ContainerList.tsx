/**
 * ContainerList
 *
 * This file is a re-export from the container-list/ directory.
 * The component has been refactored into smaller focused modules.
 */
export { default } from './container-list/ContainerList';
export type { Port } from './container-list/types';
                              {renderPort(port as any)}
                            </span>
                          ))
                        ) : (
                          <span className="badge badge-outline badge-xs">
                            {container.ports}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {SYSTEM_LINKS[container.name] && (
                    <div>
                      <a 
                        href={SYSTEM_LINKS[container.name].url} 
                        className="btn btn-xs btn-primary w-full" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {SYSTEM_LINKS[container.name].label}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerList; 