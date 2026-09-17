import {
  WeatherAlert,
  LocationItem,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  AirQualityData
} from '../../types/weather';
import { IImdAlertProvider } from './AlertProvider';

/**
 * India Meteorological Department (IMD) Official Alert Provider
 *
 * Prepared for future IMD API integration (Mausam / Meghdoot / National Disaster Management Authority).
 * As mandated by architectural requirements, this provider remains strictly disabled until official
 * API endpoints, authentication tokens, and district bounding models are provisioned.
 * It will NOT call unverified or nonexistent endpoints.
 */
export class ImdAlertProvider implements IImdAlertProvider {
  id = 'imd_official_alerts';
  name = 'India Meteorological Department (Official)';
  isOfficial = true;
  isEnabled = false; // Disabled until official credentials/API access are configured

  async getAlerts(
    _location: LocationItem,
    _weather: CurrentWeather | null,
    _daily: DailyForecastItem[],
    _hourly: HourlyForecastItem[],
    _airQuality: AirQualityData | null
  ): Promise<WeatherAlert[]> {
    if (!this.isEnabled) {
      return [];
    }
    return [];
  }

  async getWeatherWarnings(_districtCode?: string): Promise<WeatherAlert[]> {
    if (!this.isEnabled) return [];
    return [];
  }

  async getDistrictAlerts(_stateCode?: string): Promise<WeatherAlert[]> {
    if (!this.isEnabled) return [];
    return [];
  }

  async getNowcastAlerts(_lat: number, _lon: number): Promise<WeatherAlert[]> {
    if (!this.isEnabled) return [];
    return [];
  }
}
