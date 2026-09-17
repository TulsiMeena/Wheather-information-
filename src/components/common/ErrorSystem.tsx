import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, MapPinOff, Inbox } from 'lucide-react';
import './ErrorSystem.css';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Data Signal Interruption',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`glass-card error-card-container ${className}`} role="alert">
      <div className="error-icon-box">
        <AlertTriangle className="error-icon" size={28} />
      </div>
      <div className="error-content">
        <h4 className="error-title">{title}</h4>
        <p className="error-message">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary retry-button" aria-label="Retry loading data">
          <RefreshCw size={16} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`glass-card empty-state-card ${className}`}>
      <div className="empty-state-icon">
        {icon || <Inbox size={36} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary empty-state-btn">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const OfflineState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <EmptyState
      icon={<WifiOff size={36} className="text-amber" />}
      title="Offline Connection"
      description="Network connection is currently unavailable. Weather Intelligence will reconnect automatically when connection is restored."
      actionLabel={onRetry ? "Check Reconnect" : undefined}
      onAction={onRetry}
    />
  );
};

export const PermissionDeniedState: React.FC<{ onRequestPermission?: () => void }> = ({
  onRequestPermission,
}) => {
  return (
    <EmptyState
      icon={<MapPinOff size={36} className="text-primary" />}
      title="Location Access Inactive"
      description="Location permission is required to detect local weather. You can grant access or search any global city manually."
      actionLabel={onRequestPermission ? "Enable Location" : undefined}
      onAction={onRequestPermission}
    />
  );
};
