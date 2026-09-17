import React from 'react';
import { Heart, Plus, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { formatTemperature } from '../../utils/formatters';
import { WeatherIcon } from '../common/WeatherIcon';
import './FavoritesQuickStrip.css';

export const FavoritesQuickStrip: React.FC = () => {
  const {
    favorites,
    favoriteSnapshots,
    currentLocation,
    setCurrentLocation,
    settings,
    setIsSearchOpen,
    setActivePage
  } = useApp();

  if (favorites.length === 0) return null;

  return (
    <div className="favorites-quick-strip glass-card" aria-label="Favorite Locations Strip">
      <div className="quick-strip-header">
        <div className="strip-title-row">
          <Heart size={14} className="text-rose" fill="currentColor" />
          <span className="strip-title">Saved Locations</span>
          <span className="strip-badge">{favorites.length}</span>
        </div>

        <div className="strip-header-actions">
          <button
            className="btn-ghost strip-action-btn"
            onClick={() => setActivePage('favorites')}
          >
            <span>Manage</span>
          </button>
          <button
            className="btn-ghost strip-action-btn"
            onClick={() => setIsSearchOpen(true)}
            title="Add new city"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="quick-strip-scroll">
        {favorites.map((fav) => {
          const isSelected = currentLocation?.id === fav.id;
          const snapshot = favoriteSnapshots[fav.id];

          return (
            <button
              key={fav.id}
              className={`strip-item-chip ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setCurrentLocation(fav)}
              title={`${fav.city || fav.name}, ${fav.country}`}
            >
              <div className="strip-chip-left">
                <span className="strip-city-name">{fav.city || fav.name}</span>
                {fav.isDefault && <span className="strip-default-dot" title="Default" />}
              </div>

              <div className="strip-chip-right">
                {snapshot && snapshot.condition && (
                  <WeatherIcon condition={snapshot.condition} isDaytime={true} size={14} />
                )}
                <span className="strip-temp">
                  {snapshot && snapshot.temperature !== null
                    ? formatTemperature(snapshot.temperature, settings.tempUnit)
                    : '--°'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
