import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (!message) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast({
      id: Date.now(),
      message,
      type,
    });

    timeoutRef.current = setTimeout(() => {
      setToast(null);
      setProgress(100);
      timeoutRef.current = null;
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
    setProgress(100);
  }, []);

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      return;
    }

    const duration = 5000;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, duration - elapsed);
      const pct = (remaining / duration) * 100;
      setProgress(pct);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast]);

  const getToastClasses = () => {
    if (!toast) return '';

    const base =
      'relative overflow-hidden max-w-sm w-full rounded-lg shadow-lg px-4 py-3 text-sm flex items-start gap-2';

    if (toast.type === 'success') {
      return `${base} bg-emerald-500/20 text-emerald-100`;
    }
    if (toast.type === 'error') {
      return `${base} bg-red-500/20 text-red-100`;
    }

    return `${base} bg-slate-800/20 text-slate-100`;
  };

  const getBarClasses = () => {
    if (!toast) return '';

    if (toast.type === 'success') {
      return 'bg-emerald-500';
    }
    if (toast.type === 'error') {
      return 'bg-red-500';
    }

    return 'bg-slate-800';
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={getToastClasses()}>
            <span>{toast.message}</span>
            <div
              className={`absolute left-0 bottom-0 h-1 ${getBarClasses()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
