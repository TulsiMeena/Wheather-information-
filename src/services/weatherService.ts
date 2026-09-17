import { weatherProvider } from '../providers/WeatherProvider';
import { airQualityProvider } from '../providers/AirQualityProvider';
import { alertCoordinator } from '../providers/alerts';
import { defaultMapProvider, IMapProvider } from '../providers/map/MapProvider';
import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationItem,
  WeatherAlert
} from '../types/weather';

export class WeatherService {
  static async getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
    return weatherProvider.getCurrentWeather(lat, lon);
  }

  static async getHourlyForecast(lat: number, lon: number): Promise<HourlyForecastItem[]> {
    return weatherProvider.getHourlyForecast(lat, lon);
  }

  static async getDailyForecast(lat: number, lon: number): Promise<DailyForecastItem[]> {
    return weatherProvider.getDailyForecast(lat, lon);
  }

  static async getAirQuality(lat: number, lon: number): Promise<AirQualityData | null> {
    return airQualityProvider.getAirQuality(lat, lon);
  }

  static async getWeatherAlerts(
    location: LocationItem,
    weather: CurrentWeather | null,
    daily: DailyForecastItem[],
    hourly: HourlyForecastItem[],
    airQuality: AirQualityData | null
  ): Promise<WeatherAlert[]> {
    return alertCoordinator.getAlerts(location, weather, daily, hourly, airQuality);
  }

  static getMapProvider(): IMapProvider {
    return defaultMapProvider;
  }
}
