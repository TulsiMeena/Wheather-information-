import React, { useState } from 'react';
import { HourlyAqiItem } from '../../types/weather';
import './AqiTrendChart.css';

interface AqiTrendChartProps {
  data: HourlyAqiItem[];
}

type MetricType = 'aqi' | 'pm2_5' | 'pm10';

export const AqiTrendChart: React.FC<AqiTrendChartProps> = ({ data }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('aqi');
  const [hoveredItem, setHoveredItem] = useState<HourlyAqiItem | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="aqi-chart-empty-state">
        <p>Hourly air quality trajectory is not available for this location.</p>
      </div>
    );
  }

  // Filter valid values
  const validPoints = data.map((d) => {
    let val: number | null = null;
    if (activeMetric === 'aqi') val = d.aqi;
    else if (activeMetric === 'pm2_5') val = d.pm2_5;
    else if (activeMetric === 'pm10') val = d.pm10 ?? null;
    return { ...d, value: val };
  });

  const numericVals = validPoints.map((p) => p.value).filter((v): v is number => v !== null);
  const maxVal = numericVals.length > 0 ? Math.max(...numericVals, activeMetric === 'aqi' ? 100 : 35) : 100;
  const minVal = 0;
  const valRange = maxVal - minVal || 1;

  // Chart dimensions
  const chartHeight = 120;
  const itemWidth = 56;
  const totalWidth = Math.max(data.length * itemWidth, 680);

  // SVG coordinates calculation
  const points = validPoints.map((p, idx) => {
    const x = idx * itemWidth + itemWidth / 2;
    const yVal = p.value !== null ? p.value : minVal;
    const y = chartHeight - ((yVal - minVal) / valRange) * (chartHeight - 32) - 16;
    return { x, y, raw: p };
  });

  // Generate smooth SVG path
  const linePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  // Area path
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`
    : '';

  const getMetricColor = (val: number | null) => {
    if (val === null) return '#94a3b8';
    if (activeMetric === 'aqi') {
      if (val <= 50) return '#10b981';
      if (val <= 100) return '#f59e0b';
      if (val <= 150) return '#f97316';
      if (val <= 200) return '#ef4444';
      if (val <= 300) return '#8b5cf6';
      return '#7f1d1d';
    } else {
      if (val <= 12) return '#10b981';
      if (val <= 35) return '#f59e0b';
      if (val <= 55) return '#f97316';
      return '#ef4444';
    }
  };

  const getMetricUnit = () => {
    if (activeMetric === 'aqi') return 'AQI';
    return 'µg/m³';
  };

  return (
    <div className="aqi-trend-chart-card glass-card" aria-label="Hourly Air Quality Trend">
      <div className="aqi-trend-header">
        <div>
          <h3 className="aqi-trend-title">24-Hour Air Quality Trajectory</h3>
          <p className="aqi-trend-subtitle">Continuous hourly atmospheric monitoring</p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="aqi-metric-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeMetric === 'aqi'}
            className={`metric-tab-btn ${activeMetric === 'aqi' ? 'active' : ''}`}
            onClick={() => setActiveMetric('aqi')}
          >
            AQI Trend
          </button>
          <button
            role="tab"
            aria-selected={activeMetric === 'pm2_5'}
            className={`metric-tab-btn ${activeMetric === 'pm2_5' ? 'active' : ''}`}
            onClick={() => setActiveMetric('pm2_5')}
          >
            PM2.5 Trend
          </button>
          <button
            role="tab"
            aria-selected={activeMetric === 'pm10'}
            className={`metric-tab-btn ${activeMetric === 'pm10' ? 'active' : ''}`}
            onClick={() => setActiveMetric('pm10')}
          >
            PM10 Trend
          </button>
        </div>
      </div>

      {/* Interactive Tooltip Card if hovering */}
      <div className="aqi-tooltip-dock">
        {hoveredItem ? (
          <div className="aqi-tooltip-content">
            <span className="tooltip-time">{hoveredItem.hour}</span>
            <span className="tooltip-val" style={{ color: getMetricColor(activeMetric === 'aqi' ? hoveredItem.aqi : activeMetric === 'pm2_5' ? hoveredItem.pm2_5 : hoveredItem.pm10 ?? null) }}>
              {activeMetric === 'aqi'
                ? `${hoveredItem.aqi ?? '--'} AQI`
                : activeMetric === 'pm2_5'
                ? `${hoveredItem.pm2_5 ?? '--'} µg/m³`
                : `${hoveredItem.pm10 ?? '--'} µg/m³`}
            </span>
          </div>
        ) : (
          <span className="tooltip-instruction">Tap or hover over any hour to inspect reading</span>
        )}
      </div>

      {/* Horizontal Scrollable Timeline Chart */}
      <div className="aqi-chart-scroll-viewport" tabIndex={0} aria-label="Hourly trend horizontal scroll area">
        <div className="aqi-chart-canvas-container" style={{ width: `${totalWidth}px` }}>
          <svg className="aqi-chart-svg" width={totalWidth} height={chartHeight}>
            <defs>
              <linearGradient id="aqiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Guide Lines */}
            <line x1="0" y1={chartHeight - 16} x2={totalWidth} y2={chartHeight - 16} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight / 2} x2={totalWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#aqiAreaGradient)" />}

            {/* Smooth Trajectory Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Interactive Data Dots & Current Hour Pulse */}
            {points.map((pt, idx) => {
              const val = pt.raw.value;
              const color = getMetricColor(val);
              const isSelected = hoveredItem?.time === pt.raw.time;
              const isNow = pt.raw.isNow;

              return (
                <g
                  key={idx}
                  className="chart-point-group"
                  onMouseEnter={() => setHoveredItem(pt.raw)}
                  onClick={() => setHoveredItem(pt.raw)}
                >
                  {isNow && (
                    <circle cx={pt.x} cy={pt.y} r="10" fill="rgba(59, 130, 246, 0.25)" className="now-point-pulse" />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected || isNow ? 5 : 3.5}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* Time Labels Track */}
          <div className="aqi-timeline-labels">
            {data.map((item, idx) => (
              <div
                key={idx}
                className={`timeline-hour-slot ${item.isNow ? 'is-now' : ''} ${hoveredItem?.time === item.time ? 'active' : ''}`}
                style={{ width: `${itemWidth}px` }}
                onClick={() => setHoveredItem(item)}
              >
                <span className="hour-text">{item.hour}</span>
                <span className="hour-val">
                  {activeMetric === 'aqi'
                    ? item.aqi ?? '--'
                    : activeMetric === 'pm2_5'
                    ? Math.round(item.pm2_5 ?? 0)
                    : Math.round(item.pm10 ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
