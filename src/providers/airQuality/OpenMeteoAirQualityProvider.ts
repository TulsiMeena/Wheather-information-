import { AirQualityData, HourlyAqiItem, DataFreshness } from '../../types/weather';
import { IAirQualityProvider } from './AirQualityProvider';

interface CachedAqi {
  timestamp: number;
  data: AirQualityData;
}

export class OpenMeteoAirQualityProvider implements IAirQualityProvider {
  id = 'open_meteo_aqi';
  name = 'Open-Meteo Atmospheric Air Quality';

  private cache = new Map<string, CachedAqi>();
  private activeRequests = new Map<string, Promise<AirQualityData | null>>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(3)},${lon.toFixed(3)}`;
  }

  async getAirQuality(lat: number, lon: number, signal?: AbortSignal): Promise<AirQualityData | null> {
    const key = this.getCacheKey(lat, lon);
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return { ...cached.data, freshness: 'cached' as DataFreshness };
    }

    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=us_aqi,european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide&timezone=auto&forecast_days=2`;
        const response = await fetch(url, { signal });
        if (!response.ok) {
          throw new Error(`Air Quality API error (HTTP ${response.status})`);
        }

        const data = await response.json();
        const curr = data.current;
        if (!curr) return null;

        const rawUsAqi = curr.us_aqi !== undefined && curr.us_aqi !== null ? Math.round(curr.us_aqi) : null;
        const rawEuAqi = curr.european_aqi !== undefined && curr.european_aqi !== null ? Math.round(curr.european_aqi) : null;

        // Default primary display to US AQI, fallback to European if US is missing
        const aqiValue = rawUsAqi !== null ? rawUsAqi : rawEuAqi !== null ? rawEuAqi : null;
        if (aqiValue === null) return null;

        let level: AirQualityData['level'] = 'good';
        let levelText = 'Good';
        let recommendation = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

        if (aqiValue > 300) {
          level = 'hazardous';
          levelText = 'Hazardous';
          recommendation = 'Health warning of emergency conditions. The entire population is more likely to be affected. Consider avoiding outdoor activities.';
        } else if (aqiValue > 200) {
          level = 'very-unhealthy';
          levelText = 'Very Unhealthy';
          recommendation = 'Health alert: increased risk of respiratory aggravation for everyone. Sensitive groups should avoid prolonged outdoor exposure.';
        } else if (aqiValue > 150) {
          level = 'unhealthy';
          levelText = 'Unhealthy';
          recommendation = 'Some members of the general public may experience health effects. Sensitive individuals may experience more serious health effects.';
        } else if (aqiValue > 100) {
          level = 'unhealthy-sensitive';
          levelText = 'Unhealthy for Sensitive Groups';
          recommendation = 'Members of sensitive groups (e.g. asthma or respiratory conditions) may experience health effects. General public is less likely affected.';
        } else if (aqiValue > 50) {
          level = 'moderate';
          levelText = 'Moderate';
          recommendation = 'Air quality is acceptable; however, for some pollutants there may be moderate health concern for a very small number of unusually sensitive people.';
        }

        // Process hourly trend data (next 24 hours)
        const hourlyTrends: HourlyAqiItem[] = [];
        if (data.hourly && Array.isArray(data.hourly.time)) {
          const times: string[] = data.hourly.time;
          const hourlyAqi: (number | null)[] = data.hourly.us_aqi || [];
          const hourlyPm25: (number | null)[] = data.hourly.pm2_5 || [];
          const hourlyPm10: (number | null)[] = data.hourly.pm10 || [];
          const hourlyO3: (number | null)[] = data.hourly.ozone || [];

          // Find current hour index or start from index 0
          const currentHourIso = new Date().toISOString().substring(0, 13);
          let startIndex = times.findIndex((t) => t.startsWith(currentHourIso));
          if (startIndex < 0) startIndex = 0;

          // Take 24 hours from current index
          const sliceTimes = times.slice(startIndex, startIndex + 24);
          sliceTimes.forEach((isoTime, i) => {
            const actualIdx = startIndex + i;
            const dateObj = new Date(isoTime);
            const hourLabel = dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });

            hourlyTrends.push({
              time: isoTime,
              hour: i === 0 ? 'Now' : hourLabel,
              aqi: hourlyAqi[actualIdx] !== undefined && hourlyAqi[actualIdx] !== null ? Math.round(hourlyAqi[actualIdx]!) : null,
              pm2_5: hourlyPm25[actualIdx] !== undefined && hourlyPm25[actualIdx] !== null ? Math.round(hourlyPm25[actualIdx]! * 10) / 10 : null,
              pm10: hourlyPm10[actualIdx] !== undefined && hourlyPm10[actualIdx] !== null ? Math.round(hourlyPm10[actualIdx]! * 10) / 10 : null,
              o3: hourlyO3[actualIdx] !== undefined && hourlyO3[actualIdx] !== null ? Math.round(hourlyO3[actualIdx]! * 10) / 10 : null,
              isNow: i === 0
            });
          });
        }

        const nowIso = new Date().toISOString();

        const result: AirQualityData = {
          aqi: aqiValue,
          us_aqi: rawUsAqi,
          european_aqi: rawEuAqi,
          aqiScale: 'US AQI',
          level,
          levelText,
          pm2_5: curr.pm2_5 !== undefined && curr.pm2_5 !== null ? Math.round(curr.pm2_5 * 10) / 10 : null,
          pm10: curr.pm10 !== undefined && curr.pm10 !== null ? Math.round(curr.pm10 * 10) / 10 : null,
          o3: curr.ozone !== undefined && curr.ozone !== null ? Math.round(curr.ozone * 10) / 10 : null,
          no2: curr.nitrogen_dioxide !== undefined && curr.nitrogen_dioxide !== null ? Math.round(curr.nitrogen_dioxide * 10) / 10 : null,
          co: curr.carbon_monoxide !== undefined && curr.carbon_monoxide !== null ? Math.round(curr.carbon_monoxide * 10) / 10 : null,
          so2: curr.sulphur_dioxide !== undefined && curr.sulphur_dioxide !== null ? Math.round(curr.sulphur_dioxide * 10) / 10 : null,
          recommendation,
          hourlyTrends,
          freshness: 'fresh',
          updatedAt: nowIso
        };

        this.cache.set(key, { timestamp: Date.now(), data: result });
        return result;
      } catch (e) {
        console.warn('[OpenMeteoAirQualityProvider] Error fetching air quality:', e);
        // If we have cached data, return it with cached tag
        const cachedFallback = this.cache.get(key);
        if (cachedFallback) {
          return { ...cachedFallback.data, freshness: 'stale' as DataFreshness };
        }
        return null;
      } finally {
        this.activeRequests.delete(key);
      }
    })();

    this.activeRequests.set(key, fetchPromise);
    return fetchPromise;
  }
}
