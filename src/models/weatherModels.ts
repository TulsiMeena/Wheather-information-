import {
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  AirQualityData,
  WeatherAlert,
  LocationItem,
  DataFreshness
} from '../types/weather';

/**
 * Normalized Model Definitions (Prompt 4 Architecture)
 * Strict separation between raw API payload formats and domain presentation models.
 */

export type Weather = CurrentWeather;
export type HourlyWeather = HourlyForecastItem;
export type DailyWeather = DailyForecastItem;
export type AirQuality = AirQualityData;
export type Location = LocationItem;
export type { DataFreshness };

export interface Pollutant {
  code: string;
  name: string;
  chemicalFormula: string;
  value: number | null;
  unit: string;
  category: 'Good' | 'Moderate' | 'Unhealthy (Sensitive)' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unavailable';
  severityLevel: number; // 0 (Good) to 5 (Hazardous)
  description: string;
}

export type { WeatherAlert };
