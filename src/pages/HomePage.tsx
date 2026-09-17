import React from 'react';
import {
  MapPin,
  RefreshCw,
  Eye,
  Compass,
  Thermometer,
  CloudSun,
  ArrowRight,
  WifiOff,
  AlertTriangle,
  Clock,
  Calendar,
  Cloud,
  Layers,
  CheckCircle2,
  Database
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import {
  formatTemperature,
  formatPercentage,
  formatVisibility,
  formatPressure,
  formatTime
} from '../utils/formatters';
import { WeatherIcon } from '../components/common/WeatherIcon';
import { WeatherCardSkeleton } from '../components/common/Skeletons';
import { WindGauge } from '../components/weather/WindGauge';
import { RainSummary } from '../components/weather/RainSummary';
import { SunCycle } from '../components/weather/SunCycle';
import { HourlyScroller } from '../components/weather/HourlyScroller';
import { WeatherIntelligenceSummary } from '../components/home/WeatherIntelligenceSummary';
import { QuickActionsBar } from '../components/home/QuickActionsBar';
import { FavoritesQuickStrip } from '../components/home/FavoritesQuickStrip';
import { CustomizeWidgetsModal } from '../components/home/CustomizeWidgetsModal';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const {
    currentLocation,
    currentWeather,
    hourlyForecast,
    dailyForecast,
    settings,
    isLoading,
    dataState,
    isOffline,
    isCached,
    cachedAt,
    lastUpdated,
    error,
    refreshData,
    setIsSearchOpen,
    setActivePage,
    homeWidgets
  } = useApp();

  if (isLoading && !currentWeather) {
    return (
      <div className="page-container">
        <WeatherCardSkeleton />
      </div>
    );
  }

  // Error State Handling with Retry
  if (dataState === 'ERROR' && !currentWeather) {
    return (
      <div className="page-container error-page-container">
        <div className="glass-card error-card">
          <AlertTriangle size={40} className="text-rose" />
          <h2 className="error-title">Weather data is temporarily unavailable.</h2>
          <p className="error-desc">
            {error || 'Could not retrieve meteorological telemetry from Open-Meteo. Please check your network connection.'}
          </p>
          <button className="btn btn-primary retry-btn" onClick={() => refreshData(true)}>
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const hasLiveWeather = currentWeather !== null && currentWeather.temperature !== null;
  const todayDaily = dailyForecast && dailyForecast.length > 0 ? dailyForecast[0] : null;

  // Calculate 10-day min & max bounds for progress bars
  const minTempAcross10Days = dailyForecast.length > 0
    ? Math.min(...dailyForecast.map((d) => d.lowTemp ?? 0))
    : 0;
  const maxTempAcross10Days = dailyForecast.length > 0
    ? Math.max(...dailyForecast.map((d) => d.highTemp ?? 0))
    : 40;
  const tempSpan = Math.max(1, maxTempAcross10Days - minTempAcross10Days);

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Connecting...';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return 'Recently';
    }
  };

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'favorite-strip':
        return <FavoritesQuickStrip key="widget-favorites" />;

      case 'current-hero':
        return (
          <section key="widget-hero" className="glass-card main-hero-card" aria-label="Primary Weather Display">
            <div className="hero-atmosphere-badge">
              <WeatherIcon
                condition={currentWeather?.condition || 'clear'}
                isDaytime={currentWeather?.isDaytime ?? true}
                size={18}
              />
              <span>{currentWeather?.conditionText || 'Live Synoptic Atmosphere'}</span>
            </div>

            <div className="hero-main-stats">
              <div className="temperature-display">
                <span className="temp-large">
                  {hasLiveWeather ? formatTemperature(currentWeather?.temperature, settings.tempUnit) : '--°'}
                </span>
                <span className="temp-unit-indicator">
                  {settings.tempUnit === 'C' ? 'Celsius' : 'Fahrenheit'}
                </span>
              </div>

              <div className="hero-condition-summary">
                <div className="hero-weather-icon-box">
                  <WeatherIcon
                    condition={currentWeather?.condition || 'clear'}
                    isDaytime={currentWeather?.isDaytime ?? true}
                    size={54}
                  />
                </div>
                <div className="hero-condition-text-block">
                  <span className="feels-like-text">
                    Feels like {hasLiveWeather ? formatTemperature(currentWeather?.feelsLike, settings.tempUnit) : '--°'}
                  </span>
                  <span className="high-low-text">
                    H: {hasLiveWeather ? formatTemperature(currentWeather?.highTemp, settings.tempUnit) : '--°'} • L:{' '}
                    {hasLiveWeather ? formatTemperature(currentWeather?.lowTemp, settings.tempUnit) : '--°'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Highlights Row */}
            <div className="hero-highlights-row">
              <div className="highlight-mini-card">
                <span className="highlight-label">Humidity</span>
                <span className="highlight-value">
                  {hasLiveWeather ? formatPercentage(currentWeather?.humidity) : '--%'}
                </span>
              </div>

              <div className="highlight-mini-card">
                <span className="highlight-label">Precip Prob</span>
                <span className="highlight-value">
                  {hasLiveWeather ? formatPercentage(currentWeather?.precipitationProbability) : '--%'}
                </span>
              </div>

              <div className="highlight-mini-card">
                <span className="highlight-label">Cloud Cover</span>
                <span className="highlight-value">
                  {hasLiveWeather ? formatPercentage(currentWeather?.cloudCover) : '--%'}
                </span>
              </div>

              <div className="highlight-mini-card">
                <span className="highlight-label">UV Index</span>
                <span className="highlight-value">
                  {hasLiveWeather ? currentWeather?.uvIndex?.toFixed(1) ?? '--' : '--'}
                </span>
              </div>
            </div>
          </section>
        );

      case 'intelligence-summary':
        return <WeatherIntelligenceSummary key="widget-summary" />;

      case 'hourly-scroller':
        return (
          hourlyForecast && hourlyForecast.length > 0 ? (
            <section key="widget-hourly" aria-label="Hourly Forecast Strip">
              <HourlyScroller
                hourlyItems={hourlyForecast}
                tempUnit={settings.tempUnit}
                windUnit={settings.windUnit}
                onViewAll={() => setActivePage('hourly')}
              />
            </section>
          ) : null
        );

      case 'rain-summary':
        return (
          <section key="widget-rain" aria-label="Rain & Precipitation Status">
            <RainSummary
              currentPrecipitation={currentWeather?.precipitation}
              rainSumToday={todayDaily?.rainSum}
              hourlyItems={hourlyForecast}
            />
          </section>
        );

      case 'wind-gauge':
        return (
          <section key="widget-wind" aria-label="Wind Velocity and Compass">
            <WindGauge
              speed={currentWeather?.windSpeed}
              direction={currentWeather?.windDirection}
              gusts={currentWeather?.windGusts}
              unit={settings.windUnit}
            />
          </section>
        );

      case 'sun-cycle':
        return (
          <section key="widget-sun" aria-label="Daylight and Sun Arc">
            <SunCycle
              sunrise={currentWeather?.sunrise}
              sunset={currentWeather?.sunset}
            />
          </section>
        );

      case 'atmospheric-metrics':
        return (
          <section key="widget-metrics" className="metrics-section" aria-label="Atmospheric Telemetry">
            <div className="section-header-inline">
              <h2 className="section-heading">Atmospheric Conditions</h2>
              <button
                className="btn-ghost view-all-link"
                onClick={() => setActivePage('details')}
                aria-label="View comprehensive weather details"
              >
                <span>Full Details</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="metrics-grid">
              <div className="glass-card metric-card">
                <div className="metric-header">
                  <Eye size={18} className="text-primary" />
                  <span className="metric-title">Visibility</span>
                </div>
                <div className="metric-body">
                  <span className="metric-main-value">
                    {hasLiveWeather ? formatVisibility(currentWeather?.visibility) : '-- km'}
                  </span>
                  <span className="metric-sub-note">Horizontal optical range</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-header">
                  <Compass size={18} className="text-primary" />
                  <span className="metric-title">Pressure</span>
                </div>
                <div className="metric-body">
                  <span className="metric-main-value">
                    {hasLiveWeather ? formatPressure(currentWeather?.pressure) : '-- hPa'}
                  </span>
                  <span className="metric-sub-note">Sea-level adjusted</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-header">
                  <Thermometer size={18} className="text-primary" />
                  <span className="metric-title">Dew Point</span>
                </div>
                <div className="metric-body">
                  <span className="metric-main-value">
                    {hasLiveWeather ? formatTemperature(currentWeather?.dewPoint, settings.tempUnit) : '--°'}
                  </span>
                  <span className="metric-sub-note">Condensation point</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-header">
                  <Cloud size={18} className="text-primary" />
                  <span className="metric-title">Cloud Cover</span>
                </div>
                <div className="metric-body">
                  <span className="metric-main-value">
                    {hasLiveWeather ? formatPercentage(currentWeather?.cloudCover) : '--%'}
                  </span>
                  <span className="metric-sub-note">Sky fraction obscured</span>
                </div>
              </div>
            </div>
          </section>
        );

      case 'forecast-preview':
        return (
          dailyForecast && dailyForecast.length > 0 ? (
            <section key="widget-forecast" className="glass-card home-forecast-preview" aria-label="10-Day Forecast Preview">
              <div className="section-header-inline">
                <div className="section-title-with-icon">
                  <Calendar size={18} className="text-primary" />
                  <h2 className="section-heading">10-Day Trajectory Preview</h2>
                </div>
                <button
                  className="btn-ghost view-all-link"
                  onClick={() => setActivePage('forecast')}
                  aria-label="View extended 10-day forecast"
                >
                  <span>Full 10 Days</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="mini-forecast-list">
                {dailyForecast.slice(0, 5).map((item) => {
                  const low = item.lowTemp ?? 0;
                  const high = item.highTemp ?? 0;
                  const leftPercent = Math.max(
                    0,
                    Math.round(((low - minTempAcross10Days) / tempSpan) * 100)
                  );
                  const rightPercent = Math.min(
                    100,
                    Math.round(((high - minTempAcross10Days) / tempSpan) * 100)
                  );
                  const barWidth = Math.max(8, rightPercent - leftPercent);

                  return (
                    <div key={item.id} className="mini-forecast-row">
                      <span className="mini-day-name">{item.day}</span>
                      <div className="mini-day-icon">
                        <WeatherIcon condition={item.condition} isDaytime={true} size={20} />
                      </div>
                      <div className="mini-temp-range">
                        <span className="mini-low">
                          {formatTemperature(item.lowTemp, settings.tempUnit)}
                        </span>
                        <div className="mini-bar-track">
                          <div
                            className="mini-bar-fill"
                            style={{ left: `${leftPercent}%`, width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="mini-high">
                          {formatTemperature(item.highTemp, settings.tempUnit)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null
        );

      case 'intelligence-hubs':
        return (
          <section key="widget-hubs" className="quick-access-section" aria-label="Weather Intelligence Hubs">
            <h2 className="section-heading">Intelligence Hubs</h2>
            <div className="channel-cards-grid">
              <button
                className="glass-card channel-card glass-card-interactive"
                onClick={() => setActivePage('hourly')}
              >
                <div className="channel-icon-circle">
                  <Clock size={20} />
                </div>
                <div className="channel-meta">
                  <span className="channel-title">Hourly Forecast</span>
                  <span className="channel-desc">24-hour micro-progression</span>
                </div>
                <ArrowRight size={16} className="channel-arrow" />
              </button>

              <button
                className="glass-card channel-card glass-card-interactive"
                onClick={() => setActivePage('forecast')}
              >
                <div className="channel-icon-circle">
                  <Calendar size={20} />
                </div>
                <div className="channel-meta">
                  <span className="channel-title">10-Day Outlook</span>
                  <span className="channel-desc">Extended synoptic forecast</span>
                </div>
                <ArrowRight size={16} className="channel-arrow" />
              </button>

              <button
                className="glass-card channel-card glass-card-interactive"
                onClick={() => setActivePage('map')}
              >
                <div className="channel-icon-circle">
                  <Compass size={20} />
                </div>
                <div className="channel-meta">
                  <span className="channel-title">Radar Map</span>
                  <span className="channel-desc">Live atmospheric layers</span>
                </div>
                <ArrowRight size={16} className="channel-arrow" />
              </button>

              <button
                className="glass-card channel-card glass-card-interactive"
                onClick={() => setActivePage('airquality')}
              >
                <div className="channel-icon-circle">
                  <Layers size={20} />
                </div>
                <div className="channel-meta">
                  <span className="channel-title">Air Quality Index</span>
                  <span className="channel-desc">PM2.5, PM10 &amp; O3 monitoring</span>
                </div>
                <ArrowRight size={16} className="channel-arrow" />
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container home-page-container">
      {/* Offline / Cache Banner */}
      {(isOffline || isCached) && (
        <div className="offline-notice-banner" role="status">
          <WifiOff size={16} />
          <span>
            {isOffline ? 'Offline Mode — ' : 'Cached Snapshot — '}
            Displaying cached meteorological telemetry
            {cachedAt ? ` from ${new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
        </div>
      )}

      {/* Top Location & Telemetry Status Bar */}
      <section className="location-hero-bar" aria-label="Current Location Overview">
        <div className="location-hero-info">
          <button
            className="location-pill-active clickable"
            onClick={() => setIsSearchOpen(true)}
            title="Click to search or change location"
            aria-label="Current location. Tap to change."
          >
            <MapPin size={18} className="text-primary" />
            <span className="location-hero-title">
              {currentLocation ? currentLocation.name : 'Select Location'}
            </span>
            {currentLocation?.country && (
              <span className="location-hero-country">{currentLocation.country}</span>
            )}
          </button>

          <div className="sync-status-row">
            <span className={`live-pulse-dot ${isOffline ? 'offline' : ''}`} />
            <span className="telemetry-timestamp">
              {currentLocation?.name || 'City'} · Open-Meteo ·{' '}
              {isCached ? 'Cached' : 'Updated'}{' '}
              {formatRelativeTime(lastUpdated || cachedAt)}
            </span>
          </div>
        </div>

        <div className="location-actions-group">
          <button
            className={`btn-ghost refresh-data-btn ${isLoading ? 'spinning' : ''}`}
            onClick={() => refreshData(true)}
            disabled={isLoading}
            aria-label="Refresh live weather data"
            title="Refresh live data"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            className="btn btn-secondary change-loc-btn"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Change location"
          >
            <span>Change</span>
          </button>
        </div>
      </section>

      {/* Quick Action Navigation Bar */}
      <QuickActionsBar />

      {/* Customizable Widgets Grid / Flow */}
      <div className="home-widgets-container">
        {homeWidgets
          .filter((w) => w.visible)
          .map((w) => renderWidget(w.id))}
      </div>

      {/* Modal to customize widget order & visibility */}
      <CustomizeWidgetsModal />
    </div>
  );
};
