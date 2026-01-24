import React, { createContext, useContext, useCallback, useState, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType, timeout?: number) => string;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', timeout = 4000) => {
    const id = `${Date.now().toString()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = { id, type, message };
    setToasts(prev => [toast, ...prev]);

    if (timeout > 0) {
      setTimeout(() => removeToast(id), timeout);
    }

    // If this is an assertive/error toast, focus it so screen readers announce immediately.
    if (type === 'error') {
      setTimeout(() => {
        const el = toastRefs.current[id];
        if (el) el.focus();
      }, 50);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Toast container: polite by default; becomes assertive when error toasts exist */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2"
        aria-live={toasts.some(t => t.type === 'error') ? 'assertive' : 'polite'}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            ref={el => { toastRefs.current[t.id] = el; }}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-atomic="true"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Escape' || e.key === 'Esc') removeToast(t.id);
            }}
            className={`toast ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : t.type === 'warning' ? 'toast-warning' : 'toast'}`}>
            <div className="flex items-center space-x-2">
              <span>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                className="ml-2 text-sm px-2 py-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export default ToastContext;
