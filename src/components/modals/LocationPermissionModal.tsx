import React from 'react';
import { Navigation, Search, X, MapPin, ShieldCheck } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './LocationPermissionModal.css';

export const LocationPermissionModal: React.FC = () => {
  const {
    showLocationPrompt,
    dismissLocationPrompt,
    detectDeviceLocation,
    setIsSearchOpen
  } = useApp();

  if (!showLocationPrompt) return null;

  const handleAllow = async () => {
    dismissLocationPrompt(true);
    await detectDeviceLocation();
  };

  const handleSearchInstead = () => {
    dismissLocationPrompt(false);
    setIsSearchOpen(true);
  };

  return (
    <div
      className="permission-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Location Permission"
    >
      <div className="glass-card permission-modal-card">
        <button
          className="permission-close-btn"
          onClick={() => dismissLocationPrompt(false)}
          aria-label="Dismiss location request"
        >
          <X size={18} />
        </button>

        <div className="permission-visual-container">
          <div className="permission-icon-halo">
            <div className="permission-icon-inner">
              <Navigation size={28} className="text-primary-glow" />
            </div>
          </div>
        </div>

        <div className="permission-content">
          <h2 className="permission-title">Use your current location</h2>
          <p className="permission-desc">
            Allow location access to get accurate local weather, micro-climate alerts, and hour-by-hour meteorological telemetry.
          </p>

          <div className="permission-privacy-note">
            <ShieldCheck size={14} className="text-emerald" />
            <span>Telemetry remains private in your browser &amp; uses Open-Meteo public endpoints.</span>
          </div>

          <div className="permission-actions">
            <button className="permission-primary-btn" onClick={handleAllow}>
              <Navigation size={18} />
              <span>Allow Location</span>
            </button>

            <button className="permission-secondary-btn" onClick={handleSearchInstead}>
              <Search size={18} />
              <span>Search City Instead</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
