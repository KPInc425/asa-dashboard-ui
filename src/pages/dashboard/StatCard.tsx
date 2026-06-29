import React from "react";

interface StatCardProps {
  bgColor: string;
  icon: string;
  label: string;
  value: string | number;
  valueColor?: string;
  iconSize?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  bgColor,
  icon,
  label,
  value,
  valueColor,
  iconSize = "text-xl",
}) => {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
            >
              <span className={`text-primary-content ${iconSize}`}>{icon}</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-base-content/70">{label}</p>
            <p
              className={`text-2xl font-bold ${valueColor || "text-base-content"}`}
            >
              {value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
