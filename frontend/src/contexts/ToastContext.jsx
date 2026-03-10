import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 5000;

export function ToastProvider({ children }) {
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const clearTimersAndHide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setToast(null);
    setProgress(100);
  }, []);

  const showToast = useCallback((message, type = 'info', durationMs = DEFAULT_DURATION_MS) => {
    if (!message) return;

    clearTimersAndHide();

    setToast({
      id: Date.now(),
      message,
      type,
      durationMs,
    });

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setToast(null);
      setProgress(100);
      timeoutRef.current = null;
    }, durationMs);
  }, [clearTimersAndHide]);

  const hideToast = useCallback(() => {
    clearTimersAndHide();
  }, [clearTimersAndHide]);

  useEffect(() => {
    clearTimersAndHide();
  }, [location.pathname, clearTimersAndHide]);

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      return;
    }

    const duration = toast.durationMs ?? DEFAULT_DURATION_MS;
    const start = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, duration - elapsed);
      const pct = (remaining / duration) * 100;
      setProgress(pct);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [toast]);

  const getToastClasses = () => {
    if (!toast) return '';

    const glass =
      'relative overflow-hidden max-w-sm w-full rounded-xl shadow-xl shadow-black/20 px-4 py-3 text-sm flex items-start gap-2 backdrop-blur-xl border border-white/10';

    if (toast.type === 'success') {
      return `${glass} bg-emerald-500/25 text-emerald-100`;
    }
    if (toast.type === 'error') {
      return `${glass} bg-red-500/25 text-red-100`;
    }

    return `${glass} bg-slate-800/25 text-slate-100`;
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