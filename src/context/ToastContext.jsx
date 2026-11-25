import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = "success") => {
    const id = Date.now();
    setToast({ message, type, id });
    window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 3500);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.type === "error" ? <XCircle size={19} /> : <CheckCircle2 size={19} />}
          <span>{toast.message}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
