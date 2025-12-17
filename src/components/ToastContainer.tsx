import React from 'react';
import { useToast } from '@/contexts/ToastContext';
import { X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm pointer-events-auto animate-in slide-in-from-top-2 fade-in ${getTypeStyles(toast.type)}`}
        >
          <div className="flex items-start gap-3">
            <span className={`flex-shrink-0 text-lg font-bold ${getIconColor(toast.type)}`}>
              {getIcon(toast.type)}
            </span>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h3 className="font-semibold text-sm">{toast.title}</h3>
              )}
              {toast.description && (
                <p className="text-sm opacity-90 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
