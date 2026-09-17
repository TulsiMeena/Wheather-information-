/**
 * Multi-Location Weather Service
 * Manages independent telemetry queries for favorite locations with per-city fault isolation,
 * centralized cache integration, and zero-lag rendering.
 */

import { FavoriteLocationItem, FavoriteWeatherSnapshot } from '../types/weather';
import { WeatherService } from './weatherService';
import { CacheManager } from './cache/CacheManager';

export interface MultiLocationResult {
  location: FavoriteLocationItem;
  weather: FavoriteWeatherSnapshot;
}

export class MultiLocationService {
  /**
   * Fetch weather snapshot for a single favorite location using cached telemetry where fresh.
   * If network fails or times out, returns cached data or graceful error state without throwing.
   */
  static async fetchCitySnapshot(
    location: FavoriteLocationItem,
    tempUnit: 'C' | 'F' = 'C',
    forceRefresh: boolean = false
  ): Promise<FavoriteWeatherSnapshot> {
    const cacheKey = CacheManager.generateKey(location.latitude, location.longitude, tempUnit, 'multi');
    const cached = CacheManager.get<FavoriteWeatherSnapshot>(cacheKey);

    if (!forceRefresh && cached && CacheManager.isFresh(cached)) {
      return cached.data;
    }

    try {
      // Parallelize current weather and air quality for fast response
      const [currentWeather, airQuality] = await Promise.allSettled([
        WeatherService.getCurrentWeather(location.latitude, location.longitude),
        WeatherService.getAirQuality(location.latitude, location.longitude)
      ]);

      const weatherData = currentWeather.status === 'fulfilled' ? currentWeather.value : null;
      const aqiData = airQuality.status === 'fulfilled' ? airQuality.value : null;

      if (!weatherData) {
        // If live query failed but we have stale cache, return stale cache marked with note
        if (cached && cached.data) {
          return {
            ...cached.data,
            errorMessage: 'Displaying cached telemetry (network offline)'
          };
        }

        return {
          temperature: null,
          feelsLike: null,
          condition: 'clear',
          conditionText: 'Temporarily unavailable',
          rainProbability: null,
          windSpeed: null,
          aqi: null,
          lastUpdated: new Date().toISOString(),
          status: 'error',
          errorMessage: 'Telemetry temporarily unavailable'
        };
      }

      const snapshot: FavoriteWeatherSnapshot = {
        temperature: weatherData.temperature,
        feelsLike: weatherData.feelsLike,
        condition: weatherData.condition,
        conditionText: weatherData.conditionText,
        rainProbability: weatherData.precipitationProbability,
        windSpeed: weatherData.windSpeed,
        aqi: aqiData?.us_aqi ?? aqiData?.aqi ?? null,
        aqiLevelText: aqiData?.levelText,
        lastUpdated: new Date().toISOString(),
        status: 'ready'
      };

      // Store in centralized cache
      CacheManager.set(cacheKey, snapshot, 'multi', 'Open-Meteo', location.timezone);

      return snapshot;
    } catch (err: any) {
      console.warn(`[MultiLocationService] Error fetching city ${location.city}:`, err);
      if (cached && cached.data) {
        return {
          ...cached.data,
          errorMessage: 'Offline · Using cached data'
        };
      }
      return {
        temperature: null,
        feelsLike: null,
        condition: 'clear',
        conditionText: 'Temporarily unavailable',
        rainProbability: null,
        windSpeed: null,
        aqi: null,
        lastUpdated: new Date().toISOString(),
        status: 'error',
        errorMessage: 'Connection timed out'
      };
    }
  }

  /**
   * Fetch snapshots for multiple cities in parallel with Promise.allSettled to ensure fault isolation
   */
  static async fetchAllCities(
    locations: FavoriteLocationItem[],
    tempUnit: 'C' | 'F' = 'C',
    forceRefresh: boolean = false
  ): Promise<Record<string, FavoriteWeatherSnapshot>> {
    const results: Record<string, FavoriteWeatherSnapshot> = {};

    const settled = await Promise.allSettled(
      locations.map(async (loc) => {
        const snap = await this.fetchCitySnapshot(loc, tempUnit, forceRefresh);
        return { id: loc.id, snapshot: snap };
      })
    );

    settled.forEach((res, index) => {
      const loc = locations[index];
      if (res.status === 'fulfilled') {
        results[res.value.id] = res.value.snapshot;
      } else {
        results[loc.id] = {
          temperature: null,
          feelsLike: null,
          condition: 'clear',
          conditionText: 'Temporarily unavailable',
          rainProbability: null,
          windSpeed: null,
          aqi: null,
          lastUpdated: new Date().toISOString(),
          status: 'error',
          errorMessage: 'Could not connect to station'
        };
      }
    });

    return results;
  }
}
