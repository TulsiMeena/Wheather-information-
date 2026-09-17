import {
  HistoricalDataPoint,
  HistoricalHourlyPoint,
  HistoricalWeatherResult
} from '../../types/weather';
import { IHistoryProvider } from './HistoryProvider';
import { parseWmoWeatherCode } from '../../utils/weatherCodes';
import { DiagnosticsService } from '../../services/diagnosticsService';

interface CachedHistoryEntry {
  timestamp: number;
  result: HistoricalWeatherResult;
}

export class OpenMeteoHistoryProvider implements IHistoryProvider {
  id = 'open_meteo_history';
  name = 'Open-Meteo Historical Archive (ERA5 Reanalysis)';
  isAvailable = true;

  private cache = new Map<string, CachedHistoryEntry>();
  private activeRequests = new Map<string, Promise<HistoricalWeatherResult>>();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for historical records

  private getCacheKey(lat: number, lon: number, startDate: string, endDate: string, tz: string): string {
    return `${lat.toFixed(3)}_${lon.toFixed(3)}_${startDate}_${endDate}_${tz}`;
  }

  async getHistoricalWeather(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string,
    timezone: string = 'auto',
    signal?: AbortSignal
  ): Promise<HistoricalWeatherResult> {
    const key = this.getCacheKey(lat, lon, startDate, endDate, timezone);
    const now = Date.now();

    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      DiagnosticsService.recordRequest({
        provider: this.name,
        endpoint: 'archive-api.open-meteo.com/v1/archive',
        startTime: now,
        endTime: now,
        success: true,
        cacheHit: true
      });
      return cached.result;
    }

    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }

    const startTime = Date.now();

    const fetchPromise = (async () => {
      try {
        const dailyParams = [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'temperature_2m_mean',
          'apparent_temperature_mean',
          'precipitation_sum',
          'rain_sum',
          'wind_speed_10m_max',
          'wind_gusts_10m_max',
          'wind_direction_10m_dominant'
        ].join(',');

        const hourlyParams = [
          'temperature_2m',
          'relative_humidity_2m',
          'precipitation',
          'wind_speed_10m',
          'cloud_cover',
          'surface_pressure',
          'weather_code'
        ].join(',');

        const tzParam = timezone || 'auto';
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=${dailyParams}&hourly=${hourlyParams}&timezone=${encodeURIComponent(tzParam)}&wind_speed_unit=kmh&precipitation_unit=mm`;

        const res = await fetch(url, { signal });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.reason || `HTTP ${res.status}`;
          throw new Error(`Open-Meteo Archive Error: ${errMsg}`);
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.reason || 'Historical weather data is currently unavailable.');
        }

        if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
          throw new Error('Historical weather data is currently unavailable.');
        }

        // Process Daily Points
        const daily: HistoricalDataPoint[] = [];
        const times: string[] = data.daily.time || [];

        for (let i = 0; i < times.length; i++) {
          const wCode = data.daily.weather_code?.[i] ?? null;
          const parsed = wCode !== null ? parseWmoWeatherCode(wCode, true) : null;

          const tempMax = DiagnosticsService.validateNumber(data.daily.temperature_2m_max?.[i]);
          const tempMin = DiagnosticsService.validateNumber(data.daily.temperature_2m_min?.[i]);
          let tempMean = DiagnosticsService.validateNumber(data.daily.temperature_2m_mean?.[i]);
          if (tempMean === null && tempMax !== null && tempMin !== null) {
            tempMean = Math.round(((tempMax + tempMin) / 2) * 10) / 10;
          }

          daily.push({
            date: times[i],
            temperatureMax: tempMax,
            temperatureMin: tempMin,
            temperatureMean: tempMean,
            apparentTemperatureMean: DiagnosticsService.validateNumber(data.daily.apparent_temperature_mean?.[i]),
            precipitationSum: DiagnosticsService.validateNumber(data.daily.precipitation_sum?.[i]),
            rainSum: DiagnosticsService.validateNumber(data.daily.rain_sum?.[i]),
            windSpeedMax: DiagnosticsService.validateNumber(data.daily.wind_speed_10m_max?.[i]),
            windGustsMax: DiagnosticsService.validateNumber(data.daily.wind_gusts_10m_max?.[i]),
            windDirectionDominant: DiagnosticsService.validateNumber(data.daily.wind_direction_10m_dominant?.[i]),
            weatherCode: wCode,
            conditionText: parsed?.condition || 'Clear / Fair'
          });
        }

        // Process Hourly Points (aggregated if necessary, kept clean)
        const hourly: HistoricalHourlyPoint[] = [];
        const hourlyTimes: string[] = data.hourly?.time || [];

        for (let i = 0; i < hourlyTimes.length; i++) {
          hourly.push({
            time: hourlyTimes[i],
            temperature: DiagnosticsService.validateNumber(data.hourly?.temperature_2m?.[i]),
            humidity: DiagnosticsService.validateNumber(data.hourly?.relative_humidity_2m?.[i]),
            precipitation: DiagnosticsService.validateNumber(data.hourly?.precipitation?.[i]),
            windSpeed: DiagnosticsService.validateNumber(data.hourly?.wind_speed_10m?.[i]),
            cloudCover: DiagnosticsService.validateNumber(data.hourly?.cloud_cover?.[i]),
            surfacePressure: DiagnosticsService.validateNumber(data.hourly?.surface_pressure?.[i]),
            weatherCode: data.hourly?.weather_code?.[i] ?? null
          });
        }

        // Calculate average humidity and cloud cover per day from hourly if available
        if (hourly.length > 0) {
          const dayGroups = new Map<string, { humidities: number[]; clouds: number[] }>();
          for (const h of hourly) {
            const dayKey = h.time.split('T')[0];
            if (!dayGroups.has(dayKey)) {
              dayGroups.set(dayKey, { humidities: [], clouds: [] });
            }
            const g = dayGroups.get(dayKey)!;
            if (h.humidity !== null) g.humidities.push(h.humidity);
            if (h.cloudCover !== null) g.clouds.push(h.cloudCover);
          }

          for (const d of daily) {
            const g = dayGroups.get(d.date);
            if (g) {
              if (g.humidities.length > 0) {
                d.humidityMean = Math.round(g.humidities.reduce((a, b) => a + b, 0) / g.humidities.length);
              }
              if (g.clouds.length > 0) {
                d.cloudCoverMean = Math.round(g.clouds.reduce((a, b) => a + b, 0) / g.clouds.length);
              }
            }
          }
        }

        const result: HistoricalWeatherResult = {
          location: {
            name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
            latitude: lat,
            longitude: lon,
            country: '',
            timezone: data.timezone || timezone || 'UTC'
          },
          startDate,
          endDate,
          daily,
          hourly,
          source: 'Open-Meteo Historical Archive (ERA5)',
          retrievedAt: new Date().toISOString()
        };

        this.cache.set(key, { timestamp: Date.now(), result });

        DiagnosticsService.recordRequest({
          provider: this.name,
          endpoint: 'archive-api.open-meteo.com/v1/archive',
          startTime,
          endTime: Date.now(),
          success: true,
          cacheHit: false
        });

        return result;
      } catch (err: any) {
        DiagnosticsService.recordRequest({
          provider: this.name,
          endpoint: 'archive-api.open-meteo.com/v1/archive',
          startTime,
          endTime: Date.now(),
          success: false,
          error: err,
          cacheHit: false
        });
        throw err;
      } finally {
        this.activeRequests.delete(key);
      }
    })();

    this.activeRequests.set(key, fetchPromise);
    return fetchPromise;
  }
}

export const defaultHistoryProvider = new OpenMeteoHistoryProvider();
