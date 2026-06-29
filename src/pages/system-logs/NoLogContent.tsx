import React from "react";

const NoLogContent: React.FC = () => (
  <div className="text-center py-8">
    <div className="text-4xl mb-4">📄</div>
    <h3 className="text-lg font-semibold mb-2">No Log Content</h3>
    <p className="text-base-content/70">
      The selected log file doesn't have any content or couldn't be read.
    </p>
  </div>
);

export default NoLogContent;
