import {
  WeatherAlert,
  LocationItem,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  AirQualityData
} from '../../types/weather';

export interface IAlertProvider {
  id: string;
  name: string;
  isOfficial: boolean;
  isEnabled: boolean;
  getAlerts(
    location: LocationItem,
    weather: CurrentWeather | null,
    daily: DailyForecastItem[],
    hourly: HourlyForecastItem[],
    airQuality: AirQualityData | null
  ): Promise<WeatherAlert[]>;
}

export interface IImdAlertProvider extends IAlertProvider {
  getWeatherWarnings(districtCode?: string): Promise<WeatherAlert[]>;
  getDistrictAlerts(stateCode?: string): Promise<WeatherAlert[]>;
  getNowcastAlerts(lat: number, lon: number): Promise<WeatherAlert[]>;
}
