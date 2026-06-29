import React from "react";

interface LogControlsProps {
  lines: number;
  onLinesChange: (lines: number) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  loading: boolean;
  onRefresh: () => void;
}

const LogControls: React.FC<LogControlsProps> = ({
  lines,
  onLinesChange,
  autoRefresh,
  onAutoRefreshChange,
  loading,
  onRefresh,
}) => (
  <div className="card bg-base-200 shadow-lg">
    <div className="card-body">
      <div className="flex flex-wrap items-center gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Lines</span>
          </label>
          <select
            className="select select-bordered"
            value={lines}
            onChange={(e) => onLinesChange(Number(e.target.value))}
          >
            <option value={50}>50 lines</option>
            <option value={100}>100 lines</option>
            <option value={200}>200 lines</option>
            <option value={500}>500 lines</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Auto Refresh</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
            />
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">&nbsp;</span>
          </label>
          <button
            onClick={onRefresh}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "🔄 Refresh"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default LogControls;
