import {
  WeatherAlert,
  LocationItem,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  AirQualityData
} from '../../types/weather';
import { IAlertProvider } from './AlertProvider';

/**
 * External Alert Provider (Future expansion for NOAA, WMO, or MeteoAlarm CAP feeds)
 */
export class ExternalAlertProvider implements IAlertProvider {
  id = 'external_emergency_alerts';
  name = 'External Meteorological Warning Feed';
  isOfficial = true;
  isEnabled = false;

  async getAlerts(
    _location: LocationItem,
    _weather: CurrentWeather | null,
    _daily: DailyForecastItem[],
    _hourly: HourlyForecastItem[],
    _airQuality: AirQualityData | null
  ): Promise<WeatherAlert[]> {
    return [];
  }
}
