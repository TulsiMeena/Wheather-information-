import React, { useRef, useEffect } from 'react';
import {
  Home,
  Clock,
  Calendar,
  Map as MapIcon,
  Wind,
  Bell,
  Heart,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
  History,
  LucideIcon
} from 'lucide-react';
import { useApp, NavigationPage } from '../../state/AppContext';
import './Navigation.css';

interface NavItemDef {
  page: NavigationPage;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeType?: 'default' | 'warning';
}

export const navigationItems: NavItemDef[] = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'hourly', label: 'Hourly', icon: Clock },
  { page: 'forecast', label: 'Forecast', icon: Calendar },
  { page: 'map', label: 'Map', icon: MapIcon },
  { page: 'history', label: 'History', icon: History },
  { page: 'airquality', label: 'Air Quality', icon: Wind },
  { page: 'assistant', label: 'Assistant', icon: Sparkles },
  { page: 'alerts', label: 'Alerts', icon: Bell },
  { page: 'favorites', label: 'Favorites', icon: Heart },
  { page: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const BottomNavigation: React.FC = () => {
  const { activePage, setActivePage, favorites, alerts } = useApp();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active item into view on small screens
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector<HTMLElement>('.bottom-nav-item.active');
      if (activeEl) {
        const containerLeft = scrollRef.current.scrollLeft;
        const containerWidth = scrollRef.current.clientWidth;
        const elLeft = activeEl.offsetLeft;
        const elWidth = activeEl.clientWidth;

        if (elLeft < containerLeft || elLeft + elWidth > containerLeft + containerWidth) {
          scrollRef.current.scrollTo({
            left: elLeft - containerWidth / 2 + elWidth / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [activePage]);

  return (
    <nav className="bottom-nav-container glass-surface hide-desktop" aria-label="Mobile Navigation">
      <div ref={scrollRef} className="bottom-nav-scroll-track">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;

          let badgeCount: number | undefined;
          let badgeWarning = false;
          if (item.page === 'favorites' && favorites.length > 0) {
            badgeCount = favorites.length;
          } else if (item.page === 'alerts' && alerts.length > 0) {
            badgeCount = alerts.length;
            badgeWarning = true;
          }

          return (
            <button
              key={item.page}
              onClick={() => setActivePage(item.page)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrapper">
                <Icon size={19} className="nav-icon" />
                {badgeCount !== undefined && (
                  <span className={`nav-badge ${badgeWarning ? 'warning' : ''}`}>
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="nav-label">{item.label}</span>
              {isActive && <div className="active-indicator-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const DesktopNavigationRail: React.FC = () => {
  const { activePage, setActivePage, favorites, alerts } = useApp();

  const mainNavItems = navigationItems.slice(0, 5); // Home, Hourly, Forecast, Map, History
  const intelNavItems = navigationItems.slice(5);    // Air Quality, Assistant, Alerts, Favorites, Settings

  return (
    <aside className="desktop-nav-rail glass-surface hide-mobile" aria-label="Desktop Navigation">
      <button
        className="rail-brand-header"
        onClick={() => setActivePage('home')}
        title="Amit Meena Weather — Home"
      >
        <div className="rail-brand-icon-box">
          <img src="/icon.svg" alt="Amit Meena Weather Icon" className="rail-brand-icon-img" />
        </div>
        <div className="rail-brand-text">
          <span className="rail-brand-title">Weather Intelligence</span>
          <span className="rail-brand-subtitle">Amit Meena</span>
        </div>
      </button>

      <div className="rail-section">
        <span className="rail-section-heading">METEOROLOGY</span>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => setActivePage(item.page)}
              className={`rail-nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="rail-icon-box">
                <Icon size={18} />
              </div>
              <span className="rail-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rail-section">
        <span className="rail-section-heading">INTELLIGENCE</span>
        {intelNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;

          let badgeCount: number | undefined;
          let badgeWarning = false;
          if (item.page === 'favorites' && favorites.length > 0) {
            badgeCount = favorites.length;
          } else if (item.page === 'alerts' && alerts.length > 0) {
            badgeCount = alerts.length;
            badgeWarning = true;
          }

          return (
            <button
              key={item.page}
              onClick={() => setActivePage(item.page)}
              className={`rail-nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="rail-icon-box">
                <Icon size={18} />
                {badgeCount !== undefined && (
                  <span className={`rail-badge ${badgeWarning ? 'warning' : ''}`}>
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="rail-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rail-footer">
        <span className="rail-owner">Amit Meena</span>
        <span className="rail-version">Weather Intelligence v1.4.0</span>
      </div>
    </aside>
  );
};
