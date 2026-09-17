import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  WeatherAlert,
  AlertCategory,
  AlertSeverity
} from '../types/weather';
import { IWeatherProvider } from './WeatherProvider';
import { parseWmoWeatherCode } from '../utils/weatherCodes';

interface CachedForecast {
  timestamp: number;
  data: any;
}

export class OpenMeteoWeatherProvider implements IWeatherProvider {
  id = 'open_meteo';
  name = 'Open-Meteo Weather Engine';
  isReady = true;

  private cache = new Map<string, CachedForecast>();
  private activeRequests = new Map<string, Promise<any>>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(3)},${lon.toFixed(3)}`;
  }

  /**
   * Unified fetch for current, hourly and daily data from Open-Meteo.
   * Uses deduplication and in-memory TTL caching.
   */
  private async fetchRawForecast(lat: number, lon: number, signal?: AbortSignal): Promise<any> {
    const key = this.getCacheKey(lat, lon);
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key);
    }

    const currentParams = [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'visibility',
      'uv_index',
      'is_day'
    ].join(',');

    const hourlyParams = [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation_probability',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'visibility',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
      'is_day'
    ].join(',');

    const dailyParams = [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'rain_sum',
      'showers_sum',
      'snowfall_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'uv_index_max'
    ].join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto&forecast_days=10&wind_speed_unit=kmh&precipitation_unit=mm&timeformat=iso8601`;

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Open-Meteo rate limit reached. Please try again in a moment.');
          }
          throw new Error(`Weather service error (HTTP ${response.status})`);
        }
        const json = await response.json();
        if (json.error) {
          throw new Error(json.reason || 'Failed to retrieve forecast from Open-Meteo.');
        }

        this.cache.set(key, { timestamp: Date.now(), data: json });
        return json;
      } finally {
        this.activeRequests.delete(key);
      }
    })();

    this.activeRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Calculate dew point from temperature (°C) and relative humidity (%) using Magnus-Tetens approximation.
   */
  private calculateDewPoint(tempC: number, rh: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = (a * tempC) / (b + tempC) + Math.log(Math.max(rh, 1) / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return Math.round(dewPoint * 10) / 10;
  }

  async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
    try {
      const data = await this.fetchRawForecast(lat, lon);
      const curr = data.current;
      const daily = data.daily;
      if (!curr) return null;

      const isDay = curr.is_day === 1;
      const weatherInfo = parseWmoWeatherCode(curr.weather_code, isDay);

      // High and Low from today's daily
      const highTemp = daily?.temperature_2m_max?.[0] ?? curr.temperature_2m;
      const lowTemp = daily?.temperature_2m_min?.[0] ?? curr.temperature_2m;
      const sunrise = daily?.sunrise?.[0] ?? null;
      const sunset = daily?.sunset?.[0] ?? null;

      // Visibility from meters to km
      const visibilityKm = curr.visibility !== undefined && curr.visibility !== null
        ? Math.round((curr.visibility / 1000) * 10) / 10
        : null;

      // Dew point calculation
      const dewPoint = curr.temperature_2m !== undefined && curr.relative_humidity_2m !== undefined
        ? this.calculateDewPoint(curr.temperature_2m, curr.relative_humidity_2m)
        : null;

      // Current precipitation probability from first hour
      const hourlyPrecipProb = data.hourly?.precipitation_probability?.[0] ?? null;

      return {
        temperature: curr.temperature_2m ?? null,
        feelsLike: curr.apparent_temperature ?? curr.temperature_2m,
        condition: weatherInfo.condition,
        conditionText: weatherInfo.description,
        weatherCode: curr.weather_code,
        category: weatherInfo.category,
        highTemp: highTemp ?? null,
        lowTemp: lowTemp ?? null,
        humidity: curr.relative_humidity_2m ?? null,
        windSpeed: curr.wind_speed_10m ?? null,
        windDirection: curr.wind_direction_10m ?? null,
        windGusts: curr.wind_gusts_10m ?? null,
        precipitation: curr.precipitation ?? null,
        rain: curr.rain ?? null,
        showers: curr.showers ?? null,
        snowfall: curr.snowfall ?? null,
        uvIndex: curr.uv_index ?? null,
        visibility: visibilityKm,
        precipitationProbability: hourlyPrecipProb ?? (curr.precipitation > 0 ? 100 : 0),
        pressure: curr.surface_pressure ? Math.round(curr.surface_pressure) : null,
        dewPoint,
        cloudCover: curr.cloud_cover ?? null,
        sunrise,
        sunset,
        isDaytime: isDay,
        updatedAt: curr.time || new Date().toISOString(),
        isCached: false
      };
    } catch (e) {
      console.error('[OpenMeteoWeatherProvider] getCurrentWeather failed:', e);
      throw e;
    }
  }

  async getHourlyForecast(lat: number, lon: number): Promise<HourlyForecastItem[]> {
    try {
      const data = await this.fetchRawForecast(lat, lon);
      const hourly = data.hourly;
      if (!hourly || !hourly.time) return [];

      const nowIso = new Date();
      const currentHourIndex = hourly.time.findIndex((t: string) => {
        const itemDate = new Date(t);
        return itemDate.getTime() >= nowIso.getTime() - 3600000;
      });

      const startIndex = Math.max(0, currentHourIndex !== -1 ? currentHourIndex : 0);
      const next24 = hourly.time.slice(startIndex, startIndex + 24);

      return next24.map((timeStr: string, idx: number) => {
        const actualIdx = startIndex + idx;
        const isDay = hourly.is_day?.[actualIdx] === 1;
        const code = hourly.weather_code?.[actualIdx];
        const info = parseWmoWeatherCode(code, isDay);
        const itemDate = new Date(timeStr);
        const formattedHour = itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
          id: `hour-${timeStr}`,
          time: formattedHour,
          fullTime: timeStr,
          temperature: hourly.temperature_2m?.[actualIdx] ?? null,
          apparentTemperature: hourly.apparent_temperature?.[actualIdx] ?? null,
          condition: info.condition,
          conditionText: info.description,
          weatherCode: code,
          precipitationProbability: hourly.precipitation_probability?.[actualIdx] ?? 0,
          precipitation: hourly.precipitation?.[actualIdx] ?? 0,
          rain: hourly.rain?.[actualIdx] ?? 0,
          snowfall: hourly.snowfall?.[actualIdx] ?? 0,
          windSpeed: hourly.wind_speed_10m?.[actualIdx] ?? null,
          windDirection: hourly.wind_direction_10m?.[actualIdx] ?? null,
          windGusts: hourly.wind_gusts_10m?.[actualIdx] ?? null,
          humidity: hourly.relative_humidity_2m?.[actualIdx] ?? null,
          uvIndex: hourly.uv_index?.[actualIdx] ?? null,
          cloudCover: hourly.cloud_cover?.[actualIdx] ?? null,
          isDaytime: isDay,
          isNow: idx === 0
        };
      });
    } catch (e) {
      console.error('[OpenMeteoWeatherProvider] getHourlyForecast failed:', e);
      throw e;
    }
  }

  async getDailyForecast(lat: number, lon: number): Promise<DailyForecastItem[]> {
    try {
      const data = await this.fetchRawForecast(lat, lon);
      const daily = data.daily;
      if (!daily || !daily.time) return [];

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return daily.time.map((dateStr: string, idx: number) => {
        const dateObj = new Date(dateStr);
        const isToday = idx === 0;
        const isTomorrow = idx === 1;
        const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayNames[dateObj.getDay()];
        const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

        const code = daily.weather_code?.[idx];
        const info = parseWmoWeatherCode(code, true);

        return {
          id: `day-${dateStr}`,
          day: dayLabel,
          date: formattedDate,
          fullDate: dateStr,
          condition: info.condition,
          conditionText: info.description,
          weatherCode: code,
          highTemp: daily.temperature_2m_max?.[idx] ?? null,
          lowTemp: daily.temperature_2m_min?.[idx] ?? null,
          apparentHighTemp: daily.apparent_temperature_max?.[idx] ?? null,
          apparentLowTemp: daily.apparent_temperature_min?.[idx] ?? null,
          sunrise: daily.sunrise?.[idx] ?? null,
          sunset: daily.sunset?.[idx] ?? null,
          precipitationProbability: daily.precipitation_probability_max?.[idx] ?? 0,
          precipitationSum: daily.precipitation_sum?.[idx] ?? 0,
          rainSum: daily.rain_sum?.[idx] ?? 0,
          showersSum: daily.showers_sum?.[idx] ?? 0,
          snowfallSum: daily.snowfall_sum?.[idx] ?? 0,
          windSpeedMax: daily.wind_speed_10m_max?.[idx] ?? null,
          windGustsMax: daily.wind_gusts_10m_max?.[idx] ?? null,
          windDirectionDominant: daily.wind_direction_10m_dominant?.[idx] ?? null,
          uvIndexMax: daily.uv_index_max?.[idx] ?? null,
          isToday
        };
      });
    } catch (e) {
      console.error('[OpenMeteoWeatherProvider] getDailyForecast failed:', e);
      throw e;
    }
  }

  async getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      const data = await this.fetchRawForecast(lat, lon);
      const curr = data.current;
      const daily = data.daily;
      const hourly = data.hourly;
      const alerts: WeatherAlert[] = [];

      if (!curr) return [];

      // 1. Extreme Heat Check (high temp >= 38°C or apparent >= 40°C)
      const todayMax = daily?.temperature_2m_max?.[0];
      const todayApparentMax = daily?.apparent_temperature_max?.[0];
      if ((todayMax && todayMax >= 38) || (todayApparentMax && todayApparentMax >= 40)) {
        alerts.push({
          id: `alert-heat-${Date.now()}`,
          category: 'Extreme heat',
          title: `Extreme Heat Advisory (Peak ${Math.round(todayMax || todayApparentMax)}°C)`,
          severity: todayMax >= 42 ? 'severe' : 'warning',
          source: 'Open-Meteo Synoptic Detection',
          description: 'High ambient and apparent thermal levels detected today. Prolonged exposure may cause heat exhaustion.',
          startTime: daily?.sunrise?.[0] || 'Today 09:00',
          endTime: daily?.sunset?.[0] || 'Today 19:00',
          instructions: 'Hydrate frequently, stay in shaded or air-conditioned environments, and minimize strenuous outdoor activities during peak hours.'
        });
      }

      // 2. Strong Wind / Wind Gusts Check (gusts >= 55 km/h or sustained >= 45 km/h)
      const currentGust = curr.wind_gusts_10m || 0;
      const todayMaxWind = daily?.wind_gusts_10m_max?.[0] || 0;
      if (currentGust >= 55 || todayMaxWind >= 60) {
        const maxGust = Math.max(currentGust, todayMaxWind);
        alerts.push({
          id: `alert-wind-${Date.now()}`,
          category: 'Strong wind',
          title: `High Wind & Gust Warning (Up to ${Math.round(maxGust)} km/h)`,
          severity: maxGust >= 75 ? 'severe' : 'warning',
          source: 'Open-Meteo Synoptic Detection',
          description: `Intense boundary-layer wind gusts detected reaching ${Math.round(maxGust)} km/h.`,
          startTime: 'Current Outlook',
          endTime: 'Next 12 Hours',
          instructions: 'Secure lightweight outdoor items. Exercise caution when operating high-profile vehicles or walking near scaffolding.'
        });
      }

      // 3. Thunderstorm / Severe Storm Check (WMO 95, 96, 99)
      const code = curr.weather_code;
      const hasStormInNext6h = hourly?.weather_code?.slice(0, 6).some((c: number) => c === 95 || c === 96 || c === 99);
      if (code === 95 || code === 96 || code === 99 || hasStormInNext6h) {
        alerts.push({
          id: `alert-storm-${Date.now()}`,
          category: 'Thunderstorm',
          title: code === 99 ? 'Severe Thunderstorm with Hail Warning' : 'Active Thunderstorm Alert',
          severity: code === 99 || code === 96 ? 'severe' : 'warning',
          source: 'Open-Meteo Synoptic Detection',
          description: 'Convective storm activity detected with cloud-to-ground lightning and potential precipitation bursts.',
          startTime: 'Active Now',
          endTime: 'Next 6 Hours',
          instructions: 'Seek indoor shelter immediately. Disconnect sensitive electronics and avoid bodies of water or open elevated fields.'
        });
      }

      // 4. Heavy Rain / Flood Risk Check (Precipitation > 30mm/day or > 10mm/h)
      const precipSum = daily?.precipitation_sum?.[0] || 0;
      const currentPrecip = curr.precipitation || 0;
      if (precipSum >= 35 || currentPrecip >= 15) {
        alerts.push({
          id: `alert-rain-${Date.now()}`,
          category: 'Heavy rain',
          title: `Intense Rainfall Advisory (${Math.round(precipSum)} mm expected)`,
          severity: precipSum >= 60 ? 'severe' : 'warning',
          source: 'Open-Meteo Synoptic Detection',
          description: 'Sustained heavy precipitation may cause surface runoff and localized waterlogging.',
          startTime: 'Today',
          endTime: 'Tomorrow Morning',
          instructions: 'Exercise caution while commuting. Avoid low-lying underpasses and areas prone to flash ponding.'
        });
      }

      return alerts;
    } catch (e) {
      console.warn('[OpenMeteoWeatherProvider] getWeatherAlerts failed:', e);
      return [];
    }
  }
}
