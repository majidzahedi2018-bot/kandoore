// src/components/common/ToastSystem.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();
let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolver = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => removeToast(id), 3200);
  }, [removeToast]);

  const toast = {
    success: (m) => pushToast(m, 'success'),
    error: (m) => pushToast(m, 'error'),
    warning: (m) => pushToast(m, 'warning'),
    info: (m) => pushToast(m, 'info'),
  };

  // جایگزین برندسازی‌شده window.confirm با خروجی Promise
  const confirmAction = useCallback(({ title, message, confirmLabel = 'تأیید', cancelLabel = 'انصراف', danger = false }) => {
    return new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({ title, message, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const closeConfirm = (result) => {
    if (confirmResolver.current) confirmResolver.current(result);
    confirmResolver.current = null;
    setConfirmState(null);
  };

  const typeStyles = {
    success: { border: 'border-emerald-400', bg: 'bg-emerald-50/95', text: 'text-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-600' },
    error:   { border: 'border-red-400',     bg: 'bg-red-50/95',     text: 'text-red-800',     icon: AlertCircle,   iconColor: 'text-red-600' },
    warning: { border: 'border-amber-400',   bg: 'bg-amber-50/95',   text: 'text-amber-800',   icon: AlertTriangle, iconColor: 'text-amber-600' },
    info:    { border: 'border-[#0E8388]',   bg: 'bg-[#E0F4F5]/95',  text: 'text-[#0E8388]',   icon: Info,          iconColor: 'text-[#0E8388]' },
  };

  return (
    <ToastContext.Provider value={{ toast, confirmAction }}>
      {children}
      {/* ─── پشته Toast بالای صفحه (بالاتر از همه مودال‌ها) ─── */}
      <div className="fixed top-3 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none max-w-md mx-auto px-4">
        {toasts.map(t => {
          const s = typeStyles[t.type] || typeStyles.success;
          const Icon = s.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => removeToast(t.id)}
              className={`pointer-events-auto w-full flex items-center gap-2.5 p-3 rounded-2xl border-2 shadow-lg backdrop-blur-md text-right toast-animate ${s.bg} ${s.border}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${s.iconColor}`} />
              <span className={`flex-1 text-[11px] font-black leading-relaxed ${s.text}`}>{t.message}</span>
              <X className={`w-3.5 h-3.5 shrink-0 ${s.iconColor}`} />
            </button>
          );
        })}
      </div>
      {/* ─── مودال تأیید برندسازی‌شده ─── */}
      {confirmState && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 border-2 border-[#D4AF37] shadow-2xl space-y-4 text-right toast-confirm-animate">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-2xl ${confirmState.danger ? 'bg-red-100 text-red-600' : 'bg-[#D4AF37]/15 text-[#B38F24]'}`}>
              {confirmState.danger ? '🗑️' : '🪡'}
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-black text-[#23201C]">{confirmState.title}</h3>
              <p className="text-[11px] text-[#7E7667] font-bold leading-relaxed">{confirmState.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="py-2.5 rounded-xl bg-[#FAF6ED] text-[#23201C] text-xs font-black border border-[#EADFC7] active:scale-95 transition-transform"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`py-2.5 rounded-xl text-xs font-black text-white shadow-md active:scale-95 transition-transform ${
                  confirmState.danger ? 'bg-red-600' : 'bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#AA771C]'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);