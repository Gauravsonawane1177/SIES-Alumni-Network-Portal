import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function push(message, type = 'info') {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }

  const value = useMemo(
    () => ({
      info: (m) => push(m, 'info'),
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error')
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg ${
              t.type === 'error'
                ? 'bg-red-700 text-white'
                : t.type === 'success'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-maroon-800 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
