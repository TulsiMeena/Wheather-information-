import { IAirQualityProvider } from './airQuality/AirQualityProvider';
import { OpenMeteoAirQualityProvider } from './airQuality/OpenMeteoAirQualityProvider';

export * from './airQuality/AirQualityProvider';
export * from './airQuality/OpenMeteoAirQualityProvider';

export const airQualityProvider: IAirQualityProvider = new OpenMeteoAirQualityProvider();
