import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ThemedModal from '../components/ThemedModal';

type ConfirmVariant = 'default' | 'confirm' | 'warning' | 'destructive' | 'info';

type ConfirmOptions = {
  confirmText?: string;
  cancelText?: string;
  title?: string;
  variant?: ConfirmVariant;
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

      <ThemedModal 
        isOpen={open} 
        onClose={() => handleClose(false)} 
        onConfirm={() => handleClose(true)}
        title={options?.title || 'Confirm'}
        variant={options?.variant || 'default'}
        confirmText={options?.confirmText || 'OK'}
        cancelText={options?.cancelText || 'Cancel'}
        titleId={titleId}
        descId={descId}
        size="sm"
      >
        <p className="py-2 text-base-content">
          {message}
        </p>
      </ThemedModal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};

export default ConfirmContext;
