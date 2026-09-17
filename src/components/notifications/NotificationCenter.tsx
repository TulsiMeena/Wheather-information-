import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CloudRain,
  Wind,
  Sun,
  Activity,
  Flame,
  Clock,
  ShieldAlert,
  Calendar,
  Sliders,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { NotificationItem, NotificationType } from '../../types/weather';
import './NotificationCenter.css';

export const NotificationCenter: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    notificationPermission,
    requestNotificationPermission,
    settings,
    updateSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'notices' | 'rules'>('notices');

  if (!isNotificationDrawerOpen) return null;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'RAIN':
      case 'HEAVY_RAIN':
        return <CloudRain size={16} className="text-sky" />;
      case 'STRONG_WIND':
        return <Wind size={16} className="text-teal" />;
      case 'HIGH_UV':
        return <Sun size={16} className="text-amber" />;
      case 'AQI_CHANGE':
        return <Activity size={16} className="text-violet" />;
      case 'TEMPERATURE_CHANGE':
        return <Flame size={16} className="text-rose" />;
      case 'FORECAST_UPDATE':
        return <Calendar size={16} className="text-emerald" />;
      default:
        return <AlertTriangle size={16} className="text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'extreme':
        return <span className="notif-badge badge-extreme">Extreme</span>;
      case 'severe':
        return <span className="notif-badge badge-severe">Severe</span>;
      case 'warning':
        return <span className="notif-badge badge-warning">Warning</span>;
      default:
        return <span className="notif-badge badge-info">Advisory</span>;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="notif-drawer-backdrop" onClick={() => setIsNotificationDrawerOpen(false)}>
      <div
        className="notif-drawer-panel glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
      >
        {/* Header */}
        <div className="notif-drawer-header">
          <div className="notif-header-title">
            <Bell size={20} className="text-primary" />
            <h2>Meteorological Notification Center</h2>
            {unreadNotificationCount > 0 && (
              <span className="notif-counter-pill">{unreadNotificationCount}</span>
            )}
          </div>
          <button
            className="btn-icon-close"
            onClick={() => setIsNotificationDrawerOpen(false)}
            aria-label="Close notification center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Browser Permission Callout */}
        <div className="notif-perm-bar">
          {notificationPermission === 'granted' ? (
            <div className="perm-status granted">
              <CheckCircle2 size={15} />
              <span>Browser push notifications enabled</span>
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="perm-status denied">
              <ShieldAlert size={15} />
              <span>Browser permission blocked (notices active in-app)</span>
            </div>
          ) : notificationPermission === 'unsupported' ? (
            <div className="perm-status unsupported">
              <ShieldAlert size={15} />
              <span>Browser notifications unsupported on this client</span>
            </div>
          ) : (
            <div className="perm-status prompt">
              <span>Enable browser notifications for urgent weather alerts</span>
              <button className="btn-enable-perm" onClick={requestNotificationPermission}>
                Enable
              </button>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="notif-tabs-bar">
          <button
            className={`notif-tab-btn ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveTab('notices')}
          >
            Notices &amp; Alerts ({notifications.length})
          </button>
          <button
            className={`notif-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <Sliders size={14} />
            <span>Smart Triggers &amp; Rules</span>
          </button>
        </div>

        {/* Tab Content: Notices Feed */}
        {activeTab === 'notices' && (
          <div className="notif-tab-content">
            {notifications.length > 0 && (
              <div className="notif-bulk-actions">
                <button className="btn-action-ghost" onClick={markAllNotificationsAsRead}>
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
                <button className="btn-action-ghost text-rose" onClick={clearAllNotifications}>
                  <Trash2 size={14} />
                  <span>Clear history</span>
                </button>
              </div>
            )}

            <div className="notif-list-scroller">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`notif-item-card ${item.isRead ? 'read' : 'unread'} severity-${item.severity}`}
                    onClick={() => markNotificationAsRead(item.id)}
                  >
                    <div className="notif-item-header">
                      <div className="notif-type-tag">
                        {getTypeIcon(item.type)}
                        <span className="notif-loc-name">{item.location}</span>
                      </div>
                      <div className="notif-time-badge">
                        {getSeverityBadge(item.severity)}
                        <span className="notif-time-text">
                          <Clock size={11} />
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    </div>

                    <h4 className="notif-item-title">{item.title}</h4>
                    <p className="notif-item-msg">{item.message}</p>

                    <div className="notif-item-footer">
                      <span className="notif-source-tag">Source: {item.source}</span>
                      {!item.isRead && <span className="notif-unread-dot" title="Unread" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="notif-empty-box">
                  <Bell size={36} className="text-muted" />
                  <h3>No notifications yet</h3>
                  <p>
                    Meteorological surveillance is running in the background. You will be notified
                    when thresholds for rain, heat, or high winds are detected.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Rules & Trigger Configuration */}
        {activeTab === 'rules' && (
          <div className="notif-tab-content notif-rules-scroller">
            <div className="rule-box">
              <div className="rule-box-header">
                <div className="rule-title-group">
                  <CloudRain size={18} className="text-sky" />
                  <div>
                    <h4>Rain Probability Trigger</h4>
                    <p>Trigger notification when forecast probability crosses selected threshold</p>
                  </div>
                </div>
              </div>
              <div className="rule-control-options">
                {[20, 40, 50, 60, 70, 80].map((val) => (
                  <button
                    key={val}
                    className={`rule-pill ${settings.rainAlertThreshold === val ? 'active' : ''}`}
                    onClick={() => updateSettings({ rainAlertThreshold: val })}
                  >
                    ≥ {val}%
                  </button>
                ))}
                <button
                  className={`rule-pill ${settings.rainAlertThreshold === null ? 'active' : ''}`}
                  onClick={() => updateSettings({ rainAlertThreshold: null })}
                >
                  Disabled
                </button>
              </div>
            </div>

            <div className="rule-box">
              <div className="rule-box-header">
                <div className="rule-title-group">
                  <Wind size={18} className="text-teal" />
                  <div>
                    <h4>High Wind Velocity Trigger</h4>
                    <p>Alert when surface wind velocity reaches high or gale strength</p>
                  </div>
                </div>
              </div>
              <div className="rule-control-options">
                {[30, 40, 50, 60].map((val) => (
                  <button
                    key={val}
                    className={`rule-pill ${settings.windAlertThreshold === val ? 'active' : ''}`}
                    onClick={() => updateSettings({ windAlertThreshold: val })}
                  >
                    ≥ {val} km/h
                  </button>
                ))}
                <button
                  className={`rule-pill ${settings.windAlertThreshold === null ? 'active' : ''}`}
                  onClick={() => updateSettings({ windAlertThreshold: null })}
                >
                  Disabled
                </button>
              </div>
            </div>

            <div className="rule-box">
              <div className="rule-box-header">
                <div className="rule-title-group">
                  <Sun size={18} className="text-amber" />
                  <div>
                    <h4>Solar UV Radiation Alert</h4>
                    <p>Warn against dangerous ultraviolet radiation during peak hours</p>
                  </div>
                </div>
              </div>
              <div className="rule-control-options">
                <button
                  className={`rule-pill ${settings.uvAlertThreshold === 'high' ? 'active' : ''}`}
                  onClick={() => updateSettings({ uvAlertThreshold: 'high' })}
                >
                  High (≥ 6)
                </button>
                <button
                  className={`rule-pill ${settings.uvAlertThreshold === 'very-high' ? 'active' : ''}`}
                  onClick={() => updateSettings({ uvAlertThreshold: 'very-high' })}
                >
                  Very High (≥ 8)
                </button>
                <button
                  className={`rule-pill ${settings.uvAlertThreshold === 'extreme' ? 'active' : ''}`}
                  onClick={() => updateSettings({ uvAlertThreshold: 'extreme' })}
                >
                  Extreme (≥ 11)
                </button>
                <button
                  className={`rule-pill ${settings.uvAlertThreshold === null ? 'active' : ''}`}
                  onClick={() => updateSettings({ uvAlertThreshold: null })}
                >
                  Disabled
                </button>
              </div>
            </div>

            <div className="rule-box">
              <div className="rule-box-header">
                <div className="rule-title-group">
                  <Activity size={18} className="text-violet" />
                  <div>
                    <h4>Air Quality (AQI) Warning</h4>
                    <p>Alert when pollution levels are unhealthy for sensitive groups</p>
                  </div>
                </div>
              </div>
              <div className="rule-control-options">
                <button
                  className={`rule-pill ${settings.aqiAlertThreshold === 100 ? 'active' : ''}`}
                  onClick={() => updateSettings({ aqiAlertThreshold: 100 })}
                >
                  Moderate (≥ 100)
                </button>
                <button
                  className={`rule-pill ${settings.aqiAlertThreshold === 150 ? 'active' : ''}`}
                  onClick={() => updateSettings({ aqiAlertThreshold: 150 })}
                >
                  Unhealthy (≥ 150)
                </button>
                <button
                  className={`rule-pill ${settings.aqiAlertThreshold === 200 ? 'active' : ''}`}
                  onClick={() => updateSettings({ aqiAlertThreshold: 200 })}
                >
                  Severe (≥ 200)
                </button>
                <button
                  className={`rule-pill ${settings.aqiAlertThreshold === null ? 'active' : ''}`}
                  onClick={() => updateSettings({ aqiAlertThreshold: null })}
                >
                  Disabled
                </button>
              </div>
            </div>

            <div className="rule-box">
              <div className="rule-box-header">
                <div className="rule-title-group">
                  <Calendar size={18} className="text-emerald" />
                  <div>
                    <h4>Daily Weather Summary</h4>
                    <p>Automated synoptic morning forecast with day temperatures and rain probability</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.dailySummaryEnabled ?? true}
                    onChange={(e) => updateSettings({ dailySummaryEnabled: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
