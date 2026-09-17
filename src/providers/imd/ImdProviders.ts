import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  WeatherAlert,
  LocationItem,
  AirQualityData
} from '../../types/weather';

/**
 * IMD Weather Provider Interface
 */
export interface IImdWeatherProvider {
  id: string;
  name: string;
  isOfficial: boolean;
  isEnabled: boolean;
  status: 'DISABLED_PENDING_CREDENTIALS' | 'CONNECTED' | 'ERROR';
  getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null>;
  getDistrictForecast(districtCode: string): Promise<{ daily: DailyForecastItem[]; advisory: string } | null>;
}

/**
 * IMD Alert Provider Interface
 */
export interface IImdAlertProvider {
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
  getWeatherWarnings(districtCode?: string): Promise<WeatherAlert[]>;
}

/**
 * IMD Nowcast Provider Interface (0-3 hour high-resolution radar & lightning nowcasts)
 */
export interface IImdNowcastProvider {
  id: string;
  name: string;
  isOfficial: boolean;
  isEnabled: boolean;
  status: 'DISABLED_PENDING_CREDENTIALS' | 'CONNECTED' | 'ERROR';
  getNowcast(lat: number, lon: number): Promise<{
    stationName?: string;
    warningLevel?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    validUntil?: string;
    message?: string;
  } | null>;
}

/**
 * IMD Doppler Weather Radar Provider Interface
 */
export interface IImdRadarProvider {
  id: string;
  name: string;
  isOfficial: boolean;
  isEnabled: boolean;
  status: 'DISABLED_PENDING_CREDENTIALS' | 'CONNECTED' | 'ERROR';
  getRadarStations(): { id: string; name: string; lat: number; lon: number; radiusKm: number }[];
  getTileUrl(stationId: string): string | null;
}

/**
 * Concrete implementations of IMD providers.
 * STRICT POLICY:
 * All remain disabled until official Government of India / IMD Mausam API tokens
 * and security certificates are provisioned.
 * NEVER calls imaginary or simulated endpoints.
 */
export class ImdWeatherProvider implements IImdWeatherProvider {
  id = 'imd_weather_official';
  name = 'India Meteorological Department (Mausam)';
  isOfficial = true;
  isEnabled = false;
  status = 'DISABLED_PENDING_CREDENTIALS' as const;

  async getCurrentWeather(_lat: number, _lon: number): Promise<CurrentWeather | null> {
    // Awaiting official IMD Mausam API authorization keys
    return null;
  }

  async getDistrictForecast(_districtCode: string) {
    return null;
  }
}

export class ImdNowcastProvider implements IImdNowcastProvider {
  id = 'imd_nowcast_official';
  name = 'IMD Doppler Atmospheric Nowcast';
  isOfficial = true;
  isEnabled = false;
  status = 'DISABLED_PENDING_CREDENTIALS' as const;

  async getNowcast(_lat: number, _lon: number) {
    return null;
  }
}

export class ImdRadarProvider implements IImdRadarProvider {
  id = 'imd_radar_official';
  name = 'IMD National Doppler Radar Network';
  isOfficial = true;
  isEnabled = false;
  status = 'DISABLED_PENDING_CREDENTIALS' as const;

  getRadarStations() {
    return [
      { id: 'DELHI', name: 'New Delhi (Palam)', lat: 28.56, lon: 77.10, radiusKm: 250 },
      { id: 'JAIPUR', name: 'Jaipur (Sanganer)', lat: 26.82, lon: 75.80, radiusKm: 250 },
      { id: 'MUMBAI', name: 'Mumbai (Colaba)', lat: 18.90, lon: 72.81, radiusKm: 250 },
      { id: 'KOLKATA', name: 'Kolkata (Alipore)', lat: 22.53, lon: 88.33, radiusKm: 250 },
      { id: 'CHENNAI', name: 'Chennai (Meenambakkam)', lat: 12.98, lon: 80.17, radiusKm: 250 }
    ];
  }

  getTileUrl(_stationId: string): string | null {
    // Live Doppler tiles require verified governmental gateway connection
    return null;
  }
}

export const imdWeatherProvider = new ImdWeatherProvider();
export const imdNowcastProvider = new ImdNowcastProvider();
export const imdRadarProvider = new ImdRadarProvider();
