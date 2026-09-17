import React, { useState, useMemo } from 'react';
import {
  Heart,
  MapPin,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  Star,
  ArrowUp,
  ArrowDown,
  CloudRain,
  Wind,
  Activity,
  Clock,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatTemperature, formatWindSpeed } from '../utils/formatters';
import { WeatherIcon } from '../components/common/WeatherIcon';
import { EmptyState } from '../components/common/ErrorSystem';
import { FavoriteLocationItem } from '../types/weather';
import './FavoritesPage.css';

type SortOption =
  | 'custom'
  | 'defaultFirst'
  | 'tempHigh'
  | 'tempLow'
  | 'rainHigh'
  | 'windHigh'
  | 'aqiHigh'
  | 'recent';

export const FavoritesPage: React.FC = () => {
  const {
    favorites,
    favoriteSnapshots,
    isLoadingFavorites,
    removeFavorite,
    reorderFavorites,
    setDefaultFavorite,
    refreshFavoriteCity,
    refreshAllFavorites,
    currentLocation,
    setCurrentLocation,
    settings,
    setIsSearchOpen,
    setActivePage,
    addToast
  } = useApp();

  const [sortBy, setSortBy] = useState<SortOption>('custom');

  const handleSelectFav = (loc: FavoriteLocationItem) => {
    setCurrentLocation(loc);
    addToast({
      type: 'info',
      title: 'Switched Location',
      message: `${loc.city || loc.name}, ${loc.country}`
    });
    setActivePage('home');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= favorites.length) return;
    const reordered = [...favorites];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderFavorites(reordered);
  };

  // Sorted list memoization
  const sortedFavorites = useMemo(() => {
    const list = [...favorites];
    switch (sortBy) {
      case 'defaultFirst':
        return list.sort((a, b) => {
          if (a.isDefault) return -1;
          if (b.isDefault) return 1;
          return 0;
        });
      case 'tempHigh':
        return list.sort((a, b) => {
          const tA = favoriteSnapshots[a.id]?.temperature ?? -999;
          const tB = favoriteSnapshots[b.id]?.temperature ?? -999;
          return tB - tA;
        });
      case 'tempLow':
        return list.sort((a, b) => {
          const tA = favoriteSnapshots[a.id]?.temperature ?? 999;
          const tB = favoriteSnapshots[b.id]?.temperature ?? 999;
          return tA - tB;
        });
      case 'rainHigh':
        return list.sort((a, b) => {
          const rA = favoriteSnapshots[a.id]?.rainProbability ?? -1;
          const rB = favoriteSnapshots[b.id]?.rainProbability ?? -1;
          return rB - rA;
        });
      case 'windHigh':
        return list.sort((a, b) => {
          const wA = favoriteSnapshots[a.id]?.windSpeed ?? -1;
          const wB = favoriteSnapshots[b.id]?.windSpeed ?? -1;
          return wB - wA;
        });
      case 'aqiHigh':
        return list.sort((a, b) => {
          const qA = favoriteSnapshots[a.id]?.aqi ?? -1;
          const qB = favoriteSnapshots[b.id]?.aqi ?? -1;
          return qB - qA;
        });
      case 'recent':
        return list.sort((a, b) => {
          const timeA = new Date(favoriteSnapshots[a.id]?.lastUpdated || 0).getTime();
          const timeB = new Date(favoriteSnapshots[b.id]?.lastUpdated || 0).getTime();
          return timeB - timeA;
        });
      default:
        return list;
    }
  }, [favorites, favoriteSnapshots, sortBy]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return '--';
    }
  };

  const getAqiBadgeColor = (aqi: number | null) => {
    if (aqi === null) return 'var(--color-text-muted)';
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    return '#8b5cf6';
  };

  return (
    <div className="page-container favorites-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="title-with-pill">
            <h1 className="page-title">My Locations</h1>
            <span className="fav-count-pill">
              {favorites.length} / 20 Saved
            </span>
          </div>
          <p className="page-subtitle">
            Multi-location live telemetry monitoring with per-city fault isolation
          </p>
        </div>

        <div className="header-button-group">
          {favorites.length > 0 && (
            <button
              className="btn btn-secondary refresh-all-btn"
              onClick={refreshAllFavorites}
              disabled={isLoadingFavorites}
              title="Refresh all locations"
            >
              <RefreshCw size={15} className={isLoadingFavorites ? 'animate-spin' : ''} />
              <span>{isLoadingFavorites ? 'Syncing...' : 'Refresh All'}</span>
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => setIsSearchOpen(true)}
            disabled={favorites.length >= 20}
          >
            <Plus size={16} />
            <span>Add City</span>
          </button>
        </div>
      </div>

      {/* Sorting & Filter Toolbar */}
      {favorites.length > 1 && (
        <div className="favorites-toolbar glass-card">
          <div className="sort-label-group">
            <SlidersHorizontal size={15} className="text-primary" />
            <span className="toolbar-label">Sort By:</span>
          </div>
          <div className="sort-select-wrapper">
            <select
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort favorite locations"
            >
              <option value="custom">Custom Order</option>
              <option value="defaultFirst">Default Location First</option>
              <option value="tempHigh">Highest Temperature</option>
              <option value="tempLow">Lowest Temperature</option>
              <option value="rainHigh">Highest Rain Probability</option>
              <option value="windHigh">Highest Wind Speed</option>
              <option value="aqiHigh">Air Quality (AQI)</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
        </div>
      )}

      {/* Locations Grid */}
      {favorites.length > 0 ? (
        <div className="favorites-grid">
          {sortedFavorites.map((fav, index) => {
            const isCurrentlySelected = currentLocation?.id === fav.id;
            const snapshot = favoriteSnapshots[fav.id];
            const isLoadingCity = snapshot?.status === 'loading';
            const isError = snapshot?.status === 'error';
            const hasData = snapshot && snapshot.temperature !== null;

            return (
              <div
                key={fav.id}
                className={`glass-card favorite-card glass-card-interactive ${
                  isCurrentlySelected ? 'active-target' : ''
                }`}
                onClick={() => handleSelectFav(fav)}
              >
                {/* Card Top Row */}
                <div className="fav-card-top">
                  <div className="fav-city-info">
                    <div className="fav-title-row">
                      <MapPin size={18} className="text-primary" />
                      <h3 className="fav-city-name">{fav.city || fav.name}</h3>
                      {fav.isDefault && (
                        <span className="default-star-badge" title="Default launch location">
                          <Star size={12} fill="currentColor" />
                          <span>Default</span>
                        </span>
                      )}
                    </div>
                    <span className="fav-country-name">
                      {fav.region ? `${fav.region}, ` : ''}{fav.country}
                    </span>
                  </div>

                  <div className="fav-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="fav-action-icon-btn"
                      onClick={() => refreshFavoriteCity(fav.id)}
                      title="Refresh this city"
                      aria-label={`Refresh ${fav.city}`}
                    >
                      <RefreshCw size={14} className={isLoadingCity ? 'animate-spin' : ''} />
                    </button>

                    <button
                      className={`fav-action-icon-btn ${fav.isDefault ? 'is-default' : ''}`}
                      onClick={() => setDefaultFavorite(fav.id)}
                      title={fav.isDefault ? 'Default location' : 'Set as default launch location'}
                      aria-label={`Set ${fav.city} as default`}
                    >
                      <Star size={14} fill={fav.isDefault ? 'currentColor' : 'none'} />
                    </button>

                    {sortBy === 'custom' && (
                      <div className="reorder-btn-group">
                        <button
                          className="fav-reorder-btn"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          title="Move up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          className="fav-reorder-btn"
                          disabled={index === favorites.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          title="Move down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    )}

                    <button
                      className="fav-remove-btn"
                      onClick={() => removeFavorite(fav.id)}
                      title="Remove location"
                      aria-label={`Remove ${fav.city} from favorites`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Weather Data Snapshot Box */}
                <div className="fav-card-stats">
                  {isError ? (
                    <div className="fav-error-box">
                      <AlertCircle size={18} className="text-amber" />
                      <span className="fav-error-text">
                        {snapshot?.errorMessage || 'Temporarily unavailable'}
                      </span>
                    </div>
                  ) : hasData ? (
                    <>
                      <div className="fav-temp-box">
                        <span className="fav-temp-value">
                          {formatTemperature(snapshot.temperature, settings.tempUnit)}
                        </span>
                        <div className="fav-condition-row">
                          <WeatherIcon
                            condition={snapshot.condition || 'clear'}
                            isDaytime={true}
                            size={20}
                          />
                          <span className="fav-condition-text">
                            {snapshot.conditionText || 'Clear'}
                          </span>
                        </div>
                      </div>

                      <div className="fav-metrics-col">
                        <span className="fav-feels-like">
                          Feels: {formatTemperature(snapshot.feelsLike, settings.tempUnit)}
                        </span>
                        <div className="fav-metric-inline">
                          <CloudRain size={13} className="text-sky" />
                          <span>{snapshot.rainProbability ?? 0}%</span>
                        </div>
                        <div className="fav-metric-inline">
                          <Wind size={13} className="text-teal" />
                          <span>{formatWindSpeed(snapshot.windSpeed, settings.windUnit)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="fav-loading-box">
                      <RefreshCw size={18} className="animate-spin text-primary" />
                      <span>Loading atmospheric telemetry...</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: AQI, Timestamp, Active status */}
                <div className="fav-card-bottom">
                  <div className="fav-bottom-left">
                    {hasData && snapshot.aqi !== null ? (
                      <span
                        className="fav-aqi-pill"
                        style={{
                          color: getAqiBadgeColor(snapshot.aqi),
                          borderColor: getAqiBadgeColor(snapshot.aqi)
                        }}
                      >
                        <Activity size={12} />
                        <span>AQI {snapshot.aqi} {snapshot.aqiLevelText ? `· ${snapshot.aqiLevelText}` : ''}</span>
                      </span>
                    ) : (
                      <span className="fav-timestamp">
                        <Clock size={11} />
                        <span>{formatRelativeTime(snapshot?.lastUpdated)}</span>
                      </span>
                    )}
                  </div>

                  <div className="fav-bottom-right">
                    {isCurrentlySelected ? (
                      <span className="active-pill">
                        <Check size={14} />
                        <span>Current Target</span>
                      </span>
                    ) : (
                      <span className="select-prompt">
                        <span>View Details</span>
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Heart size={36} className="text-primary" />}
          title="No Favorite Locations Saved"
          description="Save up to 20 cities to monitor live temperature, rain probability, wind speeds, and AQI from a single unified view."
          actionLabel="Search & Add City"
          onAction={() => setIsSearchOpen(true)}
        />
      )}
    </div>
  );
};
