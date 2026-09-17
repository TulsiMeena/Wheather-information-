import React from 'react';
import {
  ShieldAlert,
  Activity,
  Sun,
  CloudRain,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wind,
  Layers
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './WeatherIntelligenceSummary.css';

export const WeatherIntelligenceSummary: React.FC = () => {
  const {
    currentLocation,
    currentWeather,
    airQuality,
    alerts,
    setActivePage
  } = useApp();

  const topAlert = alerts && alerts.length > 0 ? alerts[0] : null;

  // Build one-sentence environmental summary
  const generateEnvironmentalSummary = () => {
    if (!currentWeather || currentWeather.temperature === null) return 'Awaiting local meteorological stream...';

    const temp = Math.round(currentWeather.temperature);
    const cond = currentWeather.conditionText ? currentWeather.conditionText.toLowerCase() : 'fair';
    const aqiText = airQuality && airQuality.aqi !== null
      ? `satisfactory air quality (${airQuality.aqi} AQI)`
      : 'ambient atmospheric pressure';
    const rainText = (currentWeather.precipitationProbability ?? 0) > 40
      ? `elevated rain probability (${currentWeather.precipitationProbability}%)`
      : 'minimal precipitation probability';

    return `Current observations for ${currentLocation?.name || 'this area'} show ${temp}°C with ${cond}, ${aqiText}, and ${rainText}.`;
  };

  const uvVal = currentWeather?.uvIndex ?? 0;
  const rainProb = currentWeather?.precipitationProbability ?? 0;

  return (
    <section className="glass-card intelligence-summary-card" aria-label="Environmental Intelligence Summary">
      <div className="intelligence-card-header">
        <div className="intel-title-box">
          <Activity size={18} className="text-primary" />
          <h2 className="intel-heading">Weather & Atmospheric Intelligence</h2>
        </div>
        <span className="intel-badge">Synoptic Analysis</span>
      </div>

      {/* Active Alert Banner or All Clear Status */}
      {topAlert ? (
        <div
          className="intel-active-alert-pill clickable"
          onClick={() => setActivePage('alerts')}
          role="button"
          tabIndex={0}
          aria-label={`Active alert: ${topAlert.title}. Tap to view Alert Center.`}
        >
          <div className="alert-pill-left">
            <span className={`pill-severity-indicator ${topAlert.priority?.toLowerCase()}`}>
              {topAlert.priority || 'ADVISORY'}
            </span>
            <span className="pill-alert-title">{topAlert.title}</span>
          </div>
          <div className="alert-pill-right">
            <span className="pill-action-text">Review Advisory</span>
            <ChevronRight size={16} />
          </div>
        </div>
      ) : (
        <div
          className="intel-clear-alert-pill clickable"
          onClick={() => setActivePage('alerts')}
          role="button"
          tabIndex={0}
          aria-label="No active weather alerts. Tap to view Alert Surveillance."
        >
          <div className="pill-clear-content">
            <CheckCircle2 size={16} className="text-emerald" />
            <span className="pill-clear-title">No Active Weather Advisories</span>
          </div>
          <div className="alert-pill-right">
            <span className="pill-action-text">Alert Center</span>
            <ChevronRight size={16} />
          </div>
        </div>
      )}

      {/* Diagnostics Quick Chips Row */}
      <div className="intel-chips-grid">
        {/* Air Quality Badge */}
        <div
          className="intel-chip-item clickable"
          onClick={() => setActivePage('airquality')}
          role="button"
          tabIndex={0}
          aria-label="View Air Quality dashboard"
        >
          <div className="chip-icon-box aqi">
            <Activity size={16} />
          </div>
          <div className="chip-meta">
            <span className="chip-label">Air Quality</span>
            <span className="chip-val">
              {airQuality && airQuality.aqi !== null
                ? `${airQuality.aqi} • ${airQuality.levelText}`
                : 'Telemetry Standby'}
            </span>
          </div>
          <ChevronRight size={14} className="chip-arrow" />
        </div>

        {/* UV Index Badge */}
        <div
          className="intel-chip-item clickable"
          onClick={() => setActivePage('details')}
          role="button"
          tabIndex={0}
          aria-label="View Atmospheric Details"
        >
          <div className="chip-icon-box uv">
            <Sun size={16} />
          </div>
          <div className="chip-meta">
            <span className="chip-label">Solar UV Index</span>
            <span className="chip-val">
              {uvVal >= 8
                ? `${uvVal.toFixed(1)} • Very High`
                : uvVal >= 6
                ? `${uvVal.toFixed(1)} • High`
                : uvVal >= 3
                ? `${uvVal.toFixed(1)} • Moderate`
                : `${uvVal.toFixed(1)} • Low`}
            </span>
          </div>
          <ChevronRight size={14} className="chip-arrow" />
        </div>

        {/* Rain Probability Badge */}
        <div
          className="intel-chip-item clickable"
          onClick={() => setActivePage('hourly')}
          role="button"
          tabIndex={0}
          aria-label="View Hourly Precipitation"
        >
          <div className="chip-icon-box rain">
            <CloudRain size={16} />
          </div>
          <div className="chip-meta">
            <span className="chip-label">Precipitation</span>
            <span className="chip-val">
              {rainProb > 50
                ? `${rainProb}% • Elevated Likelihood`
                : rainProb > 20
                ? `${rainProb}% • Scattered Chance`
                : `${rainProb}% • Low Likelihood`}
            </span>
          </div>
          <ChevronRight size={14} className="chip-arrow" />
        </div>

        {/* Map Shortcut Badge */}
        <div
          className="intel-chip-item clickable"
          onClick={() => setActivePage('map')}
          role="button"
          tabIndex={0}
          aria-label="Open Weather Map"
        >
          <div className="chip-icon-box map">
            <Layers size={16} />
          </div>
          <div className="chip-meta">
            <span className="chip-label">Synoptic Radar</span>
            <span className="chip-val">Explore Layers</span>
          </div>
          <ChevronRight size={14} className="chip-arrow" />
        </div>
      </div>

      {/* One-Sentence Environmental Summary */}
      <div className="intel-summary-footer">
        <p className="intel-summary-sentence">{generateEnvironmentalSummary()}</p>
      </div>
    </section>
  );
};
