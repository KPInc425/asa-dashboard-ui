import React from "react";

interface QuickActionButtonProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="card-body p-4 text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-base-content/70">{description}</p>
      </div>
    </button>
  );
};

export default QuickActionButton;
