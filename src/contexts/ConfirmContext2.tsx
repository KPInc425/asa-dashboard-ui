import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import AccessibleModal from '../components/AccessibleModal';

type ConfirmOptions = {
  confirmText?: string;
  cancelText?: string;
  title?: string;
};

type ConfirmContextType = {
  showConfirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<ConfirmOptions | undefined>(undefined);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);
  const idRef = useRef<string>(`confirm-${Math.random().toString(36).slice(2, 9)}`);

  const showConfirm = useCallback((msg: string, opts?: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setMessage(msg);
      setOptions(opts);
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (resolver) resolver(result);
    setOpen(false);
    setMessage('');
    setOptions(undefined);
    setResolver(null);
  };

  const titleId = `confirm-title-${idRef.current}`;
  const descId = `confirm-desc-${idRef.current}`;

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}

      <AccessibleModal isOpen={open} onClose={() => handleClose(false)} titleId={titleId} descId={descId}>
        {options?.title && (
          <h3 id={titleId} className="font-bold text-lg">
            {options.title}
          </h3>
        )}
        <p id={descId} className="py-4">
          {message}
        </p>
        <div className="modal-action" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => handleClose(false)}>{options?.cancelText || 'Cancel'}</button>
          <button className="btn btn-primary" onClick={() => handleClose(true)}>{options?.confirmText || 'OK'}</button>
        </div>
      </AccessibleModal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};

export default ConfirmContext;
