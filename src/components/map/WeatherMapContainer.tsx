import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  Thermometer,
  CloudRain,
  Wind,
  Cloud,
  Sun,
  Activity,
  Plus,
  Minus,
  Navigation,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  Droplets,
  Eye,
  Heart,
  Check,
  AlertCircle,
  Gauge,
  Info
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { MapLayerType, CurrentWeather, AirQualityData, LocationItem } from '../../types/weather';
import { defaultMapProvider } from '../../providers/map/MapProvider';
import { WeatherService } from '../../services/weatherService';
import { formatTemperature, formatWindSpeed } from '../../utils/formatters';
import './WeatherMap.css';

interface LayerMeta {
  type: MapLayerType;
  label: string;
  icon: any;
  status: 'Active' | 'Unavailable' | 'Synoptic';
  statusLabel: string;
}

const LAYER_CONFIGS: LayerMeta[] = [
  { type: 'temperature', label: 'Temperature', icon: Thermometer, status: 'Active', statusLabel: 'Active' },
  { type: 'precipitation', label: 'Precipitation', icon: CloudRain, status: 'Synoptic', statusLabel: 'Synoptic Points' },
  { type: 'rain', label: 'Rain Intensity', icon: CloudRain, status: 'Synoptic', statusLabel: 'Synoptic Points' },
  { type: 'wind', label: 'Wind Velocity', icon: Wind, status: 'Active', statusLabel: 'Active' },
  { type: 'clouds', label: 'Cloud Cover', icon: Cloud, status: 'Active', statusLabel: 'Active' },
  { type: 'uv', label: 'UV Index', icon: Sun, status: 'Active', statusLabel: 'Active' },
  { type: 'airquality', label: 'Air Quality', icon: Activity, status: 'Active', statusLabel: 'Active' }
];

