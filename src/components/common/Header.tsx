import React from 'react';
import { CloudSun, MapPin, Search, Sun, Moon, Laptop, Settings as SettingsIcon, Sparkles, Bell, Activity } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './Header.css';

export const Header: React.FC = () => {
  const {
    currentLocation,
    settings,
    updateSettings,
    setIsSearchOpen,
    setActivePage,
    detectDeviceLocation,
    unreadNotificationCount,
    setIsNotificationDrawerOpen,
    setIsDiagnosticsOpen
  } = useApp();

  const cycleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  const getThemeIcon = () => {
    if (settings.theme === 'light') return <Sun size={18} />;
    if (settings.theme === 'dark') return <Moon size={18} />;
    return <Laptop size={18} />;
  };

  return (
    <header className="app-header glass-surface" role="banner">
      <div className="header-left">
        <button
          className="brand-button"
          onClick={() => setActivePage('home')}
          aria-label="Go to Weather Intelligence Dashboard"
        >
          <div className="brand-logo-badge" title="Amit Meena Weather">
            <img
              src="/icon.svg"
              alt="Amit Meena Weather App Icon"
              className="brand-app-icon"
            />
          </div>
          <div className="brand-info">
            <span className="brand-name">Amit Meena Weather</span>
            <span className="brand-tagline">Deterministic Synoptic Intelligence</span>
          </div>
        </button>
      </div>

      <div className="header-center">
        <button
          className="location-pill-btn"
          onClick={() => setIsSearchOpen(true)}
          aria-label={currentLocation ? `Current location: ${currentLocation.name}. Tap to change` : 'Select location'}
        >
          <MapPin size={16} className="location-pin-icon" />
          <span className="location-name">
            {currentLocation ? `${currentLocation.name}${currentLocation.country ? `, ${currentLocation.country}` : ''}` : 'Select Location'}
          </span>
        </button>
      </div>

      <div className="header-actions">
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="btn-icon btn-ghost header-icon-btn notif-bell-btn"
          aria-label="Meteorological Notification Center"
          title="Notifications & Smart Alerts"
        >
          <Bell size={18} />
          {unreadNotificationCount > 0 && (
            <span className="header-notif-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>
          )}
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="btn-icon btn-ghost header-icon-btn"
          aria-label="Search city or location"
          title="Search location"
        >
          <Search size={18} />
        </button>

        <button
          onClick={cycleTheme}
          className="btn-icon btn-ghost header-icon-btn"
          aria-label={`Theme: ${settings.theme}. Click to switch theme`}
          title={`Theme: ${settings.theme}`}
        >
          {getThemeIcon()}
        </button>

        <button
          onClick={() => setActivePage('assistant')}
          className="btn-icon btn-ghost header-icon-btn assistant-header-cta"
          aria-label="Open Weather Intelligence Assistant"
          title="Weather Assistant"
        >
          <Sparkles size={18} />
        </button>

        <button
          onClick={() => setIsDiagnosticsOpen(true)}
          className="btn-icon btn-ghost header-icon-btn"
          aria-label="Open Data Diagnostics and System Telemetry"
          title="Data Diagnostics"
        >
          <Activity size={18} />
        </button>

        <button
          onClick={() => setActivePage('settings')}
          className="btn-icon btn-ghost header-icon-btn"
          aria-label="Open settings"
          title="Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </header>
  );
};
