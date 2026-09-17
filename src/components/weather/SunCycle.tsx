import React from 'react';
import { Sunrise, Sunset, Moon, Sun } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import './SunCycle.css';

interface SunCycleProps {
  sunrise: string | null | undefined;
  sunset: string | null | undefined;
  daylightDurationHours?: number;
}

export const SunCycle: React.FC<SunCycleProps> = ({
  sunrise,
  sunset,
  daylightDurationHours
}) => {
  // Parse and calculate daylight progression
  const now = new Date();
  let progressPercent = 0;
  let isNight = false;
  let subStatus = '';

  if (sunrise && sunset) {
    const riseDate = new Date(sunrise);
    const setDate = new Date(sunset);

    if (!isNaN(riseDate.getTime()) && !isNaN(setDate.getTime())) {
      const nowMs = now.getTime();
      const riseMs = riseDate.getTime();
      const setMs = setDate.getTime();

      if (nowMs < riseMs) {
        // Pre-dawn
        isNight = true;
        const diffMins = Math.round((riseMs - nowMs) / (1000 * 60));
        subStatus = `Dawn in ~${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
        progressPercent = 0;
      } else if (nowMs > setMs) {
        // Post-dusk
        isNight = true;
        subStatus = 'Night cycle active';
        progressPercent = 100;
      } else {
        // Daytime
        isNight = false;
        const totalDaylightMs = setMs - riseMs;
        const elapsedMs = nowMs - riseMs;
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDaylightMs) * 100)));
        const remainMins = Math.round((setMs - nowMs) / (1000 * 60));
        subStatus = `${Math.floor(remainMins / 60)}h ${remainMins % 60}m of daylight left`;
      }
    }
  }

  return (
    <div className="glass-card sun-cycle-card">
      <div className="sun-cycle-header">
        <div className="sun-header-title">
          {isNight ? (
            <Moon size={18} className="text-indigo-400" />
          ) : (
            <Sun size={18} className="text-amber" />
          )}
          <span className="sun-heading">Solar Arc &amp; Cycle</span>
        </div>
        <span className={`sun-phase-pill ${isNight ? 'phase-night' : 'phase-day'}`}>
          {isNight ? 'Night' : `${progressPercent}% Daylight`}
        </span>
      </div>

      {/* Progress Arc Line */}
      <div className="sun-progress-track">
        <div
          className="sun-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="sun-orb-indicator"
          style={{ left: `${progressPercent}%` }}
          title={`Solar progression: ${progressPercent}%`}
        >
          {isNight ? <Moon size={12} /> : <Sun size={12} />}
        </div>
      </div>

      <div className="sun-times-row">
        <div className="sun-time-item">
          <Sunrise size={16} className="text-amber" />
          <div className="sun-time-text">
            <span className="time-sub-label">Sunrise</span>
            <span className="time-value">{formatTime(sunrise)}</span>
          </div>
        </div>

        <div className="sun-status-center">
          <span className="sun-duration-text">
            {daylightDurationHours
              ? `${daylightDurationHours.toFixed(1)} hrs daylight`
              : subStatus}
          </span>
        </div>

        <div className="sun-time-item right">
          <Sunset size={16} className="text-orange-400" />
          <div className="sun-time-text">
            <span className="time-sub-label">Sunset</span>
            <span className="time-value">{formatTime(sunset)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
