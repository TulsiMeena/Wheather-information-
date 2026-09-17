import React from 'react';
import { WeatherMapContainer } from '../components/map/WeatherMapContainer';
import './MapPage.css';

export const MapPage: React.FC = () => {
  return (
    <div className="page-container map-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Advanced Weather Map</h1>
          <p className="page-subtitle">
            Interactive synoptic telemetry layers with point-forecast inspection
          </p>
        </div>
      </div>

      {/* Interactive Map Viewport */}
      <section className="glass-card map-frame-container" aria-label="Interactive Weather Map Viewport">
        <WeatherMapContainer />
      </section>
    </div>
  );
};
