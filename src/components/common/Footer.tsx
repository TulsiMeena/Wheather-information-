import React from 'react';
import { CloudSun, Activity } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './Footer.css';

export const Footer: React.FC = () => {
  const { setIsDiagnosticsOpen } = useApp();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-brand-line">
          <img src="/icon.svg" alt="App Icon" className="footer-app-icon" />
          <span className="footer-app-name">Weather Intelligence</span>
          <span className="footer-bullet">•</span>
          <span className="footer-tagline">Powered by weather data</span>
          <span className="footer-bullet">•</span>
          <button
            className="footer-diag-link"
            onClick={() => setIsDiagnosticsOpen(true)}
            title="Open Data Diagnostics & Telemetry"
          >
            <Activity size={13} />
            <span>Data Diagnostics</span>
          </button>
        </div>

        <div className="footer-meta-line">
          <span className="footer-owner">App Owner: Amit Meena</span>
          <span className="footer-bullet">•</span>
          <span className="footer-license">Open-Meteo Integration Architecture v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

