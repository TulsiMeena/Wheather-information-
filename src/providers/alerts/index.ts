import {
  WeatherAlert,
  LocationItem,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  AirQualityData
} from '../../types/weather';
import { IAlertProvider } from './AlertProvider';
import { WeatherAlertProvider } from './WeatherAlertProvider';
import { ImdAlertProvider } from './ImdAlertProvider';
import { ExternalAlertProvider } from './ExternalAlertProvider';

export * from './AlertProvider';
export * from './WeatherAlertProvider';
export * from './ImdAlertProvider';
export * from './ExternalAlertProvider';

export class AlertCoordinator {
  private providers: IAlertProvider[] = [
    new WeatherAlertProvider(),
    new ImdAlertProvider(),
    new ExternalAlertProvider()
  ];

  async getAlerts(
    location: LocationItem,
    weather: CurrentWeather | null,
    daily: DailyForecastItem[],
    hourly: HourlyForecastItem[],
    airQuality: AirQualityData | null
  ): Promise<WeatherAlert[]> {
    const results: WeatherAlert[] = [];
    for (const provider of this.providers) {
      if (provider.isEnabled) {
        try {
          const providerAlerts = await provider.getAlerts(location, weather, daily, hourly, airQuality);
          results.push(...providerAlerts);
        } catch (e) {
          console.warn(`[AlertCoordinator] Provider ${provider.id} error:`, e);
        }
      }
    }
    return results;
  }
}

export const alertCoordinator = new AlertCoordinator();
