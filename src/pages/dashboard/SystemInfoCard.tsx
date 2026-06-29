import React from "react";

interface SystemInfoCardProps {
  bgColor: string;
  letter: string;
  label: string;
  value: string;
}

const SystemInfoCard: React.FC<SystemInfoCardProps> = ({
  bgColor,
  letter,
  label,
  value,
}) => {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}
            >
              <span className="text-primary-content text-sm font-medium">
                {letter}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-base-content/70">{label}</p>
            <p className="text-lg font-semibold text-base-content">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemInfoCard;
