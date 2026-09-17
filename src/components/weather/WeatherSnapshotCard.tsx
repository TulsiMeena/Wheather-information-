import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Download,
  X,
  Wind,
  Droplets,
  Sun,
  Shield,
  MapPin,
  Calendar
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { ExportService } from '../../services/exportService';
import { formatTemperature, formatWindSpeed } from '../../utils/formatters';
import './WeatherSnapshotCard.css';

interface WeatherSnapshotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeatherSnapshotModal: React.FC<WeatherSnapshotProps> = ({ isOpen, onClose }) => {
  const {
    currentLocation,
    currentWeather,
    airQuality,
    hourlyForecast,
    dailyForecast,
    settings,
    addToast
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!isOpen || !currentLocation) return null;

  const tempDisplay = currentWeather?.temperature !== null && currentWeather?.temperature !== undefined
    ? formatTemperature(currentWeather.temperature, settings.tempUnit)
    : '--';

  const highDisplay = currentWeather?.highTemp !== null && currentWeather?.highTemp !== undefined
    ? formatTemperature(currentWeather.highTemp, settings.tempUnit)
    : '--';

  const lowDisplay = currentWeather?.lowTemp !== null && currentWeather?.lowTemp !== undefined
    ? formatTemperature(currentWeather.lowTemp, settings.tempUnit)
    : '--';

  const feelsDisplay = currentWeather?.feelsLike !== null && currentWeather?.feelsLike !== undefined
    ? formatTemperature(currentWeather.feelsLike, settings.tempUnit)
    : '--';

  const windDisplay = currentWeather?.windSpeed !== null && currentWeather?.windSpeed !== undefined
    ? formatWindSpeed(currentWeather.windSpeed, settings.windUnit)
    : '--';

  const handleCopySummary = async () => {
    const summary = ExportService.generateTextSummary(
      currentLocation,
      currentWeather,
      airQuality,
      settings.tempUnit,
      settings.windUnit
    );
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Summary Copied',
        message: 'Weather snapshot copied to clipboard.'
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Unable to access system clipboard.'
      });
    }
  };

  const handleNativeShare = async () => {
    setSharing(true);
    const result = await ExportService.shareWeather(
      currentLocation,
      currentWeather,
      airQuality,
      settings.tempUnit,
      settings.windUnit
    );
    setSharing(false);

    if (result === 'shared') {
      addToast({
        type: 'success',
        title: 'Shared',
        message: 'Weather snapshot shared successfully.'
      });
    } else if (result === 'copied') {
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'Summary copied (native share unsupported on this device).'
      });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportCsv = () => {
    ExportService.exportToCsv({
      location: currentLocation,
      hourlyForecast,
      dailyForecast
    });
    addToast({
      type: 'info',
      title: 'CSV Generated',
      message: 'Weather dataset downloaded.'
    });
  };

  const handleExportJson = () => {
    ExportService.exportToJson({
      location: currentLocation,
      currentWeather,
      airQuality,
      hourlyForecast,
      dailyForecast
    });
    addToast({
      type: 'info',
      title: 'JSON Generated',
      message: 'Structured JSON telemetry exported.'
    });
  };

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="snapshot-modal-overlay" onClick={onClose} role="dialog" aria-label="Share Weather Snapshot">
      <div className="snapshot-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="snapshot-modal-header">
          <div className="modal-title-box">
            <Share2 size={20} className="text-primary" />
            <h2>Share & Export Telemetry</h2>
          </div>
          <button className="snapshot-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* The Card preview optimized for screenshots / visual sharing */}
        <div className="snapshot-card-preview" id="weather-snapshot-card">
          <div className="snapshot-card-glow" />
          
          <div className="snapshot-card-top">
            <div className="snapshot-location-meta">
              <div className="snapshot-city-line">
                <MapPin size={18} className="text-primary" />
                <span className="snapshot-city-name">{currentLocation.name}</span>
              </div>
              <span className="snapshot-sub-loc">
                {currentLocation.region || currentLocation.state ? `${currentLocation.region || currentLocation.state}, ` : ''}
                {currentLocation.country}
              </span>
            </div>

            <div className="snapshot-date-badge">
              <Calendar size={14} />
              <span>{dateStr}</span>
            </div>
          </div>

          <div className="snapshot-hero-body">
            <div className="snapshot-temp-row">
              <span className="snapshot-temp-giant">{tempDisplay}</span>
              <div className="snapshot-condition-column">
                <span className="snapshot-cond-text">{currentWeather?.conditionText || 'Fair Weather'}</span>
                <span className="snapshot-feels">Feels like {feelsDisplay}</span>
                <div className="snapshot-hi-lo">
                  <span>H: {highDisplay}</span>
                  <span>•</span>
                  <span>L: {lowDisplay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Key Atmospheric Metrics */}
          <div className="snapshot-metrics-grid">
            <div className="snapshot-metric-item">
              <Droplets size={16} className="text-blue" />
              <div className="metric-text-group">
                <span className="m-label">Rain Chance</span>
                <span className="m-val">{currentWeather?.precipitationProbability ?? 0}%</span>
              </div>
            </div>

            <div className="snapshot-metric-item">
              <Wind size={16} className="text-teal" />
              <div className="metric-text-group">
                <span className="m-label">Wind Speed</span>
                <span className="m-val">{windDisplay}</span>
              </div>
            </div>

            <div className="snapshot-metric-item">
              <Sun size={16} className="text-amber" />
              <div className="metric-text-group">
                <span className="m-label">UV Index</span>
                <span className="m-val">{currentWeather?.uvIndex ?? '--'}</span>
              </div>
            </div>

            <div className="snapshot-metric-item">
              <Shield size={16} className="text-emerald" />
              <div className="metric-text-group">
                <span className="m-label">Air Quality</span>
                <span className="m-val">
                  {airQuality?.aqi !== null && airQuality?.aqi !== undefined
                    ? `AQI ${airQuality.aqi}`
                    : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="snapshot-footer-watermark">
            <span>Amit Meena • Weather Intelligence</span>
            <span>Open-Meteo Verified Telemetry</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="snapshot-actions-bar">
          <button
            className="btn btn-primary action-btn"
            onClick={handleNativeShare}
            disabled={sharing}
          >
            <Share2 size={16} />
            <span>{sharing ? 'Sharing...' : 'Share Weather'}</span>
          </button>

          <button
            className="btn btn-secondary action-btn"
            onClick={handleCopySummary}
          >
            {copied ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            className="btn btn-secondary action-btn"
            onClick={handleExportCsv}
            title="Download CSV file of forecast"
          >
            <Download size={16} />
            <span>CSV</span>
          </button>

          <button
            className="btn btn-secondary action-btn"
            onClick={handleExportJson}
            title="Export JSON payload"
          >
            <Download size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