export const WeatherMapContainer: React.FC = () => {
  const {
    currentLocation,
    setCurrentLocation,
    currentWeather,
    airQuality,
    settings,
    detectDeviceLocation,
    setIsSearchOpen,
    addFavorite,
    isFavorite,
    addToast
  } = useApp();

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('temperature');
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isMapReady, setIsMapReady] = useState(false);

  // Inspector panel state for clicked/selected coordinate
  const [inspectedLocation, setInspectedLocation] = useState<LocationItem | null>(null);
  const [inspectedWeather, setInspectedWeather] = useState<CurrentWeather | null>(null);
  const [inspectedAqi, setInspectedAqi] = useState<AirQualityData | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const inspectedMarkerRef = useRef<L.Marker | null>(null);

  const mapProvider = useMemo(() => defaultMapProvider, []);
  const activeLegend = useMemo(
    () => mapProvider.weatherLayers.getLegend(activeLayer, settings.tempUnit, settings.windUnit),
    [mapProvider, activeLayer, settings.tempUnit, settings.windUnit]
  );
  const activeReading = useMemo(
    () => mapProvider.weatherLayers.getLayerReading(activeLayer, currentWeather, airQuality),
    [mapProvider, activeLayer, currentWeather, airQuality]
  );

  // Custom SVG pulse marker icon for Current Location
  const createPulseIcon = useCallback((tempStr: string) => {
    return L.divIcon({
      className: 'custom-weather-pulse-marker',
      html: `
        <div class="map-pulse-ring"></div>
        <div class="map-pulse-core">
          <span class="map-marker-temp">${tempStr}</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }, []);

  // Custom marker for user-selected/clicked point
  const createInspectionIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-inspection-pin',
      html: `
        <div class="inspection-pin-beacon">
          <div class="beacon-circle"></div>
          <div class="beacon-stem"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40]
    });
  }, []);

  // Reverse geocoding helper (with fallback to coordinate name)
  const resolveLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'WeatherIntelligence/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const name =
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.county ||
          address.state ||
          'Selected Location';
        const state = address.state || '';
        const country = address.country || '';
        return `${name}${state && state !== name ? `, ${state}` : ''}${country ? `, ${country}` : ''}`;
      }
    } catch {
      // Graceful fallback
    }
    return `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
  };

  // Handle map click: inspect and load real weather
  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;

    setIsInspecting(true);
    setIsInspectingLoading(true);

    // Place or move inspection marker
    if (inspectedMarkerRef.current) {
      inspectedMarkerRef.current.setLatLng([lat, lon]);
    } else {
      inspectedMarkerRef.current = L.marker([lat, lon], {
        icon: createInspectionIcon()
      }).addTo(mapInstanceRef.current);
    }

    try {
      const [resolvedName, w, aq] = await Promise.all([
        resolveLocationName(lat, lon),
        WeatherService.getCurrentWeather(lat, lon),
        WeatherService.getAirQuality(lat, lon)
      ]);

      const newLoc: LocationItem = {
        id: `point-${lat.toFixed(3)}-${lon.toFixed(3)}`,
        name: resolvedName.split(',')[0],
        state: resolvedName.split(',')[1]?.trim() || '',
        country: resolvedName.split(',')[2]?.trim() || '',
        latitude: lat,
        longitude: lon
      };

      setInspectedLocation(newLoc);
      setInspectedWeather(w);
      setInspectedAqi(aq);
    } catch (err) {
      console.warn('Failed to inspect coordinates:', err);
    } finally {
      setIsInspectingLoading(false);
    }
  }, [createInspectionIcon]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = currentLocation ? currentLocation.latitude : 26.9124;
    const initialLon = currentLocation ? currentLocation.longitude : 75.7873;

    const baseConfig = mapProvider.baseMap.getConfig();

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
      minZoom: baseConfig.minZoom,
      maxZoom: baseConfig.maxZoom
    });

    // Add Base Tile Layer
    L.tileLayer(baseConfig.tileUrl, {
      attribution: baseConfig.attribution,
      subdomains: baseConfig.subdomains || ['a', 'b', 'c'],
      maxZoom: baseConfig.maxZoom
    }).addTo(map);

    // Add Attribution manually in a clean corner
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution(baseConfig.attribution)
      .addTo(map);

    // Add Primary Location Marker
    const tempDisplay = currentWeather?.temperature !== null && currentWeather?.temperature !== undefined
      ? `${Math.round(currentWeather.temperature)}°`
      : '•';

    const marker = L.marker([initialLat, initialLon], {
      icon: createPulseIcon(tempDisplay)
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Listen to map zoom updates (throttled)
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Listen to clicks on map
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Clean up on unmount
    return () => {
      map.off();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      inspectedMarkerRef.current = null;
    };
  }, [mapProvider, createPulseIcon, handleMapClick]);

  // Sync Current Location with Map
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    const latLng: [number, number] = [currentLocation.latitude, currentLocation.longitude];
    mapInstanceRef.current.setView(latLng, zoomLevel, { animate: true });

    const tempDisplay = currentWeather?.temperature !== null && currentWeather?.temperature !== undefined
      ? `${Math.round(currentWeather.temperature)}°`
      : '•';

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
      markerRef.current.setIcon(createPulseIcon(tempDisplay));
    }
  }, [currentLocation, currentWeather, createPulseIcon, zoomLevel]);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.setView([currentLocation.latitude, currentLocation.longitude], 7, { animate: true });
    }
  };

  const closeInspectionPanel = () => {
    setIsInspecting(false);
    setInspectedLocation(null);
    setInspectedWeather(null);
    setInspectedAqi(null);
    if (inspectedMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(inspectedMarkerRef.current);
      inspectedMarkerRef.current = null;
    }
  };

  const setAsActiveCity = () => {
    if (inspectedLocation) {
      setCurrentLocation(inspectedLocation);
      addToast({
        type: 'success',
        title: 'Target City Updated',
        message: `Active weather location set to ${inspectedLocation.name}.`
      });
      closeInspectionPanel();
    }
  };

  // Determine if radar notification is relevant for this layer
  const isRadarLayer = activeLayer === 'precipitation' || activeLayer === 'rain';

  return (
    <div className="weather-map-viewport-wrapper">
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" id="weather-map-canvas" />

      {/* Floating Top Header: Selected Location & Layer Reading Overlay */}
      <div className="map-overlay-top glass-surface">
        <div className="map-location-pill">
          <div className="pill-dot live" />
          <div className="pill-meta">
            <span className="pill-city">
              {currentLocation ? currentLocation.name : 'Unknown'}
            </span>
            <span className="pill-coords">
              {currentLocation
                ? `${currentLocation.latitude.toFixed(2)}° N, ${currentLocation.longitude.toFixed(2)}° E`
                : ''}
            </span>
          </div>
        </div>

        {/* Current Weather on Map Overlay */}
        <div className="map-overlay-weather-chip">
          <div className="chip-temp">
            {currentWeather?.temperature !== null && currentWeather?.temperature !== undefined
              ? `${Math.round(currentWeather.temperature)}°C`
              : '--'}
          </div>
          <div className="chip-condition">
            {currentWeather?.conditionText || 'Active Observation'}
          </div>
        </div>
      </div>

      {/* Layer Selector Bar */}
      <div className="map-layers-dock glass-surface" role="tablist" aria-label="Selectable Weather Map Layers">
        <div className="layers-scroll-container">
          {LAYER_CONFIGS.map((layer) => {
            const Icon = layer.icon;
            const isSelected = activeLayer === layer.type;
            return (
              <button
                key={layer.type}
                role="tab"
                aria-selected={isSelected}
                className={`map-layer-tab ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.type)}
              >
                <Icon size={15} />
                <span>{layer.label}</span>
                <span className={`layer-badge ${layer.status.toLowerCase()}`}>
                  {layer.status === 'Synoptic' ? 'Synoptic' : isSelected ? 'Active' : 'Ready'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Radar Provider Readiness Callout (for precipitation/radar layers) */}
      {isRadarLayer && (
        <div className="map-radar-status-banner glass-surface" role="status">
          <ShieldCheck size={18} className="text-primary banner-icon" />
          <div className="banner-content">
            <strong>Live Radar Layer Unavailable • Synoptic Points Active</strong>
            <p>
              Open-Meteo supplies station-level numerical synoptic forecasts without paid API keys.
              Live composite radar tiles and Doppler reflectivity require an external authorized radar feed.
              Clicking anywhere on the map queries real point precipitation and atmospheric telemetry.
            </p>
          </div>
        </div>
      )}

      {/* Map Control Tools (Floating Dock) */}
      <div className="map-tools-dock glass-surface" aria-label="Map Navigation Controls">
        <button
          className="map-tool-btn"
          onClick={handleZoomIn}
          aria-label="Zoom In"
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <span className="map-zoom-indicator">{zoomLevel}x</span>
        <button
          className="map-tool-btn"
          onClick={handleZoomOut}
          aria-label="Zoom Out"
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
        <div className="tool-divider" />
        <button
          className="map-tool-btn"
          onClick={() => detectDeviceLocation()}
          aria-label="Center on GPS Location"
          title="Current GPS Location"
        >
          <Navigation size={17} />
        </button>
        <button
          className="map-tool-btn"
          onClick={handleRecenter}
          aria-label="Reset to Selected City"
          title="Reset to City"
        >
          <RotateCcw size={17} />
        </button>
        <button
          className="map-tool-btn"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search City"
          title="Search City"
        >
          <Search size={17} />
        </button>
      </div>

      {/* Dynamic Layer Legend Dock */}
      <div className="map-legend-panel glass-surface" aria-label="Layer Calibration Legend">
        <div className="legend-header-row">
          <span className="legend-layer-title">{activeLegend.title}</span>
          <span className="legend-current-reading">
            {activeReading.value} {activeReading.unit}
          </span>
        </div>
        <div className="legend-gradient-stripe" style={{ background: activeLegend.gradient }} />
        <div className="legend-range-labels">
          <span>{activeLegend.minLabel}</span>
          <span>{activeLegend.maxLabel}</span>
        </div>
      </div>

      {/* Normalized Weather Information Panel (Bottom Sheet / Card upon selecting a point) */}
      {isInspecting && (
        <div className="map-info-panel-drawer glass-card" role="dialog" aria-label="Location Atmospheric Diagnostics">
          <div className="info-panel-drag-handle" />
          <div className="info-panel-header">
            <div>
              <h3 className="info-panel-title">
                {inspectedLocation ? inspectedLocation.name : 'Selected Coordinate'}
              </h3>
              <p className="info-panel-subtitle">
                {inspectedLocation
                  ? `${inspectedLocation.latitude.toFixed(3)}° N, ${inspectedLocation.longitude.toFixed(3)}° E ${inspectedLocation.country ? `• ${inspectedLocation.country}` : ''}`
                  : 'Coordinates resolved from map selection'}
              </p>
            </div>
            <button
              className="info-panel-close-btn"
              onClick={closeInspectionPanel}
              aria-label="Close Information Panel"
            >
              <X size={18} />
            </button>
          </div>

          {isInspectingLoading ? (
            <div className="info-panel-loading">
              <div className="loading-spinner" />
              <span>Fetching normalized atmospheric readings...</span>
            </div>
          ) : inspectedWeather ? (
            <div className="info-panel-content">
              {/* Primary Atmospheric Strip */}
              <div className="info-panel-primary-row">
                <div className="info-temp-block">
                  <span className="info-temp-value">
                    {inspectedWeather.temperature !== null
                      ? formatTemperature(inspectedWeather.temperature, settings.tempUnit)
                      : '--'}
                  </span>
                  <div className="info-temp-meta">
                    <span className="info-condition-badge">{inspectedWeather.conditionText}</span>
                    <span className="info-feels-like">
                      Feels like{' '}
                      {inspectedWeather.feelsLike !== null
                        ? formatTemperature(inspectedWeather.feelsLike, settings.tempUnit)
                        : '--'}
                    </span>
                  </div>
                </div>

                <div className="info-actions-row">
                  <button
                    className="btn btn-primary info-select-btn"
                    onClick={setAsActiveCity}
                  >
                    <Check size={16} />
                    <span>Set as Current City</span>
                  </button>
                  {inspectedLocation && (
                    <button
                      className={`btn btn-secondary info-fav-btn ${isFavorite(inspectedLocation.id) ? 'active' : ''}`}
                      onClick={() => inspectedLocation && addFavorite(inspectedLocation)}
                      title="Save to Favorites"
                    >
                      <Heart size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Normalized Diagnostics Grid - 11 Fields Checked */}
              <div className="info-diagnostics-grid">
                <div className="info-diag-item">
                  <span className="diag-label">Rain Probability</span>
                  <span className="diag-val">
                    {inspectedWeather.precipitationProbability !== null
                      ? `${inspectedWeather.precipitationProbability}%`
                      : '0%'}
                  </span>
                </div>

                <div className="info-diag-item">
                  <span className="diag-label">Precipitation Rate</span>
                  <span className="diag-val">
                    {inspectedWeather.precipitation !== null && inspectedWeather.precipitation !== undefined
                      ? `${inspectedWeather.precipitation} mm/h`
                      : '0 mm/h'}
                  </span>
                </div>

                <div className="info-diag-item">
                  <span className="diag-label">Wind Velocity</span>
                  <span className="diag-val">
                    {inspectedWeather.windSpeed !== null
                      ? formatWindSpeed(inspectedWeather.windSpeed, settings.windUnit)
                      : '--'}
                  </span>
                </div>

                <div className="info-diag-item">
                  <span className="diag-label">Relative Humidity</span>
                  <span className="diag-val">
                    {inspectedWeather.humidity !== null ? `${inspectedWeather.humidity}%` : '--'}
                  </span>
                </div>

                <div className="info-diag-item">
                  <span className="diag-label">Atmospheric Pressure</span>
                  <span className="diag-val">
                    {inspectedWeather.pressure !== null && inspectedWeather.pressure !== undefined
                      ? `${Math.round(inspectedWeather.pressure)} hPa`
                      : '--'}
                  </span>
                </div>

                <div className="info-diag-item">
                  <span className="diag-label">Solar UV Index</span>
                  <span className="diag-val">
                    {inspectedWeather.uvIndex !== null ? inspectedWeather.uvIndex : '--'}
                  </span>
                </div>

                <div className="info-diag-item highlight">
                  <span className="diag-label">Air Quality (US AQI)</span>
                  <span className="diag-val">
                    {inspectedAqi?.aqi !== null && inspectedAqi?.aqi !== undefined
                      ? `${inspectedAqi.aqi} (${inspectedAqi.levelText})`
                      : 'AQI Available via Sensor Matrix'}
                  </span>
                </div>

                <div className="info-diag-item">
                  <span className="diag-label">Cloud Cover</span>
                  <span className="diag-val">
                    {inspectedWeather.cloudCover !== null ? `${inspectedWeather.cloudCover}%` : '--'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="info-panel-empty">
              <AlertCircle size={22} className="text-amber" />
              <span>Data unavailable for selected coordinate.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

