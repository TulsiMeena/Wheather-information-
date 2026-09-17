import React from 'react';
import './Skeletons.css';

export const WeatherCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card skeleton-card hero-skeleton" aria-busy="true" aria-label="Loading weather dashboard">
      <div className="skeleton-line" style={{ width: '40%', height: '24px' }} />
      <div className="skeleton-circle" style={{ width: '110px', height: '110px', margin: '24px auto' }} />
      <div className="skeleton-line" style={{ width: '60%', height: '48px', margin: '0 auto 12px' }} />
      <div className="skeleton-line" style={{ width: '50%', height: '18px', margin: '0 auto 24px' }} />
      <div className="skeleton-grid">
        <div className="skeleton-box" style={{ height: '64px' }} />
        <div className="skeleton-box" style={{ height: '64px' }} />
        <div className="skeleton-box" style={{ height: '64px' }} />
      </div>
    </div>
  );
};

export const HourlyCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card skeleton-card hourly-skeleton-item" aria-busy="true">
      <div className="skeleton-line" style={{ width: '50px', height: '14px', marginBottom: '12px' }} />
      <div className="skeleton-circle" style={{ width: '36px', height: '36px', margin: '0 auto 12px' }} />
      <div className="skeleton-line" style={{ width: '40px', height: '20px', marginBottom: '8px' }} />
      <div className="skeleton-line" style={{ width: '32px', height: '12px' }} />
    </div>
  );
};

export const ForecastCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card skeleton-card forecast-skeleton-item" aria-busy="true">
      <div className="skeleton-line" style={{ width: '70px', height: '16px' }} />
      <div className="skeleton-circle" style={{ width: '32px', height: '32px' }} />
      <div className="skeleton-line" style={{ width: '60px', height: '14px' }} />
      <div className="skeleton-line" style={{ width: '80px', height: '16px' }} />
    </div>
  );
};

export const DetailCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card skeleton-card detail-skeleton-item" aria-busy="true">
      <div className="skeleton-header-row">
        <div className="skeleton-circle" style={{ width: '24px', height: '24px' }} />
        <div className="skeleton-line" style={{ width: '70px', height: '14px' }} />
      </div>
      <div className="skeleton-line" style={{ width: '90px', height: '30px', margin: '14px 0 6px' }} />
      <div className="skeleton-line" style={{ width: '120px', height: '12px' }} />
    </div>
  );
};
