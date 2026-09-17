import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  MapPin,
  Clock,
  Heart,
  Navigation,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Globe
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { LocationItem } from '../../types/weather';
import { LocationService } from '../../services/locationService';
import './LocationSearchModal.css';

export const LocationSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    currentLocation,
    setCurrentLocation,
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    detectDeviceLocation,
    addToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh recent searches when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      LocationService.getRecentSearches().then(setRecentSearches);
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
    }
  }, [isSearchOpen]);

  // Debounced geocoding search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await LocationService.searchLocations(trimmed);
        setSearchResults(results);
        setIsSearching(false);
      } catch (err) {
        console.warn('Geocoding search error:', err);
        setSearchError('Could not retrieve locations. Please check connection and try again.');
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  if (!isSearchOpen) return null;

  const handleSelectLocation = async (loc: LocationItem) => {
    setCurrentLocation(loc);
    await LocationService.saveRecentSearch(loc);
    const updatedRecents = await LocationService.getRecentSearches();
    setRecentSearches(updatedRecents);
    setIsSearchOpen(false);
    addToast({
      type: 'info',
      title: 'Target Location Set',
      message: `${loc.name}${loc.state ? `, ${loc.state}` : ''}, ${loc.country}`
    });
  };

  const handleDeviceGPS = async () => {
    await detectDeviceLocation();
    setIsSearchOpen(false);
  };

  const handleRemoveRecent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await LocationService.removeRecentSearch(id);
    const updated = await LocationService.getRecentSearches();
    setRecentSearches(updated);
  };

  const handleClearAllRecent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await LocationService.clearRecentSearches();
    setRecentSearches([]);
  };

  const hasSearchQuery = searchQuery.trim().length >= 2;

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsSearchOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search Location"
    >
      <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input
              type="text"
              autoFocus
              className="search-input"
              placeholder="Search city, region or country (e.g. Jaipur)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search city or location"
            />
            {isSearching && (
              <Loader2 size={16} className="search-loading-spinner animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                className="clear-query-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Location GPS Button */}
        <div className="gps-section">
          <button className="gps-quick-btn" onClick={handleDeviceGPS}>
            <div className="gps-icon-circle">
              <Navigation size={18} />
            </div>
            <div className="gps-text">
              <span className="gps-primary-text">Use Precise Device Location</span>
              <span className="gps-secondary-text">Detect real-time GPS coordinates</span>
            </div>
          </button>
        </div>

        {/* Search Content Body */}
        <div className="modal-body">
          {searchError && (
            <div className="search-error-banner">
              <AlertCircle size={16} />
              <span>{searchError}</span>
            </div>
          )}

          {/* Active Search Results */}
          {hasSearchQuery && (
            <div className="section-block">
              <div className="section-title-row">
                <Globe size={14} className="text-primary" />
                <span className="section-title">SEARCH RESULTS</span>
              </div>

              {isSearching ? (
                <div className="search-feedback-box">
                  <div className="skeleton-line" style={{ width: '100%', height: '48px', marginBottom: '8px' }} />
                  <div className="skeleton-line" style={{ width: '100%', height: '48px', marginBottom: '8px' }} />
                  <div className="skeleton-line" style={{ width: '80%', height: '48px' }} />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="location-item-list">
                  {searchResults.map((item) => (
                    <div key={item.id} className="location-list-item">
                      <button
                        className="location-select-action"
                        onClick={() => handleSelectLocation(item)}
                      >
                        <MapPin size={16} className="location-pin" />
                        <div className="location-meta">
                          <div className="location-title-row">
                            <span className="location-title">{item.name}</span>
                            {item.countryCode && (
                              <span className="country-code-pill">{item.countryCode}</span>
                            )}
                          </div>
                          <span className="location-subtitle">
                            {[item.state, item.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        {currentLocation?.id === item.id && <Check size={16} className="active-check" />}
                      </button>
                      <button
                        className={`fav-toggle-btn ${isFavorite(item.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item);
                        }}
                        title={isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label={`Toggle favorite for ${item.name}`}
                      >
                        <Heart size={16} fill={isFavorite(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-search-results">
                  <p>No locations found matching &ldquo;{searchQuery}&rdquo;</p>
                  <span className="no-results-hint">Check spelling or try a broader city name.</span>
                </div>
              )}
            </div>
          )}

          {/* Favorite Locations List (shown when not searching) */}
          {!hasSearchQuery && favorites.length > 0 && (
            <div className="section-block">
              <div className="section-title-row">
                <Heart size={14} className="text-amber" />
                <span className="section-title">FAVORITE LOCATIONS</span>
              </div>
              <div className="location-item-list">
                {favorites.map((fav) => (
                  <div key={fav.id} className="location-list-item">
                    <button
                      className="location-select-action"
                      onClick={() => handleSelectLocation(fav)}
                    >
                      <MapPin size={16} className="location-pin" />
                      <div className="location-meta">
                        <div className="location-title-row">
                          <span className="location-title">{fav.name}</span>
                          {fav.countryCode && (
                            <span className="country-code-pill">{fav.countryCode}</span>
                          )}
                        </div>
                        <span className="location-subtitle">
                          {[fav.state, fav.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      {currentLocation?.id === fav.id && <Check size={16} className="active-check" />}
                    </button>
                    <button
                      className="fav-toggle-btn active"
                      onClick={() => removeFavorite(fav.id)}
                      title="Remove from favorites"
                      aria-label={`Remove ${fav.name} from favorites`}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches List (shown when not searching) */}
          {!hasSearchQuery && recentSearches.length > 0 && (
            <div className="section-block">
              <div className="section-title-row">
                <div className="section-title-left">
                  <Clock size={14} />
                  <span className="section-title">RECENT LOCATIONS</span>
                </div>
                <button
                  className="clear-all-recent-btn"
                  onClick={handleClearAllRecent}
                  title="Clear all recent searches"
                  aria-label="Clear all recent searches"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              </div>
              <div className="location-item-list">
                {recentSearches.map((rec) => (
                  <div key={rec.id} className="location-list-item">
                    <button
                      className="location-select-action"
                      onClick={() => handleSelectLocation(rec)}
                    >
                      <Clock size={15} className="recent-clock-icon" />
                      <div className="location-meta">
                        <div className="location-title-row">
                          <span className="location-title">{rec.name}</span>
                          {rec.countryCode && (
                            <span className="country-code-pill">{rec.countryCode}</span>
                          )}
                        </div>
                        <span className="location-subtitle">
                          {[rec.state, rec.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </button>
                    <div className="recent-actions">
                      <button
                        className={`fav-toggle-btn ${isFavorite(rec.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          isFavorite(rec.id) ? removeFavorite(rec.id) : addFavorite(rec);
                        }}
                        aria-label="Toggle favorite"
                        title="Toggle favorite"
                      >
                        <Heart size={16} fill={isFavorite(rec.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="remove-recent-item-btn"
                        onClick={(e) => handleRemoveRecent(e, rec.id)}
                        aria-label={`Remove ${rec.name} from recent`}
                        title="Remove from history"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no search query and no searches/favorites */}
          {!hasSearchQuery && favorites.length === 0 && recentSearches.length === 0 && (
            <div className="empty-search-state">
              <MapPin size={32} className="empty-search-icon" />
              <p className="empty-search-text">
                Search globally or tap &ldquo;Use Precise Device Location&rdquo; above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
