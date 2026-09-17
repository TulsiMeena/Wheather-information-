import React from 'react';
import { Wind, Compass } from 'lucide-react';
import { WindSpeedUnit } from '../../types/weather';
import { formatWindSpeed, getWindCardinalDirection } from '../../utils/formatters';
import './WindGauge.css';

interface WindGaugeProps {
  speed: number | null | undefined;
  direction: number | null | undefined;
  gusts?: number | null | undefined;
  unit?: WindSpeedUnit;
}

export const WindGauge: React.FC<WindGaugeProps> = ({
  speed,
  direction,
  gusts,
  unit = 'km/h'
}) => {
  const cardinal = getWindCardinalDirection(direction);
  const degrees = direction ?? 0;

  return (
    <div className="glass-card wind-gauge-card">
      <div className="wind-gauge-header">
        <div className="wind-header-title">
          <Wind size={18} className="text-primary" />
          <span className="wind-gauge-heading">Wind &amp; Gusts</span>
        </div>
        <span className="wind-cardinal-badge">{cardinal}</span>
      </div>

      <div className="wind-gauge-body">
        {/* Compact Visual Compass */}
        <div className="compass-visual-wrapper" aria-label={`Wind direction: ${degrees} degrees, ${cardinal}`}>
          <div className="compass-ring">
            <span className="compass-mark mark-n">N</span>
            <span className="compass-mark mark-e">E</span>
            <span className="compass-mark mark-s">S</span>
            <span className="compass-mark mark-w">W</span>
            <div
              className="compass-needle-wrapper"
              style={{ transform: `rotate(${degrees}deg)` }}
            >
              <div className="compass-needle-arrow" />
              <div className="compass-needle-pivot" />
            </div>
          </div>
          <span className="compass-degrees-text">{degrees}°</span>
        </div>

        {/* Wind Speed & Gusts Telemetry */}
        <div className="wind-telemetry-data">
          <div className="wind-stat-block">
            <span className="wind-stat-label">Sustained Wind</span>
            <span className="wind-stat-value">{formatWindSpeed(speed, unit)}</span>
          </div>

          <div className="wind-stat-block">
            <span className="wind-stat-label">Peak Gusts</span>
            <span className="wind-stat-value">
              {gusts !== null && gusts !== undefined ? formatWindSpeed(gusts, unit) : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
