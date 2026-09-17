import React from 'react';
import { Umbrella, CloudRain, Droplets } from 'lucide-react';
import { HourlyForecastItem } from '../../types/weather';
import { formatPrecipitation, formatPercentage } from '../../utils/formatters';
import './RainSummary.css';

interface RainSummaryProps {
  currentPrecipitation: number | null | undefined;
  rainSumToday?: number | null | undefined;
  hourlyItems: HourlyForecastItem[];
}

export const RainSummary: React.FC<RainSummaryProps> = ({
  currentPrecipitation,
  rainSumToday,
  hourlyItems
}) => {
  const next12Hours = hourlyItems.slice(0, 12);
  const maxProbabilityNext12 = Math.max(
    0,
    ...next12Hours.map((h) => h.precipitationProbability || 0)
  );
  const totalRainNext12 = next12Hours.reduce(
    (sum, h) => sum + (h.precipitation || h.rain || 0),
    0
  );

  const isRainExpected = maxProbabilityNext12 > 10 || totalRainNext12 > 0.1 || (currentPrecipitation || 0) > 0;

  return (
    <div className="glass-card rain-summary-card">
      <div className="rain-summary-header">
        <div className="rain-header-left">
          <CloudRain size={18} className="text-primary" />
          <span className="rain-heading">Precipitation &amp; Moisture</span>
        </div>
        {isRainExpected ? (
          <span className="rain-status-pill active">
            <Droplets size={12} />
            <span>{maxProbabilityNext12}% Max Risk</span>
          </span>
        ) : (
          <span className="rain-status-pill dry">Dry Conditions</span>
        )}
      </div>

      <div className="rain-metrics-overview">
        <div className="rain-metric-stat">
          <span className="rain-stat-label">Current Intensity</span>
          <span className="rain-stat-value">{formatPrecipitation(currentPrecipitation)}</span>
        </div>
        <div className="rain-metric-stat">
          <span className="rain-stat-label">Today's Total</span>
          <span className="rain-stat-value">
            {rainSumToday !== null && rainSumToday !== undefined ? formatPrecipitation(rainSumToday) : '-- mm'}
          </span>
        </div>
        <div className="rain-metric-stat">
          <span className="rain-stat-label">12h Rain Forecast</span>
          <span className="rain-stat-value">{formatPrecipitation(totalRainNext12)}</span>
        </div>
      </div>

      {!isRainExpected ? (
        <div className="no-rain-callout">
          <Umbrella size={20} className="text-emerald" />
          <div className="no-rain-text-block">
            <span className="no-rain-title">No significant precipitation expected</span>
            <span className="no-rain-subtitle">Clear radar trajectory over the next 12 hours.</span>
          </div>
        </div>
      ) : (
        <div className="rain-timeline-container">
          <span className="rain-timeline-title">Hourly Precipitation Probability Track</span>
          <div className="rain-bars-track">
            {next12Hours.map((hour, idx) => {
              const prob = hour.precipitationProbability || 0;
              return (
                <div key={hour.id || idx} className="rain-bar-column">
                  <div className="rain-bar-track-area">
                    <div
                      className="rain-bar-fill"
                      style={{ height: `${Math.max(4, prob)}%` }}
                      title={`${hour.time}: ${prob}% chance (${hour.precipitation || 0}mm)`}
                    />
                  </div>
                  <span className="rain-bar-percent">{prob > 0 ? `${prob}%` : '0%'}</span>
                  <span className="rain-bar-time">{hour.time.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
