import React from 'react';
import type { NativeServer } from './types';

interface StartBatModalProps {
  selectedServer: NativeServer | null;
  startBatContent: string;
  setStartBatContent: (content: string) => void;
  setShowStartBatModal: (show: boolean) => void;
  handleUpdateStartBat: () => void;
}

const StartBatModal: React.FC<StartBatModalProps> = ({
  selectedServer, startBatContent, setStartBatContent, setShowStartBatModal, handleUpdateStartBat,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh]">
        <h3 className="font-bold text-lg mb-4">Edit Start.bat - {selectedServer?.name}</h3>
        <div className="space-y-4">
          <div>
            <label className="label"><span className="label-text">Start.bat Content</span></label>
            <textarea className="textarea textarea-bordered w-full font-mono text-sm" rows={20}
              value={startBatContent} onChange={(e) => setStartBatContent(e.target.value)}
              placeholder="@echo off&#10;echo Starting server..." />
          </div>
        </div>
        <div className="modal-action">
          <button onClick={() => setShowStartBatModal(false)} className="btn btn-ghost">Cancel</button>
          <button onClick={handleUpdateStartBat} className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default StartBatModal;
