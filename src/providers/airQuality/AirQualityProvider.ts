import { AirQualityData } from '../../types/weather';

export interface IAirQualityProvider {
  id: string;
  name: string;
  getAirQuality(lat: number, lon: number, signal?: AbortSignal): Promise<AirQualityData | null>;
}
