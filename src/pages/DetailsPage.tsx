import React from 'react';
import {
  Thermometer,
  Sparkles,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Sun,
  Cloud,
  Waves,
  CloudRain,
  Compass,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import {
  formatTemperature,
  formatWindSpeed,
  formatPercentage,
  formatPressure,
  formatVisibility,
  formatUVIndex,
  getWindDirectionName
} from '../utils/formatters';
import { DetailCardSkeleton } from '../components/common/Skeletons';
import './DetailsPage.css';

export const DetailsPage: React.FC = () => {
  const {
    currentLocation,
    currentWeather,
    settings,
    isLoading,
    refreshData
  } = useApp();

  const hasWeather = currentWeather !== null && currentWeather.temperature !== null;

  if (isLoading && !hasWeather) {
    return (
      <div className="page-container">
        <div className="details-cards-grid">
          <DetailCardSkeleton />
          <DetailCardSkeleton />
          <DetailCardSkeleton />
          <DetailCardSkeleton />
        </div>
      </div>
    );
  }

  const uvInfo = formatUVIndex(currentWeather?.uvIndex);
  const windDirName = getWindDirectionName(currentWeather?.windDirection);

  return (
    <div className="page-container details-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Atmospheric Weather Details</h1>
          <p className="page-subtitle">
            {currentLocation
              ? `Diagnostic meteorological telemetry for ${currentLocation.name}`
              : 'Awaiting target location'}
          </p>
        </div>

        <button
          className={`btn btn-secondary refresh-btn ${isLoading ? 'spinning' : ''}`}
          onClick={() => refreshData(true)}
          disabled={isLoading}
          aria-label="Refresh atmospheric metrics"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* 10 Detailed Metrics Cards Grid */}
      <div className="details-cards-grid">
        {/* 1. Temperature */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Thermometer size={20} className="text-primary" />
            <span className="detail-label">Dry Bulb Temperature</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatTemperature(currentWeather?.temperature, settings.tempUnit) : '--°'}
          </div>
          <span className="detail-sub-text">Calibrated ambient 2-meter air temperature</span>
        </div>

        {/* 2. Feels-like */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Sparkles size={20} className="text-amber" />
            <span className="detail-label">Apparent / Feels Like</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatTemperature(currentWeather?.feelsLike, settings.tempUnit) : '--°'}
          </div>
          <span className="detail-sub-text">Biometeorological wind chill and heat index indexation</span>
        </div>

        {/* 3. Relative Humidity */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Droplets size={20} className="text-primary" />
            <span className="detail-label">Relative Humidity</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatPercentage(currentWeather?.humidity) : '--%'}
          </div>
          <span className="detail-sub-text">Water vapor pressure ratio relative to saturation equilibrium</span>
        </div>

        {/* 4. Wind Speed, Direction & Gusts */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Wind size={20} className="text-primary" />
            <span className="detail-label">Wind Velocity & Gusts</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatWindSpeed(currentWeather?.windSpeed, settings.windUnit) : '--'}
          </div>
          <span className="detail-sub-text">
            {hasWeather
              ? `Heading from ${windDirName} (${Math.round(currentWeather?.windDirection ?? 0)}°) • Peak gusts ${Math.round(currentWeather?.windGusts ?? currentWeather?.windSpeed ?? 0)} ${settings.windUnit}`
              : 'Surface vector flow speed and turbulent gusts'}
          </span>
        </div>

        {/* 5. Barometric Pressure */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Gauge size={20} className="text-primary" />
            <span className="detail-label">Barometric Pressure</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatPressure(currentWeather?.pressure) : '-- hPa'}
          </div>
          <span className="detail-sub-text">Atmospheric sea-level equivalent pressure gradient</span>
        </div>

        {/* 6. Visibility */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Eye size={20} className="text-primary" />
            <span className="detail-label">Optical Visibility</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatVisibility(currentWeather?.visibility) : '-- km'}
          </div>
          <span className="detail-sub-text">Greatest distance unobstructed prominent objects remain discernable</span>
        </div>

        {/* 7. UV Index */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Sun size={20} className="text-amber" />
            <span className="detail-label">Solar UV Radiation</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? `${uvInfo.value} • ${uvInfo.label}` : '--'}
          </div>
          <span className="detail-sub-text">Erythemal-weighted solar ultraviolet irradiance intensity</span>
        </div>

        {/* 8. Cloud Cover */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Cloud size={20} className="text-primary" />
            <span className="detail-label">Total Cloud Occlusion</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatPercentage(currentWeather?.cloudCover) : '--%'}
          </div>
          <span className="detail-sub-text">Fractional percentage of celestial vault obscured by cloud sheets</span>
        </div>

        {/* 9. Dew Point */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <Waves size={20} className="text-primary" />
            <span className="detail-label">Thermodynamic Dew Point</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatTemperature(currentWeather?.dewPoint, settings.tempUnit) : '--°'}
          </div>
          <span className="detail-sub-text">Saturation temperature at which moist air precipitates condensation</span>
        </div>

        {/* 10. Precipitation */}
        <div className="glass-card detail-card">
          <div className="detail-card-head">
            <CloudRain size={20} className="text-primary" />
            <span className="detail-label">Precipitation Chance & Rate</span>
          </div>
          <div className="detail-main-value">
            {hasWeather ? formatPercentage(currentWeather?.precipitationProbability) : '--%'}
          </div>
          <span className="detail-sub-text">
            {hasWeather && (currentWeather?.precipitation ?? 0) > 0
              ? `Current rate: ${currentWeather?.precipitation} mm/h liquid precipitation`
              : 'Probability and liquid equivalent precipitation accumulation rate'}
          </span>
        </div>
      </div>
    </div>
  );
};
