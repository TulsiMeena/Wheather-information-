import React from 'react';
import {
  Calendar,
  Droplets,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatTemperature, formatPercentage } from '../utils/formatters';
import { WeatherIcon } from '../components/common/WeatherIcon';
import { ForecastCardSkeleton } from '../components/common/Skeletons';
import './ForecastPage.css';

export const ForecastPage: React.FC = () => {
  const {
    currentLocation,
    dailyForecast,
    settings,
    isLoading,
    refreshData,
    setActivePage
  } = useApp();

  const hasDailyData = dailyForecast && dailyForecast.length > 0;

  if (isLoading && !hasDailyData) {
    return (
      <div className="page-container">
        <ForecastCardSkeleton />
      </div>
    );
  }

  // Calculate 10-day min and max bounds for relative bar alignment
  const minTempAcross10Days = hasDailyData
    ? Math.min(...dailyForecast.map((d) => d.lowTemp ?? 0))
    : 0;
  const maxTempAcross10Days = hasDailyData
    ? Math.max(...dailyForecast.map((d) => d.highTemp ?? 0))
    : 40;
  const tempSpan = Math.max(1, maxTempAcross10Days - minTempAcross10Days);

  return (
    <div className="page-container forecast-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">10-Day Synoptic Forecast</h1>
          <p className="page-subtitle">
            {currentLocation
              ? `Extended meteorological trajectory for ${currentLocation.name}`
              : 'Awaiting target location'}
          </p>
        </div>

        <div className="forecast-header-actions">
          <button
            className={`btn btn-secondary refresh-btn ${isLoading ? 'spinning' : ''}`}
            onClick={() => refreshData(true)}
            disabled={isLoading}
            aria-label="Refresh forecast"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActivePage('hourly')}>
            <Clock size={15} />
            <span>View Hourly</span>
          </button>
        </div>
      </div>

      {/* 10-Day Cards List */}
      <section className="glass-card forecast-list-wrapper" aria-label="10-Day Weather Cards">
        <div className="forecast-items-container">
          {dailyForecast.map((item, idx) => {
            const isToday = idx === 0;
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
            const precipProb = item.precipitationProbability ?? 0;

            return (
              <div key={item.id} className={`forecast-card-row ${isToday ? 'is-today' : ''}`}>
                <div className="day-name-col">
                  <span className="forecast-day">{isToday ? 'Today' : item.day}</span>
                  <span className="forecast-date">{item.date}</span>
                </div>

                <div className="condition-col">
                  <div className="condition-icon-badge">
                    <WeatherIcon
                      condition={item.condition}
                      isDaytime={true}
                      size={24}
                    />
                  </div>
                  <span className="forecast-cond-text">{item.conditionText}</span>
                </div>

                <div className="rain-prob-col">
                  <Droplets
                    size={14}
                    className={precipProb > 0 ? 'text-primary' : 'text-muted'}
                  />
                  <span className={`rain-text ${precipProb > 0 ? 'active-rain' : ''}`}>
                    {formatPercentage(item.precipitationProbability)}
                  </span>
                </div>

                <div className="temp-range-col">
                  <span className="low-temp">
                    {formatTemperature(item.lowTemp, settings.tempUnit)}
                  </span>
                  <div className="temp-bar-track" title={`Min: ${low}°, Max: ${high}°`}>
                    <div
                      className="temp-bar-fill"
                      style={{ left: `${leftPercent}%`, width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="high-temp">
                    {formatTemperature(item.highTemp, settings.tempUnit)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Atmospheric Envelopes Summary Card */}
      {hasDailyData && (
        <section className="glass-card synoptic-summary-card">
          <div className="synoptic-header">
            <Calendar size={18} className="text-primary" />
            <span className="synoptic-title">Synoptic Outlook Insights</span>
          </div>
          <p className="synoptic-desc">
            Temperatures across the 10-day period range between{' '}
            <strong>{formatTemperature(minTempAcross10Days, settings.tempUnit)}</strong> and{' '}
            <strong>{formatTemperature(maxTempAcross10Days, settings.tempUnit)}</strong>.
            All meteorological values streamed directly from Open-Meteo Global and European models.
          </p>
        </section>
      )}
    </div>
  );
};
