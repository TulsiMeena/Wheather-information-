import React, { useState } from 'react';
import {
  Clock,
  Droplets,
  Wind,
  List,
  Columns,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatTemperature, formatWindSpeed, formatPercentage } from '../utils/formatters';
import { WeatherIcon } from '../components/common/WeatherIcon';
import { HourlyCardSkeleton } from '../components/common/Skeletons';
import './HourlyPage.css';

export const HourlyPage: React.FC = () => {
  const {
    currentLocation,
    hourlyForecast,
    settings,
    isLoading,
    refreshData,
    setActivePage
  } = useApp();

  const [viewMode, setViewMode] = useState<'strip' | 'list'>('strip');

  const hasHourlyData = hourlyForecast && hourlyForecast.length > 0;

  if (isLoading && !hasHourlyData) {
    return (
      <div className="page-container">
        <HourlyCardSkeleton />
      </div>
    );
  }

  return (
    <div className="page-container hourly-page-container">
      {/* Top Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Hourly Micro Forecast</h1>
          <p className="page-subtitle">
            {currentLocation
              ? `Chronological meteorological trajectory for ${currentLocation.name}`
              : 'Awaiting target location'}
          </p>
        </div>

        <div className="header-right-actions">
          <button
            className={`btn btn-secondary refresh-btn ${isLoading ? 'spinning' : ''}`}
            onClick={() => refreshData(true)}
            disabled={isLoading}
            aria-label="Refresh hourly forecast"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'strip' ? 'active' : ''}`}
              onClick={() => setViewMode('strip')}
              aria-label="Horizontal Strip View"
              title="Horizontal Strip View"
            >
              <Columns size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="Vertical List View"
              title="Vertical List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Hourly Interface */}
      {viewMode === 'strip' ? (
        <section className="glass-card hourly-strip-card" aria-label="Hourly Horizontal Scroll">
          <div className="strip-header">
            <div className="strip-title-row">
              <Clock size={16} className="text-primary" />
              <span>Next 48 Hours Micro-Timeline</span>
            </div>
            <span className="strip-meta">Swipe horizontally • Tap hour for details</span>
          </div>

          <div className="hourly-horizontal-scroll" tabIndex={0} role="region" aria-label="Hourly timeline">
            {hourlyForecast.map((item, idx) => {
              const isCurrentHour = item.isNow || idx === 0;
              return (
                <div
                  key={item.id}
                  className={`hourly-data-card ${isCurrentHour ? 'active-hour-card' : ''}`}
                >
                  <span className="hour-time">
                    {isCurrentHour ? 'NOW' : item.time}
                  </span>

                  <div className="hour-icon-box">
                    <WeatherIcon
                      condition={item.condition}
                      isDaytime={item.isDaytime ?? true}
                      size={26}
                    />
                  </div>

                  <span className="hour-temp">
                    {formatTemperature(item.temperature, settings.tempUnit)}
                  </span>

                  <div
                    className={`hour-metric-pill ${(item.precipitationProbability ?? 0) > 0 ? 'active-rain' : ''}`}
                    title={`Rain probability: ${item.precipitationProbability ?? 0}%`}
                  >
                    <Droplets size={12} className={(item.precipitationProbability ?? 0) > 0 ? 'text-primary' : 'text-muted'} />
                    <span>{formatPercentage(item.precipitationProbability)}</span>
                  </div>

                  <div className="hour-wind" title={`Wind: ${item.windSpeed ?? 0} ${settings.windUnit}`}>
                    <Wind size={12} className="text-muted" />
                    <span>{formatWindSpeed(item.windSpeed, settings.windUnit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Vertical List Mode */
        <section className="glass-card hourly-list-card" aria-label="Hourly Timeline List">
          <div className="hourly-list-table">
            <div className="hourly-list-head">
              <span>Time</span>
              <span>Condition</span>
              <span>Temp</span>
              <span>Precipitation</span>
              <span>Wind</span>
            </div>

            {hourlyForecast.map((item, idx) => {
              const isCurrentHour = item.isNow || idx === 0;
              const prob = item.precipitationProbability ?? 0;
              return (
                <div
                  key={item.id}
                  className={`hourly-list-row ${isCurrentHour ? 'active-list-row' : ''}`}
                >
                  <span className="list-time">
                    {isCurrentHour ? 'Now' : item.time}
                  </span>

                  <div className="list-cond">
                    <WeatherIcon
                      condition={item.condition}
                      isDaytime={item.isDaytime ?? true}
                      size={20}
                    />
                    <span>{item.conditionText}</span>
                  </div>

                  <span className="list-temp">
                    {formatTemperature(item.temperature, settings.tempUnit)}
                  </span>

                  <div className="list-precip">
                    <Droplets
                      size={14}
                      className={prob > 0 ? 'text-primary' : 'text-muted'}
                    />
                    <span className={prob > 0 ? 'active-rain' : ''}>
                      {formatPercentage(item.precipitationProbability)}
                      {item.precipitation ? ` (${item.precipitation}mm)` : ''}
                    </span>
                  </div>

                  <span className="list-wind">
                    {formatWindSpeed(item.windSpeed, settings.windUnit)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Navigation Footer */}
      <div className="hourly-nav-footer">
        <button className="btn btn-secondary" onClick={() => setActivePage('forecast')}>
          <Calendar size={16} />
          <span>Switch to 10-Day Synoptic Outlook</span>
        </button>
      </div>
    </div>
  );
};
