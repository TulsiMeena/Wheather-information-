import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Server,
  Radio,
  Clock,
  Trash2,
  RefreshCw,
  Database,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { DiagnosticsService } from '../../services/diagnosticsService';
import { ApiDiagnosticsReport, DataQualityReport, RequestLogEntry } from '../../types/weather';
import './DiagnosticsModal.css';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const { currentWeather, airQuality, hourlyForecast } = useApp();

  const [diagnosticsReport, setDiagnosticsReport] = useState<ApiDiagnosticsReport>(() =>
    DiagnosticsService.getDiagnosticsReport()
  );
  const [qualityReport, setQualityReport] = useState<DataQualityReport>(() =>
    DiagnosticsService.evaluateDataQuality(currentWeather, airQuality, hourlyForecast.length)
  );
  const [logs, setLogs] = useState<RequestLogEntry[]>(() => DiagnosticsService.getRecentLogs());

  const refreshData = () => {
    setDiagnosticsReport(DiagnosticsService.getDiagnosticsReport());
    setQualityReport(DiagnosticsService.evaluateDataQuality(currentWeather, airQuality, hourlyForecast.length));
    setLogs(DiagnosticsService.getRecentLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, currentWeather, airQuality, hourlyForecast]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClearLogs = () => {
    DiagnosticsService.clearLogs();
    refreshData();
  };

  return (
    <div className="diag-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="diag-modal-window glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="diag-modal-header">
          <div className="diag-modal-title">
            <Activity size={22} className="text-primary" />
            <div>
              <h2>Data Diagnostics & System Telemetry</h2>
              <span className="diag-modal-sub">
                Real-time API health, telemetry audit ledger, and observation quality verification.
              </span>
            </div>
          </div>
          <div className="diag-header-actions">
            <button className="btn-icon" onClick={refreshData} title="Refresh Diagnostics">
              <RefreshCw size={17} />
            </button>
            <button className="btn-icon" onClick={onClose} title="Close Diagnostics">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="diag-modal-body">
          {/* 1. Observation Quality Evaluator */}
          <div className="diag-section quality-section">
            <div className="diag-section-header">
              <div className="title-with-icon">
                <ShieldCheck size={18} className="text-primary" />
                <h3>Meteorological Data Quality</h3>
              </div>
              <span className={`quality-tier-tag ${qualityReport.tier.toLowerCase()}`}>
                {qualityReport.tier} Quality ({qualityReport.completeness}%)
              </span>
            </div>

            <div className="quality-summary-box">
              <p>{qualityReport.summary}</p>
              <div className="quality-freshness-row">
                <Clock size={13} className="text-muted" />
                <span>{qualityReport.freshnessLabel}</span>
              </div>
            </div>

            <div className="quality-checks-grid">
              {qualityReport.checks.map((check, idx) => (
                <div key={idx} className={`quality-check-pill ${check.passed ? 'passed' : 'warning'}`}>
                  {check.passed ? (
                    <CheckCircle2 size={16} className="text-green" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber" />
                  )}
                  <div className="check-text">
                    <span className="check-lbl">{check.label}</span>
                    <span className="check-dtl">{check.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. API Providers & Service Status */}
          <div className="diag-section providers-section">
            <div className="diag-section-header">
              <div className="title-with-icon">
                <Server size={18} className="text-primary" />
                <h3>API Provider Health Matrix</h3>
              </div>
            </div>

            <div className="providers-grid">
              {/* Open-Meteo Weather */}
              <div className="provider-card">
                <div className="p-head">
                  <span className="p-name">Open-Meteo Synoptic Feed</span>
                  <span className={`status-pill ${diagnosticsReport.weatherApiStatus.toLowerCase()}`}>
                    {diagnosticsReport.weatherApiStatus}
                  </span>
                </div>
                <div className="p-details">
                  <span>Forecast, Temperature, Pressure, Wind & Rain</span>
                  <span className="p-tier">Free Open Science API</span>
                </div>
              </div>

              {/* Open-Meteo Air Quality */}
              <div className="provider-card">
                <div className="p-head">
                  <span className="p-name">CAMS / Open-Meteo Air Quality</span>
                  <span className={`status-pill ${diagnosticsReport.airQualityApiStatus.toLowerCase()}`}>
                    {diagnosticsReport.airQualityApiStatus}
                  </span>
                </div>
                <div className="p-details">
                  <span>PM2.5, PM10, O3, NO2, SO2, US EPA AQI</span>
                  <span className="p-tier">Atmospheric Chemistry Model</span>
                </div>
              </div>

              {/* Cartography / Base Map */}
              <div className="provider-card">
                <div className="p-head">
                  <span className="p-name">OpenStreetMap Cartography</span>
                  <span className="status-pill connected">CONNECTED</span>
                </div>
                <div className="p-details">
                  <span>Standard Global Base Vector Tiles</span>
                  <span className="p-tier">Crowdsourced Open Tile Server</span>
                </div>
              </div>

              {/* Live Doppler Radar */}
              <div className="provider-card">
                <div className="p-head">
                  <span className="p-name">Live Radar Stream</span>
                  <span className="status-pill disconnected">STANDBY</span>
                </div>
                <div className="p-details">
                  <span>Live Doppler raster requires governmental radar feed</span>
                  <span className="p-tier">Point synoptic precipitation active</span>
                </div>
              </div>

              {/* IMD Provider Stub */}
              <div className="provider-card">
                <div className="p-head">
                  <span className="p-name">India Meteorological Dept (IMD)</span>
                  <span className="status-pill disabled">DISABLED</span>
                </div>
                <div className="p-details">
                  <span>Official IMD feed not connected (No fake data rule)</span>
                  <span className="p-tier">Architecture stub ready for key config</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Performance & Request Metrics */}
          <div className="diag-section metrics-section">
            <div className="diag-section-header">
              <div className="title-with-icon">
                <Zap size={18} className="text-primary" />
                <h3>Telemetry Audit & Latency Metrics</h3>
              </div>
              <span className="latency-summary">
                Avg Latency: <strong>{diagnosticsReport.avgLatencyMs} ms</strong>
              </span>
            </div>

            <div className="diag-stats-summary-grid">
              <div className="diag-summary-metric">
                <span className="m-val">{diagnosticsReport.recentRequests.length}</span>
                <span className="m-lbl">Total Queries</span>
              </div>
              <div className="diag-summary-metric">
                <span className="m-val text-green">
                  {diagnosticsReport.recentRequests.filter((r) => r.success).length}
                </span>
                <span className="m-lbl">Successful</span>
              </div>
              <div className="diag-summary-metric">
                <span className="m-val text-red">
                  {diagnosticsReport.recentRequests.filter((r) => !r.success).length}
                </span>
                <span className="m-lbl">Failed</span>
              </div>
              <div className="diag-summary-metric">
                <span className="m-val primary">{diagnosticsReport.avgLatencyMs}ms</span>
                <span className="m-lbl">Average Latency</span>
              </div>
            </div>

            {/* Request Ledger Table */}
            <div className="request-ledger-box">
              <div className="ledger-header">
                <span className="ledger-title">Recent Network Requests ({logs.length})</span>
                {logs.length > 0 && (
                  <button className="clear-logs-btn" onClick={handleClearLogs} title="Clear telemetry log">
                    <Trash2 size={13} />
                    <span>Clear Ledger</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="ledger-empty">
                  <span>No network events logged yet.</span>
                </div>
              ) : (
                <div className="ledger-table-wrap">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Provider</th>
                        <th>Endpoint</th>
                        <th>Status</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 15).map((log) => (
                        <tr key={log.id}>
                          <td className="cell-time">{new Date(log.timestampIso).toLocaleTimeString()}</td>
                          <td className="cell-provider">{log.provider}</td>
                          <td className="cell-endpoint" title={log.endpoint}>
                            {log.endpoint.replace('https://', '')}
                          </td>
                          <td className="cell-status">
                            <span className={`ledger-status-tag ${log.status}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="cell-duration">
                            {log.durationMs !== undefined ? `${log.durationMs}ms` : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="diag-modal-footer">
          <div className="footer-transparency-note">
            <Database size={14} className="text-muted" />
            <span>Local telemetry only. Zero tracking, zero telemetry transmission.</span>
          </div>
          <button className="btn btn-secondary close-footer-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
