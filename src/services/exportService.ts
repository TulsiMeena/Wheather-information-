import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationItem,
  HistoricalWeatherResult,
  TemperatureUnit,
  WindSpeedUnit
} from '../types/weather';
import { formatTemperature, formatWindSpeed } from '../utils/formatters';

export class ExportService {
  /**
   * Generates sanitized, normalized CSV from currently loaded hourly or historical data
   */
  static exportToCsv(options: {
    location: LocationItem;
    hourlyForecast?: HourlyForecastItem[];
    dailyForecast?: DailyForecastItem[];
    historical?: HistoricalWeatherResult;
  }): void {
    const rows: string[] = [];

    if (options.historical && options.historical.daily.length > 0) {
      // Historical Daily CSV
      const headers = [
        'date',
        'max_temperature_c',
        'min_temperature_c',
        'mean_temperature_c',
        'precipitation_sum_mm',
        'rain_sum_mm',
        'max_wind_speed_kmh',
        'wind_gusts_max_kmh',
        'mean_humidity_pct',
        'mean_cloud_cover_pct',
        'condition'
      ];
      rows.push(headers.join(','));

      for (const d of options.historical.daily) {
        const row = [
          d.date,
          d.temperatureMax !== null ? d.temperatureMax : '',
          d.temperatureMin !== null ? d.temperatureMin : '',
          d.temperatureMean !== null ? d.temperatureMean : '',
          d.precipitationSum !== null ? d.precipitationSum : '',
          d.rainSum !== null ? d.rainSum : '',
          d.windSpeedMax !== null ? d.windSpeedMax : '',
          d.windGustsMax !== null && d.windGustsMax !== undefined ? d.windGustsMax : '',
          d.humidityMean !== null && d.humidityMean !== undefined ? d.humidityMean : '',
          d.cloudCoverMean !== null && d.cloudCoverMean !== undefined ? d.cloudCoverMean : '',
          `"${(d.conditionText || '').replace(/"/g, '""')}"`
        ];
        rows.push(row.join(','));
      }
    } else if (options.hourlyForecast && options.hourlyForecast.length > 0) {
      // Forecast Hourly CSV
      const headers = [
        'time',
        'temperature_c',
        'feels_like_c',
        'humidity_pct',
        'precipitation_mm',
        'rain_probability_pct',
        'wind_speed_kmh',
        'wind_direction_deg',
        'wind_gust_kmh',
        'cloud_cover_pct',
        'uv_index',
        'weather_condition'
      ];
      rows.push(headers.join(','));

      for (const h of options.hourlyForecast) {
        const row = [
          h.fullTime || h.time,
          h.temperature !== null ? h.temperature : '',
          h.apparentTemperature !== null && h.apparentTemperature !== undefined ? h.apparentTemperature : '',
          h.humidity !== null && h.humidity !== undefined ? h.humidity : '',
          h.precipitation !== null && h.precipitation !== undefined ? h.precipitation : '',
          h.precipitationProbability !== null ? h.precipitationProbability : '',
          h.windSpeed !== null ? h.windSpeed : '',
          h.windDirection !== null && h.windDirection !== undefined ? h.windDirection : '',
          h.windGusts !== null && h.windGusts !== undefined ? h.windGusts : '',
          h.cloudCover !== null && h.cloudCover !== undefined ? h.cloudCover : '',
          h.uvIndex !== null && h.uvIndex !== undefined ? h.uvIndex : '',
          `"${(h.conditionText || '').replace(/"/g, '""')}"`
        ];
        rows.push(row.join(','));
      }
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `weather_${options.location.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Generates structured JSON from loaded state without exposing private tokens
   */
  static exportToJson(options: {
    location: LocationItem;
    currentWeather: CurrentWeather | null;
    airQuality: AirQualityData | null;
    hourlyForecast?: HourlyForecastItem[];
    dailyForecast?: DailyForecastItem[];
    historical?: HistoricalWeatherResult;
  }): void {
    const payload = {
      location: {
        name: options.location.name,
        city: options.location.city,
        region: options.location.region || options.location.state,
        country: options.location.country,
        latitude: options.location.latitude,
        longitude: options.location.longitude,
        timezone: options.location.timezone
      },
      source: 'Open-Meteo Synoptic & Atmospheric Quality Feed',
      generatedAt: new Date().toISOString(),
      currentWeather: options.currentWeather,
      airQuality: options.airQuality,
      hourlyForecast: options.hourlyForecast?.slice(0, 48),
      dailyForecast: options.dailyForecast,
      historical: options.historical
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const filename = `weather_${options.location.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Generates clean plain-text summary of current atmospheric conditions
   */
  static generateTextSummary(
    location: LocationItem,
    weather: CurrentWeather | null,
    airQuality: AirQualityData | null,
    tempUnit: TemperatureUnit,
    windUnit: WindSpeedUnit
  ): string {
    if (!weather) return `${location.name}: Atmospheric data currently unavailable.`;

    const lines: string[] = [];
    lines.push(`📍 ${location.name}${location.country ? `, ${location.country}` : ''}`);

    const tempStr = weather.temperature !== null ? formatTemperature(weather.temperature, tempUnit) : '';
    const feelsStr = weather.feelsLike !== null ? `(Feels like ${formatTemperature(weather.feelsLike, tempUnit)})` : '';
    lines.push(`🌡️ ${tempStr} ${feelsStr} • ${weather.conditionText || 'Fair'}`);

    if (weather.precipitationProbability !== null && weather.precipitationProbability > 0) {
      lines.push(`🌧️ Rain Probability: ${weather.precipitationProbability}%`);
    }

    if (weather.windSpeed !== null) {
      lines.push(`💨 Wind: ${formatWindSpeed(weather.windSpeed, windUnit)}`);
    }

    if (weather.humidity !== null) {
      lines.push(`💧 Humidity: ${weather.humidity}%`);
    }

    if (weather.uvIndex !== null) {
      lines.push(`☀️ UV Index: ${weather.uvIndex}`);
    }

    if (airQuality?.aqi !== null && airQuality?.aqi !== undefined) {
      lines.push(`🍃 Air Quality: AQI ${airQuality.aqi} (${airQuality.levelText})`);
    }

    if (weather.updatedAt) {
      lines.push(`🕒 Updated: ${new Date(weather.updatedAt).toLocaleTimeString()}`);
    }

    lines.push('📡 Source: Open-Meteo');

    return lines.join('\n');
  }

  /**
   * Shares via Web Share API or falls back to clipboard
   */
  static async shareWeather(
    location: LocationItem,
    weather: CurrentWeather | null,
    airQuality: AirQualityData | null,
    tempUnit: TemperatureUnit,
    windUnit: WindSpeedUnit
  ): Promise<'shared' | 'copied' | 'failed'> {
    const summary = this.generateTextSummary(location, weather, airQuality, tempUnit, windUnit);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Weather in ${location.name}`,
          text: summary
        });
        return 'shared';
      } catch (err: any) {
        // User aborted share dialog or permission denied -> fallback to copy
        if (err.name === 'AbortError') return 'failed';
      }
    }

    // Fallback: Copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(summary);
        return 'copied';
      } catch {
        // clipboard error
      }
    }

    return 'failed';
  }
}
