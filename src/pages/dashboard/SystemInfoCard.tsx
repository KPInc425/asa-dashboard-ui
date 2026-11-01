import React from "react";

interface SystemInfoCardProps {
  bgColor: string;
  letter: string;
  label: string;
  value: string;
}

/**
 * System readout tile. Keeps the lettered glyph from the old design but puts it in
 * a bordered keycap instead of a solid coloured block, and gives the value a
 * monospace face so numbers and versions line up across tiles.
 */
const SystemInfoCard: React.FC<SystemInfoCardProps> = ({
  bgColor,
  letter,
  label,
  value,
}) => {
  const key =
    bgColor.includes("success")
      ? "text-success border-success/40"
      : bgColor.includes("error")
        ? "text-error border-error/40"
        : bgColor.includes("secondary")
          ? "text-secondary border-secondary/40"
          : bgColor.includes("info")
            ? "text-info border-info/40"
            : "text-primary border-primary/40";

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid place-items-center w-8 h-8 rounded-lg border bg-black/25 font-mono text-xs font-bold ${key}`}
          aria-hidden="true"
        >
          {letter}
        </span>
        <div className="min-w-0">
          <p className="text-[0.62rem] font-mono uppercase tracking-[0.14em] text-base-content/75">
            {label}
          </p>
          <p className="text-[0.95rem] font-semibold text-base-content truncate font-mono">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemInfoCard;
