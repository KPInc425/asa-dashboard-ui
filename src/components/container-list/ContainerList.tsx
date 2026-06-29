import React from 'react';
import { useContainerList } from './useContainerList';
import StatsSummary from './StatsSummary';
import ServerTableRow from './ServerTableRow';
import ServerCard from './ServerCard';
import BulkActions from './BulkActions';
import SystemContainersSection from './SystemContainersSection';
import { getStatusColor, getStatusIcon } from './utils';

const ContainerList: React.FC = () => {
  const {
    containers,
    systemContainers,
    isLoading,
    error,
    actionLoading,
    showHidden,
    hidden,
    isAddingServer,
    isEditingServer,
    showModManager,
    navigate,
    setShowHidden,
    setIsAddingServer,
    setIsEditingServer,
    setSelectedServer,
    setShowModManager,
    fetchContainers,
    handleHide,
    handleUnhide,
    handleAction,
    getServerConfig,
  } = useContainerList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-base-content/70">Loading servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">Server Management</h1>
              <p className="text-sm sm:text-base text-base-content/70">Control your ARK: Survival Ascended servers</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setIsAddingServer(true)} className="btn btn-primary btn-sm">Add New Server</button>
            </div>
          </div>
        </div>

        {/* Toggle hidden containers */}
        <div className="mb-4">
          <label className="cursor-pointer label">
            <span className="label-text">Show hidden containers</span>
            <input type="checkbox" className="toggle toggle-primary ml-2" checked={showHidden} onChange={() => { setShowHidden(!showHidden); fetchContainers(); }} />
          </label>
        </div>

        {/* Hidden containers list */}
        {showHidden && hidden.length > 0 && (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">Hidden Containers</h2>
            <ul>
              {hidden.map(name => (
                <li key={name} className="flex items-center justify-between mb-1">
                  <span>{name}</span>
                  <button className="btn btn-xs btn-outline btn-success ml-2" onClick={() => handleUnhide(name)}>Unhide</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <StatsSummary containers={containers} />

        {/* Server List */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.2s' }}>
          {containers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-base-content/70 mb-4">No servers found</p>
              <p className="text-sm text-base-content/50">Start by creating your first ARK server</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Server</th>
                      <th>Type</th>
                      <th>Map</th>
                      <th>Status</th>
                      <th>Ports</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {containers.map((container, index) => (
                      <ServerTableRow
                        key={container.name}
                        container={container}
                        index={index}
                        actionLoading={actionLoading}
                        onAction={handleAction}
                        onEdit={(config) => { setSelectedServer(config); setIsEditingServer(true); }}
                        onModManage={() => setShowModManager(true)}
                        onHide={handleHide}
                        getServerConfig={getServerConfig}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {containers.map((container, index) => (
                  <ServerCard
                    key={container.name}
                    container={container}
                    index={index}
                    actionLoading={actionLoading}
                    onAction={handleAction}
                    onEdit={(config) => { setSelectedServer(config); setIsEditingServer(true); }}
                    onModManage={() => setShowModManager(true)}
                    onHide={handleHide}
                    getServerConfig={getServerConfig}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {containers.length > 0 && <BulkActions containers={containers} onAction={handleAction} />}

        {systemContainers.length > 0 && <SystemContainersSection systemContainers={systemContainers} onHide={handleHide} />}
      </div>
    </div>
  );
};

export default ContainerList;
