import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './ToastContainer.css';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-portal-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        let typeClass = 'toast-info';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          typeClass = 'toast-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          typeClass = 'toast-error';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          typeClass = 'toast-warning';
        }

        return (
          <div key={toast.id} className={`toast-item glass-surface ${typeClass}`} role="alert">
            <Icon size={18} className="toast-icon" />
            <div className="toast-body">
              {toast.title && <strong className="toast-title">{toast.title}</strong>}
              <span className="toast-text">{toast.message}</span>
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
