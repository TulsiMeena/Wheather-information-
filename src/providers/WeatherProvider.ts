import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  WeatherAlert
} from '../types/weather';

/**
 * WeatherProvider Interface
 * Designed for Open-Meteo live API integration in Prompt 2.
 */
export interface IWeatherProvider {
  id: string;
  name: string;
  isReady: boolean;
  getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null>;
  getHourlyForecast(lat: number, lon: number): Promise<HourlyForecastItem[]>;
  getDailyForecast(lat: number, lon: number): Promise<DailyForecastItem[]>;
  getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]>;
}

/**
 * Foundation Weather Provider (Prompt 1)
 * Returns clean unpopulated/null states to avoid fake live data,
 * ready to be swapped with OpenMeteoWeatherProvider in Prompt 2.
 */
export class FoundationWeatherProvider implements IWeatherProvider {
  id = 'foundation_placeholder';
  name = 'Weather Intelligence Foundation';
  isReady = false; // Will become true once Open-Meteo is hooked up in Prompt 2

  async getCurrentWeather(_lat: number, _lon: number): Promise<CurrentWeather | null> {
    // Intentionally null: No fake live numbers. Ready for Prompt 2 Open-Meteo integration.
    return null;
  }

  async getHourlyForecast(_lat: number, _lon: number): Promise<HourlyForecastItem[]> {
    // Returns empty list to show elegant skeleton/ready state
    return [];
  }

  async getDailyForecast(_lat: number, _lon: number): Promise<DailyForecastItem[]> {
    return [];
  }

  async getWeatherAlerts(_lat: number, _lon: number): Promise<WeatherAlert[]> {
    // When there is no real data: "No active weather alerts"
    return [];
  }
}

import { OpenMeteoWeatherProvider } from './OpenMeteoWeatherProvider';

export const weatherProvider: IWeatherProvider = new OpenMeteoWeatherProvider();
