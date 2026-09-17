import { LocationItem } from '../types/weather';
import { ILocationProvider } from './LocationProvider';
import { storageProvider } from './StorageProvider';

export class OpenMeteoLocationProvider implements ILocationProvider {
  id = 'open_meteo_location';
  name = 'Open-Meteo Geocoding & Browser Geolocation';

  /**
   * Reverse geocode coordinates to obtain a human-readable city, state, and country.
   * Employs free client reverse geocoding with multiple fallback strategies.
   */
  async reverseGeocode(lat: number, lon: number): Promise<LocationItem> {
    try {
      // Strategy 1: BigDataCloud Client-side reverse geocoding (Fast, free, CORS-friendly, no key required)
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const response = await fetch(bdcUrl);
      if (response.ok) {
        const data = await response.json();
        const cityName = data.city || data.locality || data.principalSubdivision || 'Detected Location';
        const stateName = data.principalSubdivision && data.principalSubdivision !== cityName ? data.principalSubdivision : undefined;
        const countryName = data.countryName || 'Local Region';
        const countryCode = data.countryCode || undefined;

        return {
          id: `loc-${lat.toFixed(4)}-${lon.toFixed(4)}`,
          name: cityName,
          state: stateName,
          country: countryName,
          countryCode,
          latitude: lat,
          longitude: lon
        };
      }
    } catch (e) {
      console.warn('[OpenMeteoLocationProvider] BigDataCloud reverse geocode fallback:', e);
    }

    try {
      // Strategy 2: OpenStreetMap Nominatim reverse geocode fallback
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(nomUrl, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const cityName = address.city || address.town || address.village || address.suburb || address.county || 'Current Location';
        const stateName = address.state || address.region;
        const countryName = address.country || 'Detected Region';
        const countryCode = address.country_code ? address.country_code.toUpperCase() : undefined;

        return {
          id: `loc-${lat.toFixed(4)}-${lon.toFixed(4)}`,
          name: cityName,
          state: stateName,
          country: countryName,
          countryCode,
          latitude: lat,
          longitude: lon
        };
      }
    } catch (e) {
      console.warn('[OpenMeteoLocationProvider] Nominatim reverse geocode fallback:', e);
    }

    // Safe fallback if network/services are unreachable
    return {
      id: `loc-${lat.toFixed(4)}-${lon.toFixed(4)}`,
      name: 'Current Location',
      country: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      latitude: lat,
      longitude: lon
    };
  }

  /**
   * Browser Geolocation API with human-readable reverse geocoding
   */
  async getCurrentLocation(): Promise<LocationItem | null> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const resolvedLoc = await this.reverseGeocode(latitude, longitude);
            resolve(resolvedLoc);
          } catch (e) {
            resolve({
              id: `gps-${position.coords.latitude.toFixed(3)}-${position.coords.longitude.toFixed(3)}`,
              name: 'Current Location',
              country: 'Detected Position',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        },
        (error) => {
          console.warn('[OpenMeteoLocationProvider] Geolocation error:', error.message);
          let userMsg = 'Could not access location.';
          if (error.code === error.PERMISSION_DENIED) {
            userMsg = 'Location permission was denied. You can search for your city instead.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            userMsg = 'Location position is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            userMsg = 'Location request timed out. Please try again or search by city name.';
          }
          reject(new Error(userMsg));
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    });
  }

  /**
   * Search locations using Open-Meteo Geocoding API
   * Endpoint: https://geocoding-api.open-meteo.com/v1/search
   */
  async searchLocations(query: string): Promise<LocationItem[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=10&language=en&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((item: any) => ({
        id: `openmeteo-${item.id || `${item.latitude}-${item.longitude}`}`,
        name: item.name,
        state: item.admin1 || item.admin2 || undefined,
        country: item.country || '',
        countryCode: item.country_code ? item.country_code.toUpperCase() : undefined,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone
      }));
    } catch (e) {
      console.error('[OpenMeteoLocationProvider] searchLocations error:', e);
      throw e;
    }
  }

  async getRecentSearches(): Promise<LocationItem[]> {
    return storageProvider.getItem<LocationItem[]>('recent_searches', []);
  }

  async saveRecentSearch(item: LocationItem): Promise<void> {
    const list = await this.getRecentSearches();
    const filtered = list.filter(
      (i) => i.id !== item.id && (Math.abs(i.latitude - item.latitude) > 0.01 || Math.abs(i.longitude - item.longitude) > 0.01)
    );
    const updated = [item, ...filtered].slice(0, 8);
    await storageProvider.setItem('recent_searches', updated);
  }

  async removeRecentSearch(id: string): Promise<void> {
    const list = await this.getRecentSearches();
    const updated = list.filter((i) => i.id !== id);
    await storageProvider.setItem('recent_searches', updated);
  }

  async clearRecentSearches(): Promise<void> {
    await storageProvider.setItem('recent_searches', []);
  }
}
