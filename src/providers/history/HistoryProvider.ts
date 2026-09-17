import { HistoricalWeatherResult } from '../../types/weather';

/**
 * Historical Weather Provider Interface
 */
export interface IHistoryProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  getHistoricalWeather(
    lat: number,
    lon: number,
    startDate: string, // YYYY-MM-DD
    endDate: string,   // YYYY-MM-DD
    timezone?: string,
    signal?: AbortSignal
  ): Promise<HistoricalWeatherResult>;
}
