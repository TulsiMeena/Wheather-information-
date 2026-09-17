import React from 'react';
import { Clock, Droplets, Wind, ArrowRight } from 'lucide-react';
import { HourlyForecastItem, TemperatureUnit, WindSpeedUnit } from '../../types/weather';
import { formatTemperature, formatWindSpeed, formatPercentage } from '../../utils/formatters';
import { WeatherIcon } from '../common/WeatherIcon';
import './HourlyScroller.css';

interface HourlyScrollerProps {
  hourlyItems: HourlyForecastItem[];
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
  onViewAll?: () => void;
}

export const HourlyScroller: React.FC<HourlyScrollerProps> = ({
  hourlyItems,
  tempUnit,
  windUnit,
  onViewAll
}) => {
  const next24 = hourlyItems.slice(0, 24);

  return (
    <div className="glass-card hourly-scroller-card">
      <div className="hourly-scroller-header">
        <div className="hourly-header-left">
          <Clock size={18} className="text-primary" />
          <span className="hourly-scroller-title">24-Hour Micro Forecast</span>
        </div>
        {onViewAll && (
          <button className="btn-ghost scroller-view-all" onClick={onViewAll}>
            <span>Full Timeline</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div className="hourly-scroll-strip" tabIndex={0} role="region" aria-label="Hourly weather progression">
        {next24.map((hour, idx) => {
          const isCurrentHour = hour.isNow || idx === 0;
          return (
            <div
              key={hour.id || idx}
              className={`hourly-snap-card ${isCurrentHour ? 'active-hour' : ''}`}
            >
              <span className="hourly-snap-time">
                {isCurrentHour ? 'NOW' : hour.time.split(' ')[0]}
              </span>

              <div className="hourly-snap-icon">
                <WeatherIcon
                  condition={hour.condition}
                  isDaytime={hour.isDaytime ?? true}
                  size={26}
                />
              </div>

              <span className="hourly-snap-temp">
                {formatTemperature(hour.temperature, tempUnit)}
              </span>

              <div
                className={`hourly-snap-rain ${(hour.precipitationProbability ?? 0) > 0 ? 'has-rain' : ''}`}
                title={`Rain probability: ${hour.precipitationProbability ?? 0}%`}
              >
                <Droplets size={11} />
                <span>{formatPercentage(hour.precipitationProbability)}</span>
              </div>

              <div className="hourly-snap-wind" title={`Wind: ${hour.windSpeed ?? 0} ${windUnit}`}>
                <Wind size={10} />
                <span>{Math.round(hour.windSpeed ?? 0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
