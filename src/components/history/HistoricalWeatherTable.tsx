import React, { useState, useMemo } from 'react';
import {
  Table,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react';
import { HistoricalDataPoint, TemperatureUnit, WindSpeedUnit, LocationItem } from '../../types/weather';
import { formatTemperature, formatWindSpeed } from '../../utils/formatters';
import { ExportService } from '../../services/exportService';
import './HistoricalWeatherTable.css';

interface HistoricalWeatherTableProps {
  data: HistoricalDataPoint[];
  location: LocationItem;
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
}

const ROWS_PER_PAGE = 8;

export const HistoricalWeatherTable: React.FC<HistoricalWeatherTableProps> = ({
  data,
  location,
  tempUnit,
  windUnit
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  // Memoized page slice
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
    return data.slice(startIdx, startIdx + ROWS_PER_PAGE);
  }, [data, currentPage]);

  const handleExportCsv = () => {
    ExportService.exportToCsv({
      location,
      historical: {
        location: {
          name: location.name,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: location.timezone || 'UTC'
        },
        startDate: data[0]?.date || '',
        endDate: data[data.length - 1]?.date || '',
        daily: data,
        hourly: [],
        source: 'Open-Meteo ERA5 Reanalysis',
        retrievedAt: new Date().toISOString()
      }
    });
  };

  return (
    <div className="history-table-card glass-card">
      <div className="table-top-bar">
        <div className="table-title-box">
          <Table size={18} className="text-primary" />
          <h3 className="table-title">Tabular Telemetry Ledger</h3>
          <span className="table-count-tag">{data.length} Observations</span>
        </div>

        <button
          className="btn btn-secondary table-export-btn"
          onClick={handleExportCsv}
          title="Export table as CSV"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Internal-only horizontal scroll container */}
      <div className="table-scroll-container">
        <table className="history-data-table" aria-label="Historical Weather Daily Observations">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Condition</th>
              <th scope="col">High / Low</th>
              <th scope="col">Precipitation</th>
              <th scope="col">Max Wind</th>
              <th scope="col">Humidity</th>
              <th scope="col">Cloud Cover</th>
              <th scope="col">UV Max</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => {
              const dateObj = new Date(row.date);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });

              return (
                <tr key={row.date || idx}>
                  <td className="cell-date">
                    <div className="date-cell-inner">
                      <Calendar size={13} className="text-muted" />
                      <span>{formattedDate}</span>
                    </div>
                  </td>
                  <td className="cell-condition">{row.conditionText || 'Fair'}</td>
                  <td className="cell-temp">
                    <span className="t-high">
                      {row.temperatureMax !== null ? formatTemperature(row.temperatureMax, tempUnit) : '--'}
                    </span>
                    <span className="t-slash">/</span>
                    <span className="t-low">
                      {row.temperatureMin !== null ? formatTemperature(row.temperatureMin, tempUnit) : '--'}
                    </span>
                  </td>
                  <td className="cell-precip">
                    {row.precipitationSum !== null && row.precipitationSum > 0 ? (
                      <span className="precip-pill">{row.precipitationSum} mm</span>
                    ) : (
                      <span className="text-muted">0 mm</span>
                    )}
                  </td>
                  <td className="cell-wind">
                    {row.windSpeedMax !== null ? formatWindSpeed(row.windSpeedMax, windUnit) : '--'}
                  </td>
                  <td className="cell-humidity">
                    {row.humidityMean !== null && row.humidityMean !== undefined ? `${row.humidityMean}%` : '--'}
                  </td>
                  <td className="cell-clouds">
                    {row.cloudCoverMean !== null && row.cloudCoverMean !== undefined ? `${row.cloudCoverMean}%` : '--'}
                  </td>
                  <td className="cell-uv">
                    {row.uvIndexMax !== null && row.uvIndexMax !== undefined ? row.uvIndexMax : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="table-pagination-bar">
          <span className="page-indicator">
            Page {currentPage} of {totalPages}
          </span>

          <div className="pagination-btns">
            <button
              className="page-nav-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <button
              className="page-nav-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
