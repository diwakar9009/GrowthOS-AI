import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none no-print">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgClass = "bg-background border";
          let icon = <Info className="h-5 w-5 text-blue-500 shrink-0" />;
          
          if (toast.type === "success") {
            bgClass = "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200";
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
          } else if (toast.type === "error") {
            bgClass = "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-800 dark:text-rose-200";
            icon = <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />;
          } else if (toast.type === "warning") {
            bgClass = "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-800 dark:text-amber-200";
            icon = <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />;
          } else if (toast.type === "info") {
            bgClass = "bg-primary/10 dark:bg-primary/20 border-primary/30 text-primary-900 dark:text-primary-100";
            icon = <Sparkles className="h-5 w-5 text-primary shrink-0" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              layout
              className={`flex items-start gap-3 rounded-xl p-4 shadow-lg backdrop-blur-sm pointer-events-auto border ${bgClass}`}
            >
              {icon}
              <div className="flex-1 text-xs font-semibold select-none">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
