import React from 'react';
import { useToast, ToastType } from '../services/toastContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
};

const styleMap: Record<ToastType, string> = {
  success: 'bg-nature-600 text-white',
  error: 'bg-birillo-red text-white',
  info: 'bg-ocean-500 text-white',
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            ${styleMap[toast.type]}
            ${toast.exiting ? 'toast-exit' : 'toast-enter'}
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
            pointer-events-auto min-w-[280px] max-w-[380px]
          `}
        >
          <span className="flex-shrink-0">{iconMap[toast.type]}</span>
          <span className="text-sm font-semibold flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
