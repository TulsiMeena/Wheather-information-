import { AirQualityData } from '../types/weather';
import { IAirQualityProvider } from './AirQualityProvider';

export class OpenMeteoAirQualityProvider implements IAirQualityProvider {
  id = 'open_meteo_aqi';
  name = 'Open-Meteo Atmospheric Air Quality';

  async getAirQuality(lat: number, lon: number): Promise<AirQualityData | null> {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const curr = data.current;
      if (!curr) return null;

      const aqiValue = curr.us_aqi !== null && curr.us_aqi !== undefined
        ? Math.round(curr.us_aqi)
        : curr.european_aqi !== null && curr.european_aqi !== undefined
        ? Math.round(curr.european_aqi * 20) // European AQI 0-5 mapping approximation to US 0-100+
        : null;

      if (aqiValue === null) return null;

      let level: AirQualityData['level'] = 'good';
      let levelText = 'Good';
      let recommendation = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

      if (aqiValue > 300) {
        level = 'hazardous';
        levelText = 'Hazardous';
        recommendation = 'Health warning of emergency conditions: everyone is more likely to be affected. Avoid all outdoor physical activity.';
      } else if (aqiValue > 200) {
        level = 'very-unhealthy';
        levelText = 'Very Unhealthy';
        recommendation = 'Health alert: risk of health effects is increased for everyone. Sensitive groups should remain indoors.';
      } else if (aqiValue > 150) {
        level = 'unhealthy';
        levelText = 'Unhealthy';
        recommendation = 'Some members of the general public may experience health effects. Limit outdoor exertion.';
      } else if (aqiValue > 100) {
        level = 'unhealthy-sensitive';
        levelText = 'Unhealthy for Sensitive Groups';
        recommendation = 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.';
      } else if (aqiValue > 50) {
        level = 'moderate';
        levelText = 'Moderate';
        recommendation = 'Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.';
      }

      return {
        aqi: aqiValue,
        level,
        levelText,
        pm2_5: curr.pm2_5 !== undefined ? Math.round(curr.pm2_5 * 10) / 10 : null,
        pm10: curr.pm10 !== undefined ? Math.round(curr.pm10 * 10) / 10 : null,
        o3: curr.ozone !== undefined ? Math.round(curr.ozone * 10) / 10 : null,
        no2: curr.nitrogen_dioxide !== undefined ? Math.round(curr.nitrogen_dioxide * 10) / 10 : null,
        co: curr.carbon_monoxide !== undefined ? Math.round(curr.carbon_monoxide * 10) / 10 : null,
        so2: curr.sulphur_dioxide !== undefined ? Math.round(curr.sulphur_dioxide * 10) / 10 : null,
        recommendation
      };
    } catch (e) {
      console.warn('[OpenMeteoAirQualityProvider] Failed to fetch air quality:', e);
      return null;
    }
  }
}
