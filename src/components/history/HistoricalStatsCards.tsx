import React from 'react';
import {
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Sun,
  Cloud,
  Trophy,
  CalendarCheck,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  HistoricalStatistics,
  PeriodRecordItem,
  PeriodSummary,
  ForecastVsHistoryComparison,
  TemperatureUnit,
  WindSpeedUnit
} from '../../types/weather';
import { formatTemperature, formatWindSpeed } from '../../utils/formatters';
import './HistoricalStatsCards.css';

interface HistoricalStatsCardsProps {
  stats: HistoricalStatistics;
  records: PeriodRecordItem[];
  summary: PeriodSummary;
  comparison: ForecastVsHistoryComparison | null;
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
}

export const HistoricalStatsCards: React.FC<HistoricalStatsCardsProps> = ({
  stats,
  records,
  summary,
  comparison,
  tempUnit,
  windUnit
}) => {
  return (
    <div className="history-stats-section">
      {/* 1. Period Summary Hero Card */}
      <div className="period-summary-card glass-card">
        <div className="card-header-line">
          <div className="header-title-box">
            <CalendarCheck size={20} className="text-primary" />
            <h3>Interval Climatological Summary</h3>
          </div>
          <span className="coverage-badge">
            {stats.validDaysCount} / {stats.totalDays} Days Recorded
          </span>
        </div>

        <div className="summary-metrics-grid">
          <div className="summary-metric-box">
            <span className="s-label">Mean Ambient Temp</span>
            <span className="s-value primary">
              {stats.avgTemp !== null ? formatTemperature(stats.avgTemp, tempUnit) : '--'}
            </span>
          </div>

          <div className="summary-metric-box">
            <span className="s-label">Cumulative Precipitation</span>
            <span className="s-value blue">
              {stats.totalPrecipitation !== null ? `${stats.totalPrecipitation} mm` : '0 mm'}
            </span>
          </div>

          <div className="summary-metric-box">
            <span className="s-label">Warmest Day</span>
            <span className="s-value orange">
              {summary.warmestDay ? summary.warmestDay.temp : '--'}
            </span>
            <span className="s-sub">{summary.warmestDay ? summary.warmestDay.date : 'None'}</span>
          </div>

          <div className="summary-metric-box">
            <span className="s-label">Wettest Day</span>
            <span className="s-value cyan">
              {summary.wettestDay ? summary.wettestDay.precip : '--'}
            </span>
            <span className="s-sub">{summary.wettestDay ? summary.wettestDay.date : 'No Rain Recorded'}</span>
          </div>

          <div className="summary-metric-box">
            <span className="s-label">Peak Wind Velocity</span>
            <span className="s-value teal">
              {summary.strongestWindDay ? summary.strongestWindDay.wind : '--'}
            </span>
            <span className="s-sub">{summary.strongestWindDay ? summary.strongestWindDay.date : 'Calm'}</span>
          </div>
        </div>
      </div>

      {/* 2. Highest in Selected Period (Records) */}
      {records.length > 0 && (
        <div className="records-card glass-card">
          <div className="card-header-line">
            <div className="header-title-box">
              <Trophy size={18} className="text-amber" />
              <h3>Period Climatological Records</h3>
            </div>
            <span className="records-note">Observed Extrema</span>
          </div>

          <div className="records-grid">
            {records.map((rec, idx) => (
              <div key={idx} className={`record-pill ${rec.type}`}>
                <div className="rec-info">
                  <span className="rec-type-title">{rec.label}</span>
                  <span className="rec-val">{rec.formattedValue}</span>
                </div>
                <div className="rec-meta">
                  <span className="rec-date">{rec.date}</span>
                  <span className="rec-loc">{rec.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detailed Parameter Cards */}
      <div className="metrics-cards-grid">
        {/* Thermal Card */}
        <div className="metric-stat-card glass-card">
          <div className="m-card-header">
            <Thermometer size={18} className="text-orange" />
            <h4>Thermal Extremes</h4>
          </div>
          <div className="m-card-body">
            <div className="m-data-row">
              <span className="m-row-lbl">Max Recorded</span>
              <span className="m-row-val max">
                {stats.maxTemp !== null ? formatTemperature(stats.maxTemp, tempUnit) : '--'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Mean Average</span>
              <span className="m-row-val">
                {stats.avgTemp !== null ? formatTemperature(stats.avgTemp, tempUnit) : '--'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Min Recorded</span>
              <span className="m-row-val min">
                {stats.minTemp !== null ? formatTemperature(stats.minTemp, tempUnit) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Rain Card */}
        <div className="metric-stat-card glass-card">
          <div className="m-card-header">
            <CloudRain size={18} className="text-blue" />
            <h4>Precipitation & Rain</h4>
          </div>
          <div className="m-card-body">
            <div className="m-data-row">
              <span className="m-row-lbl">Total Precipitation</span>
              <span className="m-row-val blue">
                {stats.totalPrecipitation !== null ? `${stats.totalPrecipitation} mm` : '0 mm'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Wettest 24h</span>
              <span className="m-row-val">
                {summary.wettestDay ? summary.wettestDay.precip : '0 mm'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Atmospheric Moisture</span>
              <span className="m-row-val">
                {stats.avgHumidity !== null ? `${stats.avgHumidity}%` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Wind Card */}
        <div className="metric-stat-card glass-card">
          <div className="m-card-header">
            <Wind size={18} className="text-teal" />
            <h4>Wind & Dynamics</h4>
          </div>
          <div className="m-card-body">
            <div className="m-data-row">
              <span className="m-row-lbl">Peak Velocity</span>
              <span className="m-row-val teal">
                {stats.maxWind !== null ? formatWindSpeed(stats.maxWind, windUnit) : '--'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Mean Wind Speed</span>
              <span className="m-row-val">
                {stats.avgWind !== null ? formatWindSpeed(stats.avgWind, windUnit) : '--'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Observed Peak Day</span>
              <span className="m-row-val">
                {summary.strongestWindDay ? summary.strongestWindDay.date : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Radiation & Cloud Cover */}
        <div className="metric-stat-card glass-card">
          <div className="m-card-header">
            <Sun size={18} className="text-amber" />
            <h4>Radiation & Cloudiness</h4>
          </div>
          <div className="m-card-body">
            <div className="m-data-row">
              <span className="m-row-lbl">Mean Cloud Cover</span>
              <span className="m-row-val">
                {stats.avgCloudCover !== null ? `${stats.avgCloudCover}%` : '--'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Peak UV Index</span>
              <span className="m-row-val amber">
                {stats.maxUv !== null ? stats.maxUv : 'Sensor N/A'}
              </span>
            </div>
            <div className="m-data-row">
              <span className="m-row-lbl">Sky Clearness</span>
              <span className="m-row-val">
                {stats.avgCloudCover !== null ? `${100 - stats.avgCloudCover}%` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Forecast vs History Comparative Card */}
      {comparison && (
        <div className="comparison-card glass-card">
          <div className="card-header-line">
            <div className="header-title-box">
              <TrendingUp size={18} className="text-emerald" />
              <h3>Forecast Baseline vs. Historical Period</h3>
            </div>
            <span className="comparison-tag">Synoptic Shift</span>
          </div>

          <div className="comparison-grid">
            <div className="comparison-item">
              <span className="c-label">Mean Temperature Delta</span>
              <div className="c-val-group">
                <span className={`c-delta ${comparison.tempDiff && comparison.tempDiff > 0 ? 'warmer' : 'cooler'}`}>
                  {comparison.tempDiff !== null
                    ? `${comparison.tempDiff > 0 ? '+' : ''}${formatTemperature(comparison.tempDiff, tempUnit)}`
                    : '--'}
                </span>
                <span className="c-sub">
                  Forecast {comparison.forecastAvgTemp !== null ? formatTemperature(comparison.forecastAvgTemp, tempUnit) : '--'} vs History {comparison.historyAvgTemp !== null ? formatTemperature(comparison.historyAvgTemp, tempUnit) : '--'}
                </span>
              </div>
            </div>

            <div className="comparison-item">
              <span className="c-label">Precipitation Variance</span>
              <div className="c-val-group">
                <span className="c-delta blue">
                  {comparison.precipDiff !== null ? `${comparison.precipDiff > 0 ? '+' : ''}${comparison.precipDiff} mm` : '--'}
                </span>
                <span className="c-sub">
                  Expected 7d: {comparison.forecastTotalPrecip ?? 0} mm vs Period: {comparison.historyTotalPrecip ?? 0} mm
                </span>
              </div>
            </div>

            <div className="comparison-item">
              <span className="c-label">Wind Velocity Variance</span>
              <div className="c-val-group">
                <span className="c-delta teal">
                  {comparison.windDiff !== null ? `${comparison.windDiff > 0 ? '+' : ''}${formatWindSpeed(comparison.windDiff, windUnit)}` : '--'}
                </span>
                <span className="c-sub">
                  Forecast: {comparison.forecastAvgWind ? formatWindSpeed(comparison.forecastAvgWind, windUnit) : '--'} vs Historical: {comparison.historyAvgWind ? formatWindSpeed(comparison.historyAvgWind, windUnit) : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="comparison-disclaimer">
            <AlertTriangle size={14} className="text-muted" />
            <span>{comparison.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
