import React from "react";
import type { GameDefinition } from "../../types/games";

interface GameListProps {
  games: GameDefinition[];
  loading: boolean;
  officialCount: number;
  customCount: number;
  onEdit: (game: GameDefinition) => void;
  onDelete: (game: GameDefinition) => void;
  onAdd: () => void;
}

const GameList: React.FC<GameListProps> = ({
  games, loading, officialCount, customCount, onEdit, onDelete, onAdd,
}) => {
  return (
    <>
      <button onClick={onAdd} className="btn btn-primary btn-sm mb-4">
        ➕ Add New Game
      </button>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner"></span>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-1">
          <div className="text-sm text-base-content/70 mb-2">
            {games.length} games ({officialCount} built-in, {customCount} custom)
          </div>
          {games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{game.name}</span>
                  <span className="text-xs text-base-content/50 font-mono">{game.id}</span>
                  {!game.dynamic && <span className="badge badge-xs badge-ghost">built-in</span>}
                </div>
                <div className="text-xs text-base-content/50 mt-0.5">
                  {game.binaryName} · {game.configFiles.join(", ").substring(0, 60)}
                  {game.configFiles.join(", ").length > 60 ? "..." : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {game.dynamic && (
                  <button
                    onClick={() => onDelete(game)}
                    className="btn btn-ghost btn-xs text-error"
                    title="Delete game"
                  >
                    🗑️
                  </button>
                )}
                {game.dynamic ? (
                  <button
                    onClick={() => onEdit(game)}
                    className="btn btn-ghost btn-xs"
                    title="Edit game"
                  >
                    ✏️
                  </button>
                ) : (
                  <span className="text-xs text-base-content/30 italic">built-in</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GameList;
