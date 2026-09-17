import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  WeatherAlert
} from '../../types/weather';

export interface IWeatherProvider {
  id: string;
  name: string;
  isReady: boolean;
  getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null>;
  getHourlyForecast(lat: number, lon: number): Promise<HourlyForecastItem[]>;
  getDailyForecast(lat: number, lon: number): Promise<DailyForecastItem[]>;
  getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]>;
}
