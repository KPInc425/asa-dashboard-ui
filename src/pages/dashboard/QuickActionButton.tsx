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
      className="panel panel-hover p-4 text-center cursor-pointer w-full h-full flex flex-col items-center justify-center gap-1.5"
    >
      <span className="text-2xl leading-none" aria-hidden="true">{icon}</span>
      <h3 className="font-semibold text-[0.85rem] leading-tight">{title}</h3>
      <p className="text-[0.72rem] text-base-content/70 leading-snug">{description}</p>
    </button>
  );
};

export default QuickActionButton;
