import React, { useState } from 'react';
import {
  Activity,
  Heart,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Info,
  ShieldAlert,
  Flame,
  Droplets,
  Wind
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { AqiTrendChart } from '../components/airQuality/AqiTrendChart';
import './AirQualityPage.css';

type AqiScale = 'us' | 'eu';

export const AirQualityPage: React.FC = () => {
  const {
    currentLocation,
    airQuality,
    airQualityFreshness,
    airQualityError,
    refreshData,
    isLoading
  } = useApp();

  const [selectedScale, setSelectedScale] = useState<AqiScale>('us');

  const hasAqiData = airQuality !== null && (airQuality.us_aqi !== null || airQuality.european_aqi !== null);

  const displayAqi = selectedScale === 'us'
    ? airQuality?.us_aqi ?? airQuality?.aqi ?? null
    : airQuality?.european_aqi ?? null;

  // Pollutant severity calculator
  const getPollutantStatus = (key: string, val: number | null | undefined) => {
    if (val === null || val === undefined) return { label: 'Unavailable', color: '#64748b', pct: 0 };
    switch (key) {
      case 'pm2_5':
        if (val <= 12) return { label: 'Good', color: '#10b981', pct: Math.min((val / 55) * 100, 100) };
        if (val <= 35.4) return { label: 'Moderate', color: '#f59e0b', pct: Math.min((val / 55) * 100, 100) };
        if (val <= 55.4) return { label: 'Unhealthy (Sens.)', color: '#f97316', pct: Math.min((val / 150) * 100, 100) };
        return { label: 'Unhealthy', color: '#ef4444', pct: 100 };
      case 'pm10':
        if (val <= 54) return { label: 'Good', color: '#10b981', pct: Math.min((val / 150) * 100, 100) };
        if (val <= 154) return { label: 'Moderate', color: '#f59e0b', pct: Math.min((val / 250) * 100, 100) };
        return { label: 'Elevated', color: '#ef4444', pct: 100 };
      case 'o3':
        if (val <= 100) return { label: 'Normal', color: '#10b981', pct: Math.min((val / 180) * 100, 100) };
        return { label: 'High', color: '#f97316', pct: Math.min((val / 240) * 100, 100) };
      case 'no2':
        if (val <= 40) return { label: 'Good', color: '#10b981', pct: Math.min((val / 100) * 100, 100) };
        return { label: 'Moderate', color: '#f59e0b', pct: 75 };
      case 'co':
        if (val <= 4000) return { label: 'Safe', color: '#10b981', pct: Math.min((val / 10000) * 100, 100) };
        return { label: 'Elevated', color: '#ef4444', pct: 85 };
      case 'so2':
        if (val <= 20) return { label: 'Normal', color: '#10b981', pct: Math.min((val / 50) * 100, 100) };
        return { label: 'Caution', color: '#f59e0b', pct: 70 };
      default:
        return { label: 'Acceptable', color: '#10b981', pct: 50 };
    }
  };

  const pollutants = [
    {
      key: 'pm2_5',
      name: 'PM2.5',
      label: 'Fine Inhalable Particulates',
      unit: 'µg/m³',
      value: airQuality?.pm2_5,
      description: 'Particles ≤ 2.5 µm that penetrate deep into lung tissue.'
    },
    {
      key: 'pm10',
      name: 'PM10',
      label: 'Coarse Dust Particulates',
      unit: 'µg/m³',
      value: airQuality?.pm10,
      description: 'Inhalable particles such as dust, pollen, and roadway debris.'
    },
    {
      key: 'o3',
      name: 'O₃',
      label: 'Ground-Level Ozone',
      unit: 'µg/m³',
      value: airQuality?.o3,
      description: 'Formed through photochemical reactions involving sunlight and NOx.'
    },
    {
      key: 'no2',
      name: 'NO₂',
      label: 'Nitrogen Dioxide',
      unit: 'µg/m³',
      value: airQuality?.no2,
      description: 'Emitted predominantly from vehicular engines and industrial combustion.'
    },
    {
      key: 'co',
      name: 'CO',
      label: 'Carbon Monoxide',
      unit: 'µg/m³',
      value: airQuality?.co,
      description: 'Colorless, odorless gas produced by incomplete hydrocarbon burning.'
    },
    {
      key: 'so2',
      name: 'SO₂',
      label: 'Sulfur Dioxide',
      unit: 'µg/m³',
      value: airQuality?.so2,
      description: 'Atmospheric pollutant emitted from smelting and coal generation.'
    }
  ];

  const severityLevels = [
    { range: '0 - 50', label: 'Good', color: '#10b981' },
    { range: '51 - 100', label: 'Moderate', color: '#f59e0b' },
    { range: '101 - 150', label: 'Unhealthy (Sens.)', color: '#f97316' },
    { range: '151 - 200', label: 'Unhealthy', color: '#ef4444' },
    { range: '201 - 300', label: 'Very Unhealthy', color: '#8b5cf6' },
    { range: '301+', label: 'Hazardous', color: '#7f1d1d' }
  ];

  const getFreshnessLabel = () => {
    if (airQualityFreshness === 'fresh') return 'Real-Time Air Quality Active';
    if (airQualityFreshness === 'cached') return 'Using Verified Cached Snapshot';
    if (airQualityFreshness === 'stale') return 'Stale Telemetry Feed';
    return 'Air Quality Temporarily Unavailable';
  };

  return (
    <div className="page-container aqi-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Air Quality Intelligence</h1>
          <p className="page-subtitle">
            {currentLocation
              ? `Real-time aerosol & pollutant metrics for ${currentLocation.name}`
              : 'Atmospheric telemetry station'}
          </p>
        </div>

        {/* Data Freshness Indicator */}
        <div className="aqi-freshness-chip">
          <Clock size={14} className="text-primary" />
          <span>{getFreshnessLabel()}</span>
        </div>
      </div>

      {/* Graceful Partial Error State */}
      {airQualityFreshness === 'unavailable' && (
        <div className="glass-card aqi-fallback-alert" role="alert">
          <AlertCircle size={20} className="text-amber" />
          <div className="fallback-text">
            <strong>Air Quality Telemetry Temporarily Unavailable</strong>
            <p>
              The meteorological station for {currentLocation?.name || 'this location'} did not return
              valid pollutant measurements at this time. Standard weather reports remain fully operational.
            </p>
          </div>
          <button
            className="btn btn-secondary retry-aqi-btn"
            onClick={() => refreshData(true)}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Retry Feed</span>
          </button>
        </div>
      )}

      {/* Main AQI Hero Gauge Card */}
      <section className="glass-card aqi-hero-card" aria-label="AQI Overall Severity">
        <div className="aqi-hero-top">
          {/* Scale Selector */}
          <div className="aqi-scale-toggle" role="group" aria-label="AQI Calculation Standard">
            <button
              className={`scale-tab ${selectedScale === 'us' ? 'active' : ''}`}
              onClick={() => setSelectedScale('us')}
            >
              US EPA AQI (0–500)
            </button>
            <button
              className={`scale-tab ${selectedScale === 'eu' ? 'active' : ''}`}
              onClick={() => setSelectedScale('eu')}
            >
              European AQI (0–100)
            </button>
          </div>

          <span className="aqi-standard-badge">
            {selectedScale === 'us' ? 'United States EPA Standard' : 'European EAQI Index'}
          </span>
        </div>

        <div className="aqi-main-layout">
          <div className="aqi-meter-box">
            <div className="aqi-circle-ring">
              <span className="aqi-score-number">{displayAqi !== null ? displayAqi : '--'}</span>
              <span className="aqi-score-unit">{selectedScale === 'us' ? 'US AQI' : 'EU AQI'}</span>
            </div>
          </div>

          <div className="aqi-status-overview">
            <span className="aqi-status-badge">
              <Activity size={16} />
              <span>{hasAqiData ? airQuality.levelText : 'Telemetry Unavailable'}</span>
            </span>
            <h2 className="aqi-headline">
              {hasAqiData
                ? `Atmosphere is ${airQuality.levelText}`
                : 'Awaiting station atmospheric stream'}
            </h2>
            <p className="aqi-health-advice">
              {hasAqiData
                ? airQuality.recommendation
                : 'Air quality metrics continuously analyze microscopic airborne particulates to keep you informed of environmental conditions.'}
            </p>
          </div>
        </div>

        {/* Severity Scale Legend */}
        <div className="severity-scale-container" aria-label="AQI Severity Scale">
          <span className="scale-title">US AQI BENCHMARK THRESHOLDS</span>
          <div className="severity-ticks-grid">
            {severityLevels.map((lvl, index) => (
              <div key={index} className="severity-tick-item">
                <div className="tick-color-bar" style={{ backgroundColor: lvl.color }} />
                <span className="tick-label">{lvl.label}</span>
                <span className="tick-range">{lvl.range}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 24-Hour Trend Trajectory Chart */}
      {airQuality?.hourlyTrends && airQuality.hourlyTrends.length > 0 && (
        <section aria-label="Air Quality 24-Hour Trend">
          <AqiTrendChart data={airQuality.hourlyTrends} />
        </section>
      )}

      {/* Individual Pollutants Grid */}
      <section className="pollutants-section" aria-label="Individual Pollutant Breakdown">
        <div className="section-title-row">
          <h2 className="section-heading">Detailed Pollutant Breakdown</h2>
          <span className="pollutant-source-note">Source: Open-Meteo Atmospheric Chemistry</span>
        </div>

        <div className="pollutants-grid">
          {pollutants.map((p) => {
            const status = getPollutantStatus(p.key, p.value);
            return (
              <div key={p.key} className="glass-card pollutant-card">
                <div className="pollutant-header">
                  <span className="pollutant-code">{p.name}</span>
                  <span
                    className="pollutant-status-pill"
                    style={{ color: status.color, borderColor: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
                <span className="pollutant-title">{p.label}</span>
                <div className="pollutant-val-row">
                  <span className="pollutant-number">
                    {p.value !== null && p.value !== undefined ? p.value : 'Unavailable'}
                  </span>
                  {p.value !== null && p.value !== undefined && (
                    <span className="pollutant-unit">{p.unit}</span>
                  )}
                </div>
                <div className="pollutant-bar-track">
                  <div
                    className="pollutant-bar-fill"
                    style={{ width: `${status.pct}%`, backgroundColor: status.color }}
                  />
                </div>
                <p className="pollutant-desc">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Precautionary Health Guidance (Factual non-medical recommendations) */}
      <section className="glass-card health-guide-card" aria-label="Precautionary Environmental Guidance">
        <div className="guide-title-row">
          <Heart size={18} className="text-primary" />
          <h3 className="guide-title">Precautionary Activity Guidelines</h3>
        </div>
        <div className="guide-items-grid">
          <div className="guide-item">
            <CheckCircle2 size={18} className="text-emerald" />
            <div className="guide-meta">
              <strong>General Population Outdoor Activity</strong>
              <p>
                When the Air Quality Index is between 0 and 50, conditions are ideal for outdoor sports,
                walks, and cycling with minimal environmental resistance.
              </p>
            </div>
          </div>
          <div className="guide-item">
            <AlertCircle size={18} className="text-amber" />
            <div className="guide-meta">
              <strong>Sensitive Respiratory Groups</strong>
              <p>
                Individuals with asthma or cardiopulmonary sensitivities should monitor PM2.5 levels
                when the index exceeds 100, and consider scheduling strenuous workouts indoors.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
