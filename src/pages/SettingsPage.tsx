import React, { useState } from 'react';
import {
  Thermometer,
  Wind,
  Sun,
  Moon,
  Laptop,
  Database,
  Trash2,
  Info,
  Shield,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  CloudRain,
  Activity,
  Sliders,
  Clock,
  Wifi,
  Sparkles
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { StorageService } from '../services/storageService';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    addToast
  } = useApp();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearData = async () => {
    await StorageService.clearAll();
    setShowClearConfirm(false);
    addToast({
      type: 'success',
      title: 'Storage Cleared',
      message: 'Local cache and settings have been reset. Reloading defaults.'
    });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="page-container settings-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Settings & Preferences</h1>
          <p className="page-subtitle">
            Configure telemetry units, smart notifications, auto-refresh, and local storage
          </p>
        </div>
      </div>

      {/* 1. Preferences Section */}
      <section className="glass-card settings-group-card" aria-label="Units & Interface Settings">
        <h2 className="group-heading">METEOROLOGICAL UNITS & APPEARANCE</h2>

        {/* Temperature Unit */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title-row">
              <Thermometer size={18} className="text-primary" />
              <span className="setting-title">Temperature Scale</span>
            </div>
            <span className="setting-desc">Select between Celsius (°C) and Fahrenheit (°F)</span>
          </div>

          <div className="segmented-control">
            <button
              className={`segment-btn ${settings.tempUnit === 'C' ? 'active' : ''}`}
              onClick={() => updateSettings({ tempUnit: 'C' })}
            >
              Celsius (°C)
            </button>
            <button
              className={`segment-btn ${settings.tempUnit === 'F' ? 'active' : ''}`}
              onClick={() => updateSettings({ tempUnit: 'F' })}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>

        {/* Wind Speed Unit */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title-row">
              <Wind size={18} className="text-primary" />
              <span className="setting-title">Wind Speed Metric</span>
            </div>
            <span className="setting-desc">Measure atmospheric velocity in km/h or mph</span>
          </div>

          <div className="segmented-control">
            <button
              className={`segment-btn ${settings.windUnit === 'km/h' ? 'active' : ''}`}
              onClick={() => updateSettings({ windUnit: 'km/h' })}
            >
              km/h
            </button>
            <button
              className={`segment-btn ${settings.windUnit === 'mph' ? 'active' : ''}`}
              onClick={() => updateSettings({ windUnit: 'mph' })}
            >
              mph
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title-row">
              <Sun size={18} className="text-amber" />
              <span className="setting-title">Visual Theme</span>
            </div>
            <span className="setting-desc">Automatic system synchronization or dark twilight canvas</span>
          </div>

          <div className="theme-toggle-grid">
            <button
              className={`theme-pick-btn ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <Moon size={16} />
              <span>Dark</span>
            </button>
            <button
              className={`theme-pick-btn ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <Sun size={16} />
              <span>Light</span>
            </button>
            <button
              className={`theme-pick-btn ${settings.theme === 'system' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'system' })}
            >
              <Laptop size={16} />
              <span>System</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Telemetry Refresh & Data Saver */}
      <section className="glass-card settings-group-card" aria-label="Auto-refresh and Data Usage">
        <h2 className="group-heading">DATA USAGE & BACKGROUND SYNC</h2>

        {/* Auto Refresh Interval */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title-row">
              <Clock size={18} className="text-primary" />
              <span className="setting-title">Auto-Refresh Interval</span>
            </div>
            <span className="setting-desc">Automatic background telemetry polling frequency</span>
          </div>

          <div className="segmented-control">
            <button
              className={`segment-btn ${settings.refreshIntervalMinutes === 15 ? 'active' : ''}`}
              onClick={() => updateSettings({ refreshIntervalMinutes: 15 })}
            >
              15 min
            </button>
            <button
              className={`segment-btn ${settings.refreshIntervalMinutes === 30 ? 'active' : ''}`}
              onClick={() => updateSettings({ refreshIntervalMinutes: 30 })}
            >
              30 min
            </button>
            <button
              className={`segment-btn ${settings.refreshIntervalMinutes === 60 ? 'active' : ''}`}
              onClick={() => updateSettings({ refreshIntervalMinutes: 60 })}
            >
              60 min
            </button>
            <button
              className={`segment-btn ${settings.refreshIntervalMinutes === 0 ? 'active' : ''}`}
              onClick={() => updateSettings({ refreshIntervalMinutes: 0 })}
            >
              Manual
            </button>
          </div>
        </div>

        {/* Data Saver Mode */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title-row">
              <Wifi size={18} className="text-primary" />
              <span className="setting-title">Data Saver Mode</span>
            </div>
            <span className="setting-desc">Reduces tile fetching and preserves local bandwidth</span>
          </div>

          <div className="segmented-control">
            <button
              className={`segment-btn ${settings.dataUsageMode !== 'saver' ? 'active' : ''}`}
              onClick={() => updateSettings({ dataUsageMode: 'normal' })}
            >
              Standard
            </button>
            <button
              className={`segment-btn ${settings.dataUsageMode === 'saver' ? 'active' : ''}`}
              onClick={() => updateSettings({ dataUsageMode: 'saver' })}
            >
              Data Saver
            </button>
          </div>
        </div>
      </section>

      {/* 3. Notifications & Smart Alert Thresholds */}
      <section className="glass-card settings-group-card" aria-label="Smart Meteorological Alerts">
        <h2 className="group-heading">SMART NOTIFICATIONS & THRESHOLD ALERTS</h2>

        {/* Master Notification Switch */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title-row">
              <Bell size={18} className="text-primary" />
              <span className="setting-title">Master Notifications</span>
            </div>
            <span className="setting-desc">Enable in-app meteorological notifications and severe weather alerts</span>
          </div>

          <div className="segmented-control">
            <button
              className={`segment-btn ${settings.notifications ? 'active' : ''}`}
              onClick={() => updateSettings({ notifications: true })}
            >
              Enabled
            </button>
            <button
              className={`segment-btn ${!settings.notifications ? 'active' : ''}`}
              onClick={() => updateSettings({ notifications: false })}
            >
              Disabled
            </button>
          </div>
        </div>

        {settings.notifications && (
          <>
            {/* Rain Alert Threshold */}
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title-row">
                  <CloudRain size={18} className="text-sky" />
                  <span className="setting-title">Rain Probability Threshold</span>
                </div>
                <span className="setting-desc">Trigger notification when precipitation probability exceeds</span>
              </div>

              <div className="select-container">
                <select
                  className="setting-select"
                  value={settings.rainAlertThreshold ?? 50}
                  onChange={(e) => updateSettings({ rainAlertThreshold: Number(e.target.value) })}
                  aria-label="Rain probability threshold"
                >
                  <option value={20}>20% (Early heads-up)</option>
                  <option value={40}>40% (Moderate chance)</option>
                  <option value={60}>60% (Likely rain)</option>
                  <option value={80}>80% (High confidence)</option>
                </select>
              </div>
            </div>

            {/* High Wind Alert Threshold */}
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title-row">
                  <Wind size={18} className="text-teal" />
                  <span className="setting-title">High Wind Advisory</span>
                </div>
                <span className="setting-desc">Alert when wind speed/gusts exceed threshold</span>
              </div>

              <div className="select-container">
                <select
                  className="setting-select"
                  value={settings.windAlertThreshold ?? 45}
                  onChange={(e) => updateSettings({ windAlertThreshold: Number(e.target.value) })}
                  aria-label="High wind threshold"
                >
                  <option value={30}>30 km/h (Moderate breeze)</option>
                  <option value={45}>45 km/h (Strong breeze)</option>
                  <option value={60}>60 km/h (Gale / Storm alert)</option>
                </select>
              </div>
            </div>

            {/* UV Alert Threshold */}
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title-row">
                  <Sun size={18} className="text-amber" />
                  <span className="setting-title">UV Index Warning</span>
                </div>
                <span className="setting-desc">Trigger sun protection alert when UV reaches index</span>
              </div>

              <div className="select-container">
                <select
                  className="setting-select"
                  value={settings.uvAlertThreshold ?? 'high'}
                  onChange={(e) => updateSettings({ uvAlertThreshold: e.target.value as 'high' | 'very-high' | 'extreme' })}
                  aria-label="UV index threshold"
                >
                  <option value="high">UV 6+ (High)</option>
                  <option value="very-high">UV 8+ (Very High)</option>
                  <option value="extreme">UV 11+ (Extreme)</option>
                </select>
              </div>
            </div>

            {/* AQI Alert Threshold & Standard */}
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title-row">
                  <Activity size={18} className="text-rose" />
                  <span className="setting-title">Air Quality Index Alert</span>
                </div>
                <span className="setting-desc">Scale: {settings.aqiAlertScale || 'US AQI'}</span>
              </div>

              <div className="select-container">
                <select
                  className="setting-select"
                  value={settings.aqiAlertThreshold ?? 100}
                  onChange={(e) => updateSettings({ aqiAlertThreshold: Number(e.target.value) })}
                  aria-label="AQI threshold"
                >
                  <option value={50}>AQI 50 (Moderate threshold)</option>
                  <option value={100}>AQI 100 (Unhealthy for sensitive groups)</option>
                  <option value={150}>AQI 150 (Unhealthy for all)</option>
                </select>
              </div>
            </div>

            {/* Daily Morning Summary */}
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title-row">
                  <Sparkles size={18} className="text-primary" />
                  <span className="setting-title">Daily Morning Briefing</span>
                </div>
                <span className="setting-desc">Generate concise morning atmospheric outlook for active location</span>
              </div>

              <div className="segmented-control">
                <button
                  className={`segment-btn ${settings.dailySummaryEnabled ? 'active' : ''}`}
                  onClick={() => updateSettings({ dailySummaryEnabled: true })}
                >
                  On
                </button>
                <button
                  className={`segment-btn ${!settings.dailySummaryEnabled ? 'active' : ''}`}
                  onClick={() => updateSettings({ dailySummaryEnabled: false })}
                >
                  Off
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 4. Data Provider Section */}
      <section className="glass-card settings-group-card" aria-label="Data Provider Specification">
        <h2 className="group-heading">TELEMETRY & DATA PROVIDERS</h2>

        <div className="provider-info-box">
          <div className="provider-header-row">
            <div className="provider-badge">
              <Database size={16} />
              <span>Primary Engine</span>
            </div>
            <span className="provider-status">Open-Meteo Integration Architecture</span>
          </div>

          <p className="provider-description">
            Weather Intelligence is architected for direct integration with <strong>Open-Meteo</strong> (free, open-access, zero-rate-limit meteorological science API).
          </p>

          <div className="specs-list">
            <div className="spec-item">
              <CheckCircle2 size={15} className="text-emerald" />
              <span>Global Weather API (WMO Weather Codes 0–99)</span>
            </div>
            <div className="spec-item">
              <CheckCircle2 size={15} className="text-emerald" />
              <span>High-Resolution Geocoding Service</span>
            </div>
            <div className="spec-item">
              <CheckCircle2 size={15} className="text-emerald" />
              <span>European & US Air Quality Model Forecasts</span>
            </div>
            <div className="spec-item">
              <CheckCircle2 size={15} className="text-emerald" />
              <span>Offline-First Multi-Tier LRU Cache Layer</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. About & Ownership Section */}
      <section className="glass-card settings-group-card" aria-label="About and Application Owner">
        <h2 className="group-heading">ABOUT APPLICATION & OWNERSHIP</h2>

        <div className="app-identity-banner">
          <div className="app-identity-icon-wrapper">
            <img src="/icon.svg" alt="Amit Meena Weather App Icon" className="app-identity-icon" />
          </div>
          <div className="app-identity-meta">
            <h3 className="app-identity-name">Amit Meena Weather</h3>
            <p className="app-identity-desc">Deterministic Synoptic Intelligence & Meteorological Telemetry</p>
            <div className="app-identity-tags">
              <span className="app-identity-tag pwa">PWA Enabled</span>
              <span className="app-identity-tag version">v1.4.0 Stable</span>
              <span className="app-identity-tag verified">Verified App Icon</span>
            </div>
          </div>
        </div>

        <div className="about-details-table">
          <div className="about-row">
            <div className="about-label-cell">
              <User size={16} className="text-primary" />
              <span>App Owner</span>
            </div>
            <span className="about-val-cell font-bold owner-name-badge">Amit Meena</span>
          </div>

          <div className="about-row">
            <div className="about-label-cell">
              <Info size={16} className="text-primary" />
              <span>Application Name</span>
            </div>
            <span className="about-val-cell">Amit Meena Weather Intelligence</span>
          </div>

          <div className="about-row">
            <div className="about-label-cell">
              <Shield size={16} className="text-primary" />
              <span>Version & Architecture</span>
            </div>
            <span className="about-val-cell font-mono">v1.0.0 (PWA Offline Synoptic Engine)</span>
          </div>

          <div className="about-row">
            <div className="about-label-cell">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Data Integrity Policy</span>
            </div>
            <span className="about-val-cell">
              Zero-fake data policy. Real telemetry streams via verified meteorological provider contracts.
            </span>
          </div>
        </div>
      </section>

      {/* 6. Privacy & Storage Management */}
      <section className="glass-card settings-group-card" aria-label="Local Data Management">
        <h2 className="group-heading">PRIVACY & LOCAL CACHE</h2>
        <p className="privacy-note">
          Weather Intelligence operates with strict offline-first privacy. Your favorite cities, customized widgets, and preferences are stored locally on this device and are never sold or sent to third-party tracking servers.
        </p>

        <div className="clear-storage-row">
          <button
            className="btn btn-secondary clear-btn"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 size={16} />
            <span>Reset Local Storage & Cache</span>
          </button>
        </div>

        {showClearConfirm && (
          <div className="confirm-delete-box">
            <AlertTriangle size={20} className="text-rose" />
            <div className="confirm-text">
              <strong>Confirm Local Storage Reset?</strong>
              <p>This will erase your saved favorite locations and reset preferences to system defaults.</p>
            </div>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={handleClearData}>
                Confirm Reset
              </button>
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
