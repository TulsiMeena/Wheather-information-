import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  MapPin,
  Clock,
  Download,
  Share2,
  RefreshCw,
  AlertCircle,
  Database,
  Search
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { defaultHistoryProvider } from '../providers/history/OpenMeteoHistoryProvider';
import { HistoricalWeatherResult } from '../types/weather';
import { HistoryAnalytics } from '../services/history/historyAnalytics';
import { DateRangeSelector } from '../components/history/DateRangeSelector';
import { HistoricalCharts } from '../components/history/HistoricalCharts';
import { HistoricalStatsCards } from '../components/history/HistoricalStatsCards';
import { HistoricalWeatherTable } from '../components/history/HistoricalWeatherTable';
import { WeatherSnapshotModal } from '../components/weather/WeatherSnapshotCard';
import { ExportService } from '../services/exportService';
import './HistoryPage.css';

export const HistoryPage: React.FC = () => {
  const {
    currentLocation,
    dailyForecast,
    settings,
    setIsSearchOpen,
    addToast
  } = useApp();

  // Initial date interval: past 14 days ending 2 days ago
  const defaultDates = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() - 2); // ERA5 archive cutoff
    const start = new Date(end);
    start.setDate(end.getDate() - 13); // 14 days inclusive

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [historicalData, setHistoricalData] = useState<HistoricalWeatherResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchHistory = useCallback(async (start: string, end: string) => {
    if (!currentLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await defaultHistoryProvider.getHistoricalWeather(
        currentLocation.latitude,
        currentLocation.longitude,
        start,
        end,
        currentLocation.timezone || 'auto'
      );
      setHistoricalData(res);
    } catch (err: any) {
      console.warn('Historical fetch error:', err);
      setError('Historical weather data is currently unavailable.');
      setHistoricalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation) {
      fetchHistory(startDate, endDate);
    }
  }, [currentLocation, startDate, endDate, fetchHistory]);

  const handleRangeChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  // Analytics derivations
  const analytics = useMemo(() => {
    if (!historicalData || historicalData.daily.length === 0) {
      return null;
    }

    const stats = HistoryAnalytics.calculateStatistics(historicalData.daily);
    const records = HistoryAnalytics.calculateRecords(
      historicalData.daily,
      currentLocation?.name || 'Selected Point',
      settings.tempUnit,
      settings.windUnit
    );
    const summary = HistoryAnalytics.calculatePeriodSummary(
      historicalData.daily,
      stats,
      settings.tempUnit,
      settings.windUnit
    );
    const comparison = HistoryAnalytics.compareForecastVsHistory(
      dailyForecast,
      stats,
      `${startDate} to ${endDate}`
    );

    return { stats, records, summary, comparison };
  }, [historicalData, currentLocation, settings.tempUnit, settings.windUnit, dailyForecast, startDate, endDate]);

  const handleExportCsv = () => {
    if (!currentLocation || !historicalData) return;
    ExportService.exportToCsv({
      location: currentLocation,
      historical: historicalData
    });
    addToast({
      type: 'info',
      title: 'CSV Exported',
      message: 'Historical weather interval downloaded.'
    });
  };

  const handleExportJson = () => {
    if (!currentLocation || !historicalData) return;
    ExportService.exportToJson({
      location: currentLocation,
      currentWeather: null,
      airQuality: null,
      historical: historicalData
    });
    addToast({
      type: 'info',
      title: 'JSON Exported',
      message: 'Historical observation dataset saved.'
    });
  };

  return (
    <div className="history-page-container">
      {/* Top Header Bar */}
      <div className="history-header-bar">
        <div className="history-title-meta">
          <div className="history-main-title">
            <History size={26} className="text-primary" />
            <h1>Historical Weather Center</h1>
          </div>
          <p className="history-subtitle">
            Long-term atmospheric observations, ERA5 climate reanalysis, and synoptic statistics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="history-header-actions">
          <button
            className="btn btn-secondary action-pill-btn"
            onClick={() => setIsShareModalOpen(true)}
            title="Share or snapshot telemetry"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          <button
            className="btn btn-secondary action-pill-btn"
            onClick={handleExportCsv}
            disabled={!historicalData || isLoading}
            title="Download CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-primary action-pill-btn"
            onClick={() => fetchHistory(startDate, endDate)}
            disabled={isLoading}
            title="Refresh historical query"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Querying...' : 'Reload'}</span>
          </button>
        </div>
      </div>

      {/* Location Bar with Timezone Indicator */}
      {currentLocation ? (
        <div className="history-location-banner glass-card">
          <div className="loc-info-group">
            <div className="loc-name-row">
              <MapPin size={18} className="text-primary" />
              <span className="loc-name">{currentLocation.name}</span>
              {currentLocation.country && (
                <span className="loc-country">({currentLocation.country})</span>
              )}
            </div>
            <div className="loc-meta-row">
              <span className="coord-chip">
                {currentLocation.latitude.toFixed(2)}°N, {currentLocation.longitude.toFixed(2)}°E
              </span>
              <span className="tz-chip">
                <Clock size={12} />
                <span>Timezone: {currentLocation.timezone || 'UTC (Auto)'}</span>
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary change-loc-btn"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={14} />
            <span>Change City</span>
          </button>
        </div>
      ) : (
        <div className="history-location-banner glass-card empty">
          <AlertCircle size={20} className="text-muted" />
          <span>Select a city or enable GPS to query historical climate telemetry.</span>
        </div>
      )}

      {/* Date Range Selector Card */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onRangeChange={handleRangeChange}
        isLoading={isLoading}
      />

      {/* Loading Skeleton / Spinner */}
      {isLoading && (
        <div className="history-loading-card glass-card" role="status" aria-live="polite">
          <RefreshCw size={28} className="spin text-primary" />
          <div className="loading-text-group">
            <span className="loading-main">Retrieving Reanalysis Records...</span>
            <span className="loading-sub">
              Querying Open-Meteo ERA5 atmospheric archives for {startDate} to {endDate}
            </span>
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && !isLoading && (
        <div className="history-error-card glass-card" role="alert">
          <AlertCircle size={24} className="text-red" />
          <div className="err-body">
            <h4>Historical weather data is currently unavailable.</h4>
            <p>
              Please verify your date parameters are within past archive dates (minimum 2 days ago)
              or check your network connection.
            </p>
          </div>
          <button
            className="btn btn-secondary err-retry-btn"
            onClick={() => fetchHistory(startDate, endDate)}
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Historical Data Views */}
      {!isLoading && !error && historicalData && analytics && (
        <>
          {/* Synoptic Curves Chart */}
          <HistoricalCharts
            data={historicalData.daily}
            tempUnit={settings.tempUnit}
            windUnit={settings.windUnit}
          />

          {/* Climatological Summary & Statistical Metric Cards */}
          <HistoricalStatsCards
            stats={analytics.stats}
            records={analytics.records}
            summary={analytics.summary}
            comparison={analytics.comparison}
            tempUnit={settings.tempUnit}
            windUnit={settings.windUnit}
          />

          {/* Detailed Paginated Ledger Table */}
          <HistoricalWeatherTable
            data={historicalData.daily}
            location={currentLocation!}
            tempUnit={settings.tempUnit}
            windUnit={settings.windUnit}
          />

          {/* Data Transparency & Attribution Panel */}
          <div className="history-transparency-card glass-card">
            <div className="transparency-header">
              <Database size={16} className="text-muted" />
              <h4>Meteorological Archive Transparency</h4>
            </div>
            <p className="transparency-text">
              Historical reanalysis data is powered by the European Centre for Medium-Range Weather Forecasts (ECMWF)
              ERA5 and ERA5-Land datasets, served by Open-Meteo without private API keys. ERA5 combines model data with observations
              from across the world into a globally complete and consistent dataset.
            </p>
            <div className="transparency-footer">
              <span>Source: {historicalData.source}</span>
              <span>Retrieved: {new Date(historicalData.retrievedAt).toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      {/* Weather Snapshot Modal */}
      <WeatherSnapshotModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
