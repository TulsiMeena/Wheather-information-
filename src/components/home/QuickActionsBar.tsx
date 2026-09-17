import React from 'react';
import {
  RefreshCw,
  Search,
  Navigation,
  Heart,
  Calendar,
  Compass,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import './QuickActionsBar.css';

export const QuickActionsBar: React.FC = () => {
  const {
    currentLocation,
    favorites,
    addFavorite,
    removeFavorite,
    refreshData,
    detectDeviceLocation,
    setIsSearchOpen,
    setActivePage,
    setIsCustomizeWidgetsOpen,
    isLoading
  } = useApp();

  const isFavorited = currentLocation
    ? favorites.some((f) => f.id === currentLocation.id)
    : false;

  const handleToggleFavorite = () => {
    if (!currentLocation) return;
    if (isFavorited) {
      removeFavorite(currentLocation.id);
    } else {
      addFavorite(currentLocation);
    }
  };

  return (
    <nav className="quick-actions-bar glass-card" aria-label="Quick Weather Actions">
      <button
        className="quick-action-pill"
        onClick={() => refreshData(true)}
        disabled={isLoading}
        title="Refresh live telemetry"
      >
        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        <span>Refresh</span>
      </button>

      <button
        className="quick-action-pill"
        onClick={() => setIsSearchOpen(true)}
        title="Search city"
      >
        <Search size={15} />
        <span>Search</span>
      </button>

      <button
        className="quick-action-pill"
        onClick={detectDeviceLocation}
        title="Use GPS location"
      >
        <Navigation size={15} />
        <span>My GPS</span>
      </button>

      <button
        className={`quick-action-pill ${isFavorited ? 'is-fav' : ''}`}
        onClick={handleToggleFavorite}
        title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
      >
        <Heart size={15} fill={isFavorited ? 'currentColor' : 'none'} />
        <span>{isFavorited ? 'Saved' : 'Favorite'}</span>
      </button>

      <button
        className="quick-action-pill"
        onClick={() => setActivePage('forecast')}
        title="View 10-day forecast"
      >
        <Calendar size={15} />
        <span>10-Day</span>
      </button>

      <button
        className="quick-action-pill"
        onClick={() => setActivePage('map')}
        title="Open interactive radar"
      >
        <Compass size={15} />
        <span>Radar</span>
      </button>

      <button
        className="quick-action-pill"
        onClick={() => setActivePage('airquality')}
        title="Air Quality index"
      >
        <Layers size={15} />
        <span>AQI</span>
      </button>

      <button
        className="quick-action-pill"
        onClick={() => setActivePage('assistant')}
        title="AI Weather Assistant"
      >
        <Sparkles size={15} />
        <span>Assistant</span>
      </button>

      <button
        className="quick-action-pill customize-action-pill"
        onClick={() => setIsCustomizeWidgetsOpen(true)}
        title="Customize dashboard layout"
      >
        <Sliders size={15} />
        <span>Customize</span>
      </button>
    </nav>
  );
};
