import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  CloudRain,
  Zap,
  Flame,
  Wind,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  MapPin,
  ExternalLink,
  Activity,
  Sun
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { AlertPriority, AlertCategory, WeatherAlert } from '../types/weather';
import './AlertsPage.css';

type AlertFilter = 'active' | 'upcoming' | 'read' | 'all';

export const AlertsPage: React.FC = () => {
  const {
    currentLocation,
    alerts,
    readAlertIds,
    dismissedAlertIds,
    markAlertAsRead,
    dismissAlert
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<AlertFilter>('active');
  const [expandedAlertIds, setExpandedAlertIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAlertIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter alerts according to status
  const visibleAlerts = useMemo(() => {
    // Exclude permanently dismissed informational alerts
    const nonDismissed = alerts.filter((a) => !dismissedAlertIds.includes(a.id));

    if (activeFilter === 'read') {
      return nonDismissed.filter((a) => readAlertIds.includes(a.id));
    }
    if (activeFilter === 'upcoming') {
      return nonDismissed.filter((a) => a.priority === 'WATCH' || a.category === 'Heavy rain');
    }
    if (activeFilter === 'active') {
      return nonDismissed.filter((a) => !readAlertIds.includes(a.id) || a.priority === 'SEVERE');
    }
    return nonDismissed;
  }, [alerts, dismissedAlertIds, readAlertIds, activeFilter]);

  const hasAlerts = visibleAlerts.length > 0;

  const getPriorityStyle = (priority?: AlertPriority) => {
    switch (priority) {
      case 'SEVERE':
        return { label: 'SEVERE', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'IMPORTANT':
        return { label: 'IMPORTANT', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'WATCH':
        return { label: 'WATCH', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      default:
        return { label: 'INFO', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const monitoredCategories: {
    category: AlertCategory;
    icon: any;
    description: string;
    threshold: string;
  }[] = [
    {
      category: 'Heavy rain',
      icon: CloudRain,
      description: 'Precipitation volume exceeding local drainage capacity.',
      threshold: '≥ 20 mm accumulation or prob ≥ 70%'
    },
    {
      category: 'Thunderstorm',
      icon: Zap,
      description: 'Convective instability with lightning, squalls, or hail.',
      threshold: 'WMO Codes 95, 96, 99'
    },
    {
      category: 'Extreme heat',
      icon: Flame,
      description: 'Elevated daytime thermal index causing physiological heat stress.',
      threshold: 'Temperature ≥ 38°C (Severe ≥ 42°C)'
    },
    {
      category: 'Strong wind',
      icon: Wind,
      description: 'Boundary layer wind gusts capable of dislodging debris.',
      threshold: 'Gusts ≥ 45 km/h (Gale ≥ 65 km/h)'
    },
    {
      category: 'High UV index',
      icon: Sun,
      description: 'Erythemal solar ultraviolet radiation causing skin damage.',
      threshold: 'UV Index ≥ 8 (Extreme ≥ 11)'
    },
    {
      category: 'Poor air quality',
      icon: Activity,
      description: 'Elevated particulate matter (PM2.5) posing respiratory risk.',
      threshold: 'US AQI ≥ 150 (Severe ≥ 200)'
    }
  ];

  return (
    <div className="page-container alerts-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Weather Alert Center</h1>
          <p className="page-subtitle">
            {currentLocation
              ? `Real-time atmospheric condition notices for ${currentLocation.name}`
              : 'Meteorological advisory surveillance system'}
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="alerts-filter-dock" role="tablist">
          <button
            role="tab"
            aria-selected={activeFilter === 'active'}
            className={`filter-tab-btn ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            Active Notices
          </button>
          <button
            role="tab"
            aria-selected={activeFilter === 'upcoming'}
            className={`filter-tab-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            Upcoming Conditions
          </button>
          <button
            role="tab"
            aria-selected={activeFilter === 'read'}
            className={`filter-tab-btn ${activeFilter === 'read' ? 'active' : ''}`}
            onClick={() => setActiveFilter('read')}
          >
            Read / Acknowledged
          </button>
          <button
            role="tab"
            aria-selected={activeFilter === 'all'}
            className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Official Government Readiness Callout */}
      <div className="alerts-provider-callout glass-card">
        <div className="callout-icon-box">
          <ShieldCheck size={20} className="text-primary" />
        </div>
        <div className="callout-content">
          <div className="callout-title-row">
            <strong>India Meteorological Department (IMD) Architecture Ready</strong>
            <span className="callout-badge">Standby Mode</span>
          </div>
          <p>
            The modular alerts system currently synthesizes real synoptic telemetry from Open-Meteo as
            <strong> "Weather Condition Alerts"</strong>. Official bureau warnings (IMD Mausam / CAP feeds)
            will seamlessly dock into the alert stream without UI redesign when official credentials/district boundaries are connected.
          </p>
        </div>
      </div>

      {/* Alerts Stream or Clean Clear Status */}
      <section className="alerts-list-section" aria-label="Active Weather Notices">
        {hasAlerts ? (
          <div className="alerts-stream-grid">
            {visibleAlerts.map((alert) => {
              const priorityStyle = getPriorityStyle(alert.priority);
              const isExpanded = !!expandedAlertIds[alert.id];
              const isRead = readAlertIds.includes(alert.id);

              return (
                <article
                  key={alert.id}
                  className={`glass-card alert-entry-card priority-${alert.priority?.toLowerCase()} ${isRead ? 'is-read' : ''}`}
                >
                  <div className="alert-entry-header">
                    <div className="alert-badge-group">
                      {/* Alert Type: Condition vs Official */}
                      <span className={`alert-origin-badge ${alert.alertType === 'official' ? 'official' : 'condition'}`}>
                        {alert.alertType === 'official' ? 'Official Bureau Alert' : 'Weather Condition Alert'}
                      </span>

                      {/* Priority Tag */}
                      <span
                        className="alert-priority-chip"
                        style={{
                          backgroundColor: priorityStyle.bg,
                          color: priorityStyle.text,
                          borderColor: priorityStyle.border
                        }}
                      >
                        {priorityStyle.label}
                      </span>
                    </div>

                    <div className="alert-meta-right">
                      {alert.startTime && (
                        <span className="alert-validity-time">
                          <Clock size={13} />
                          <span>{alert.startTime} {alert.endTime ? `– ${alert.endTime}` : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="alert-body">
                    <h3 className="alert-entry-title">{alert.title}</h3>
                    <p className="alert-entry-desc">{alert.description}</p>

                    {/* Meteorological Factual Reason */}
                    {alert.reason && (
                      <div className="alert-reason-callout">
                        <strong>Reason:</strong> <span>{alert.reason}</span>
                      </div>
                    )}

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="alert-expanded-panel">
                        {alert.instructions && (
                          <div className="alert-action-guide">
                            <strong>Recommended Precaution:</strong>
                            <p>{alert.instructions}</p>
                          </div>
                        )}

                        <div className="alert-metadata-table">
                          <div className="meta-row">
                            <span className="meta-key">Affected Region:</span>
                            <span className="meta-val">
                              <MapPin size={13} className="inline-icon" />
                              {alert.affectedLocation || currentLocation?.name || 'Local Area'}
                            </span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-key">Data Source:</span>
                            <span className="meta-val">{alert.source}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-key">Reported At:</span>
                            <span className="meta-val">
                              {alert.lastUpdated ? new Date(alert.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live Telemetry'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="alert-entry-footer">
                    <button
                      className="alert-expand-btn"
                      onClick={() => toggleExpand(alert.id)}
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Meteorological Details'}</span>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    <div className="alert-actions-dock">
                      {!isRead ? (
                        <button
                          className="btn-text-action"
                          onClick={() => markAlertAsRead(alert.id)}
                          title="Acknowledge Alert"
                        >
                          <Check size={14} />
                          <span>Mark Read</span>
                        </button>
                      ) : (
                        <span className="read-status-check">
                          <CheckCircle2 size={14} className="text-emerald" />
                          <span>Acknowledged</span>
                        </span>
                      )}

                      {/* Allow dismissing informational/watch notices */}
                      {alert.priority !== 'SEVERE' && (
                        <button
                          className="btn-text-action dismiss"
                          onClick={() => dismissAlert(alert.id)}
                          title="Dismiss Notice"
                        >
                          <X size={14} />
                          <span>Dismiss</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-card no-alerts-card">
            <div className="no-alerts-icon-box">
              <CheckCircle2 size={46} className="text-emerald" />
            </div>
            <h2 className="no-alerts-headline">No active weather alerts.</h2>
            <p className="no-alerts-subtext">
              Atmospheric readings for {currentLocation ? currentLocation.name : 'the selected region'} are within normal baseline thresholds. No severe squalls, heatwaves, or high convective hazards detected.
            </p>
          </div>
        )}
      </section>

      {/* Surveillance Matrix */}
      <section className="monitored-categories-section" aria-label="Monitored Weather Categories">
        <h2 className="section-heading">Atmospheric Condition Surveillance Thresholds</h2>
        <div className="categories-grid">
          {monitoredCategories.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-card category-card">
                <div className="category-head">
                  <div className="category-icon-box">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <span className="category-name">{item.category}</span>
                </div>
                <p className="category-desc">{item.description}</p>
                <div className="category-threshold-pill">
                  <span className="threshold-label">Trigger:</span>
                  <span className="threshold-val">{item.threshold}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
