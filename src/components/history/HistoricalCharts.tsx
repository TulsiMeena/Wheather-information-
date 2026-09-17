import React, { useState, useMemo } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Info
} from 'lucide-react';
import { HistoricalDataPoint, TemperatureUnit, WindSpeedUnit } from '../../types/weather';
import { formatTemperature, formatWindSpeed } from '../../utils/formatters';
import './HistoricalCharts.css';

interface HistoricalChartsProps {
  data: HistoricalDataPoint[];
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
}

type ChartMetric = 'temperature' | 'precipitation' | 'wind' | 'humidity';

export const HistoricalCharts: React.FC<HistoricalChartsProps> = ({
  data,
  tempUnit,
  windUnit
}) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('temperature');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter valid data points
  const points = useMemo(() => {
    return data.map((d, index) => {
      const dateObj = new Date(d.date);
      const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        ...d,
        index,
        label
      };
    });
  }, [data]);

  // Dynamic SVG dimensions
  // For mobile or large datasets, provide appropriate width
  const chartWidth = Math.max(680, points.length * 36);
  const chartHeight = 260;
  const padding = { top: 35, right: 30, bottom: 45, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Compute Scales based on active metric
  const scaleInfo = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 100, yTicks: [0, 50, 100] };

    if (activeMetric === 'temperature') {
      const allVals = points.flatMap((p) => [p.temperatureMax, p.temperatureMin, p.temperatureMean].filter((v): v is number => v !== null));
      const minVal = allVals.length > 0 ? Math.floor(Math.min(...allVals) - 2) : 0;
      const maxVal = allVals.length > 0 ? Math.ceil(Math.max(...allVals) + 2) : 40;
      const step = Math.max(1, Math.round((maxVal - minVal) / 4));
      const yTicks = [minVal, minVal + step, minVal + step * 2, minVal + step * 3, maxVal];
      return { min: minVal, max: maxVal, yTicks };
    }

    if (activeMetric === 'precipitation') {
      const allVals = points.map((p) => p.precipitationSum).filter((v): v is number => v !== null);
      const maxVal = allVals.length > 0 ? Math.max(5, Math.ceil(Math.max(...allVals) * 1.2)) : 10;
      const step = Math.max(1, Math.round(maxVal / 4));
      const yTicks = [0, step, step * 2, step * 3, maxVal];
      return { min: 0, max: maxVal, yTicks };
    }

    if (activeMetric === 'wind') {
      const allVals = points.map((p) => p.windSpeedMax).filter((v): v is number => v !== null);
      const maxVal = allVals.length > 0 ? Math.max(15, Math.ceil(Math.max(...allVals) * 1.2)) : 40;
      const step = Math.max(5, Math.round(maxVal / 4));
      const yTicks = [0, step, step * 2, step * 3, maxVal];
      return { min: 0, max: maxVal, yTicks };
    }

    // Humidity
    return { min: 0, max: 100, yTicks: [0, 25, 50, 75, 100] };
  }, [points, activeMetric]);

  const getY = (val: number | null | undefined): number => {
    if (val === null || val === undefined || isNaN(val)) return innerHeight + padding.top;
    const ratio = (val - scaleInfo.min) / (scaleInfo.max - scaleInfo.min || 1);
    const clamped = Math.max(0, Math.min(1, ratio));
    return padding.top + innerHeight - clamped * innerHeight;
  };

  const getX = (index: number): number => {
    if (points.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (points.length - 1)) * innerWidth;
  };

  // Build SVG Paths
  const svgPaths = useMemo(() => {
    if (points.length === 0) return { line1: '', area1: '', line2: '', area2: '' };

    if (activeMetric === 'temperature') {
      // Line 1: Max Temp, Line 2: Min Temp
      const ptsMax = points.map((p, i) => ({ x: getX(i), y: getY(p.temperatureMax) }));
      const ptsMin = points.map((p, i) => ({ x: getX(i), y: getY(p.temperatureMin) }));

      const lineMax = ptsMax.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const lineMin = ptsMin.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

      // Fill between max and min
      const areaPoints = [
        ...ptsMax,
        ...ptsMin.reverse()
      ];
      const areaBetween = areaPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

      return { line1: lineMax, line2: lineMin, area1: areaBetween, area2: '' };
    }

    if (activeMetric === 'wind') {
      const pts = points.map((p, i) => ({ x: getX(i), y: getY(p.windSpeedMax) }));
      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const area = line + ` L ${pts[pts.length - 1].x} ${innerHeight + padding.top} L ${pts[0].x} ${innerHeight + padding.top} Z`;
      return { line1: line, area1: area, line2: '', area2: '' };
    }

    if (activeMetric === 'humidity') {
      const pts = points.map((p, i) => ({ x: getX(i), y: getY(p.humidityMean) }));
      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const area = line + ` L ${pts[pts.length - 1].x} ${innerHeight + padding.top} L ${pts[0].x} ${innerHeight + padding.top} Z`;
      return { line1: line, area1: area, line2: '', area2: '' };
    }

    return { line1: '', area1: '', line2: '', area2: '' };
  }, [points, activeMetric, scaleInfo]);

  if (points.length === 0) {
    return (
      <div className="historical-charts-card glass-card empty">
        <Info size={24} className="text-muted" />
        <p>No historical telemetry available for this interval.</p>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="historical-charts-card glass-card">
      <div className="charts-top-bar">
        <div className="charts-title-box">
          <h3 className="charts-title">Historical Synoptic Curves</h3>
          <span className="charts-subtitle">
            {points.length} consecutive daily observation intervals
          </span>
        </div>

        {/* Metric Selector Tabs */}
        <div className="metric-tabs" role="tablist" aria-label="Select Weather Metric">
          <button
            className={`metric-tab ${activeMetric === 'temperature' ? 'active temp' : ''}`}
            onClick={() => setActiveMetric('temperature')}
            role="tab"
            aria-selected={activeMetric === 'temperature'}
          >
            <Thermometer size={14} />
            <span>Temperature</span>
          </button>

          <button
            className={`metric-tab ${activeMetric === 'precipitation' ? 'active precip' : ''}`}
            onClick={() => setActiveMetric('precipitation')}
            role="tab"
            aria-selected={activeMetric === 'precipitation'}
          >
            <CloudRain size={14} />
            <span>Precipitation</span>
          </button>

          <button
            className={`metric-tab ${activeMetric === 'wind' ? 'active wind' : ''}`}
            onClick={() => setActiveMetric('wind')}
            role="tab"
            aria-selected={activeMetric === 'wind'}
          >
            <Wind size={14} />
            <span>Wind Speed</span>
          </button>

          <button
            className={`metric-tab ${activeMetric === 'humidity' ? 'active humidity' : ''}`}
            onClick={() => setActiveMetric('humidity')}
            role="tab"
            aria-selected={activeMetric === 'humidity'}
          >
            <Droplets size={14} />
            <span>Humidity</span>
          </button>
        </div>
      </div>

      {/* Interactive Tooltip Summary Header */}
      {activePoint && (
        <div className="chart-active-summary" aria-live="polite">
          <div className="active-date-badge">
            <span>{activePoint.date}</span>
            <span className="condition-tag">{activePoint.conditionText || 'Fair'}</span>
          </div>

          <div className="active-metrics-row">
            {activeMetric === 'temperature' && (
              <>
                <span className="m-pill max-temp">
                  Max: {activePoint.temperatureMax !== null ? formatTemperature(activePoint.temperatureMax, tempUnit) : '--'}
                </span>
                <span className="m-pill min-temp">
                  Min: {activePoint.temperatureMin !== null ? formatTemperature(activePoint.temperatureMin, tempUnit) : '--'}
                </span>
                <span className="m-pill mean-temp">
                  Mean: {activePoint.temperatureMean !== null ? formatTemperature(activePoint.temperatureMean, tempUnit) : '--'}
                </span>
              </>
            )}

            {activeMetric === 'precipitation' && (
              <span className="m-pill precip">
                Precipitation Sum: {activePoint.precipitationSum !== null ? `${activePoint.precipitationSum} mm` : '0 mm'}
              </span>
            )}

            {activeMetric === 'wind' && (
              <>
                <span className="m-pill wind">
                  Max Wind: {activePoint.windSpeedMax !== null ? formatWindSpeed(activePoint.windSpeedMax, windUnit) : '--'}
                </span>
                {activePoint.windGustsMax !== null && activePoint.windGustsMax !== undefined && (
                  <span className="m-pill gust">
                    Gusts: {formatWindSpeed(activePoint.windGustsMax, windUnit)}
                  </span>
                )}
              </>
            )}

            {activeMetric === 'humidity' && (
              <span className="m-pill humidity">
                Average Humidity: {activePoint.humidityMean !== null && activePoint.humidityMean !== undefined ? `${activePoint.humidityMean}%` : '--'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SVG Responsive Container with horizontal scroll on small devices */}
      <div className="chart-scroll-wrapper">
        <svg
          className="historical-svg"
          width={chartWidth}
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label={`Historical ${activeMetric} chart from ${points[0]?.date} to ${points[points.length - 1]?.date}`}
        >
          <defs>
            {/* Temperature Gradient */}
            <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
            </linearGradient>

            {/* Precipitation Gradient */}
            <linearGradient id="precipBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
            </linearGradient>

            {/* Wind Gradient */}
            <linearGradient id="windAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
            </linearGradient>

            {/* Humidity Gradient */}
            <linearGradient id="humidityAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Ticks */}
          {scaleInfo.yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return (
              <g key={i} className="y-grid-line">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {tickVal}
                  {activeMetric === 'temperature' ? `°${tempUnit}` : ''}
                  {activeMetric === 'precipitation' ? ' mm' : ''}
                  {activeMetric === 'wind' ? ` ${windUnit}` : ''}
                  {activeMetric === 'humidity' ? '%' : ''}
                </text>
              </g>
            );
          })}

          {/* Metric Curves / Bars */}
          {activeMetric === 'temperature' && (
            <>
              {/* Range Area between Max and Min */}
              <path d={svgPaths.area1} fill="url(#tempAreaGrad)" />
              {/* Max Temp Line */}
              <path d={svgPaths.line1} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Min Temp Line */}
              <path d={svgPaths.line2} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {activeMetric === 'precipitation' && (
            <g className="precip-bars">
              {points.map((p, i) => {
                const x = getX(i);
                const y = getY(p.precipitationSum || 0);
                const barHeight = Math.max(0, innerHeight + padding.top - y);
                const barWidth = Math.max(6, Math.min(22, (innerWidth / points.length) * 0.7));
                return (
                  <rect
                    key={i}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#precipBarGrad)"
                    rx="3"
                  />
                );
              })}
            </g>
          )}

          {activeMetric === 'wind' && (
            <>
              <path d={svgPaths.area1} fill="url(#windAreaGrad)" />
              <path d={svgPaths.line1} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {activeMetric === 'humidity' && (
            <>
              <path d={svgPaths.area1} fill="url(#humidityAreaGrad)" />
              <path d={svgPaths.line1} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Interactive vertical hover indicator */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={innerHeight + padding.top}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* X Axis Date Labels */}
          {points.map((p, i) => {
            // Label density decimation to prevent clutter on long intervals
            const interval = points.length > 20 ? Math.ceil(points.length / 10) : 1;
            if (i % interval !== 0 && i !== points.length - 1) return null;

            const x = getX(i);
            const isSelected = hoveredIndex === i;

            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight={isSelected ? '600' : '400'}
                fill={isSelected ? '#38bdf8' : '#94a3b8'}
              >
                {p.label}
              </text>
            );
          })}

          {/* Invisible Overlay Rectangles for Smooth Touch & Hover Targets */}
          {points.map((p, i) => {
            const x = getX(i);
            const w = innerWidth / points.length;
            return (
              <rect
                key={`hit-${i}`}
                x={x - w / 2}
                y={padding.top}
                width={w}
                height={innerHeight + padding.bottom}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onTouchStart={() => setHoveredIndex(i)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
