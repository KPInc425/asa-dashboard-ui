import React from "react";

interface StatCardProps {
  bgColor: string;
  icon: string;
  label: string;
  value: string | number;
  valueColor?: string;
  iconSize?: string;
}

/**
 * Instrument tile: a labelled readout with a status LED, not a coloured slab.
 * The bgColor prop is still accepted so callers do not change, but the colour is
 * now used as the tile's accent (LED + value), which keeps the dashboard readable
 * when four tiles sit side by side.
 */
const StatCard: React.FC<StatCardProps> = ({
  bgColor,
  icon,
  label,
  value,
  valueColor,
  iconSize = "text-xl",
}) => {
  const accent = valueColor || "text-base-content";
  const led = bgColor.includes("success")
    ? "led led-on"
    : bgColor.includes("error")
      ? "led led-off"
      : bgColor.includes("secondary")
        ? "led led-idle"
        : "led led-warn";

  return (
    <div className="panel panel-hover p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={led} aria-hidden="true" />
        <span className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-base-content/80">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className={`readout text-5xl ${accent}`}>{value}</span>
        <span className={`${iconSize} opacity-60`} aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
