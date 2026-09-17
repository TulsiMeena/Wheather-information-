import {
  WeatherAlert,
  LocationItem,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  AirQualityData
} from '../../types/weather';
import { IAlertProvider } from './AlertProvider';

export class WeatherAlertProvider implements IAlertProvider {
  id = 'open_meteo_condition_alerts';
  name = 'Weather Condition Intelligence Engine';
  isOfficial = false;
  isEnabled = true;

  async getAlerts(
    location: LocationItem,
    weather: CurrentWeather | null,
    daily: DailyForecastItem[],
    hourly: HourlyForecastItem[],
    airQuality: AirQualityData | null
  ): Promise<WeatherAlert[]> {
    if (!weather) return [];

    const alerts: WeatherAlert[] = [];
    const nowIso = new Date().toISOString();
    const locationName = `${location.name}${location.state ? `, ${location.state}` : ''}`;

    const todayDaily = daily[0];
    const todayMaxTemp = todayDaily?.highTemp ?? weather.temperature;
    const todayMinTemp = todayDaily?.lowTemp ?? weather.temperature;
    const precipSum = todayDaily?.precipitationSum ?? weather.precipitation ?? 0;
    const precipProb = todayDaily?.precipitationProbability ?? weather.precipitationProbability ?? 0;
    const windGusts = weather.windGusts ?? todayDaily?.windGustsMax ?? weather.windSpeed ?? 0;
    const windSpeed = weather.windSpeed ?? 0;
    const uvIndex = weather.uvIndex ?? todayDaily?.uvIndexMax ?? 0;
    const weatherCode = weather.weatherCode;

    // 1. Extreme Heat or Cold (Configurable realistic meteorological thresholds)
    if (todayMaxTemp !== null && todayMaxTemp >= 38) {
      const isSevere = todayMaxTemp >= 42;
      alerts.push({
        id: `alert-heat-${location.id}-${new Date().toDateString()}`,
        category: 'Extreme heat',
        title: isSevere ? `Severe Heatwave Advisory (${Math.round(todayMaxTemp)}°C)` : `High Thermal Index Advisory (${Math.round(todayMaxTemp)}°C)`,
        severity: isSevere ? 'severe' : 'warning',
        priority: isSevere ? 'SEVERE' : 'IMPORTANT',
        alertType: 'condition',
        source: 'Open-Meteo Synoptic Conditions',
        description: `Unusually high ambient thermal readings forecasted for ${locationName}. Apparent temperature feels like ${weather.feelsLike ? Math.round(weather.feelsLike) : Math.round(todayMaxTemp)}°C.`,
        reason: `Maximum day dry-bulb temperature reaches ${Math.round(todayMaxTemp)}°C with high solar insolation.`,
        affectedLocation: locationName,
        startTime: todayDaily?.sunrise || '09:00 AM',
        endTime: todayDaily?.sunset || '07:00 PM',
        instructions: 'Stay hydrated, seek shaded or air-conditioned environments, and reduce strenuous outdoor activities during peak daylight hours.',
        lastUpdated: nowIso
      });
    } else if (todayMinTemp !== null && todayMinTemp <= 2) {
      const isFreezing = todayMinTemp <= 0;
      alerts.push({
        id: `alert-cold-${location.id}-${new Date().toDateString()}`,
        category: 'Severe weather',
        title: isFreezing ? `Freezing Temperatures Notice (${Math.round(todayMinTemp)}°C)` : `Low Temperature Frost Watch (${Math.round(todayMinTemp)}°C)`,
        severity: isFreezing ? 'severe' : 'warning',
        priority: isFreezing ? 'IMPORTANT' : 'WATCH',
        alertType: 'condition',
        source: 'Open-Meteo Synoptic Conditions',
        description: `Near-freezing or sub-zero nocturnal thermal readings detected for ${locationName}.`,
        reason: `Overnight minimum temperature falls to ${Math.round(todayMinTemp)}°C.`,
        affectedLocation: locationName,
        startTime: 'Overnight',
        endTime: 'Early Morning',
        instructions: 'Protect vulnerable vegetation, insulate exposed piping, and dress in thermal layers when venturing outdoors.',
        lastUpdated: nowIso
      });
    }

    // 2. Strong Wind / Gale Conditions
    if (windGusts >= 45 || windSpeed >= 35) {
      const isSevereWind = windGusts >= 65 || windSpeed >= 50;
      alerts.push({
        id: `alert-wind-${location.id}-${new Date().toDateString()}`,
        category: 'Strong wind',
        title: isSevereWind ? `Gale-Force Wind Warning (Gusts ${Math.round(windGusts)} km/h)` : `Strong Wind Conditions (${Math.round(windSpeed)} km/h)`,
        severity: isSevereWind ? 'severe' : 'warning',
        priority: isSevereWind ? 'SEVERE' : 'IMPORTANT',
        alertType: 'condition',
        source: 'Open-Meteo Synoptic Conditions',
        description: `Elevated boundary-layer wind velocities and gust vectors observed across ${locationName}.`,
        reason: `Wind gusts may reach ${Math.round(windGusts)} km/h (sustained speed: ${Math.round(windSpeed)} km/h).`,
        affectedLocation: locationName,
        startTime: 'Current Outlook',
        endTime: 'Next 12 Hours',
        instructions: 'Secure lightweight patio furniture and outdoor equipment. Exercise caution when operating high-sided vehicles.',
        lastUpdated: nowIso
      });
    }

    // 3. Thunderstorm / Electrical Activity
    const hasConvectiveStorm =
      weatherCode === 95 ||
      weatherCode === 96 ||
      weatherCode === 99 ||
      hourly.slice(0, 6).some((h) => h.weatherCode === 95 || h.weatherCode === 96 || h.weatherCode === 99);

    if (hasConvectiveStorm) {
      const hasHail = weatherCode === 96 || weatherCode === 99;
      alerts.push({
        id: `alert-storm-${location.id}-${new Date().toDateString()}`,
        category: 'Thunderstorm',
        title: hasHail ? 'Thunderstorm with Hail Warning' : 'Active Thunderstorm Alert',
        severity: hasHail ? 'severe' : 'warning',
        priority: hasHail ? 'SEVERE' : 'IMPORTANT',
        alertType: 'condition',
        source: 'Open-Meteo Synoptic Conditions',
        description: `Atmospheric convective instability with electrical discharge and squalls active in ${locationName}.`,
        reason: hasHail ? 'WMO convective storm with hail reported or modeled within next 6 hours.' : 'Thunderstorm activity detected in local meteorological trajectory.',
        affectedLocation: locationName,
        startTime: 'Active Now',
        endTime: 'Next 6 Hours',
        instructions: 'Seek indoor shelter immediately. Disconnect sensitive electrical devices and stay away from open water and tall trees.',
        lastUpdated: nowIso
      });
    }

    // 4. Heavy Precipitation / Torrential Rain
    if (precipSum >= 20 || (precipProb >= 70 && (weather.precipitation ?? 0) >= 8)) {
      const isTorrential = precipSum >= 45;
      alerts.push({
        id: `alert-rain-${location.id}-${new Date().toDateString()}`,
        category: 'Heavy rain',
        title: isTorrential ? `Torrential Rain & Runoff Watch (${Math.round(precipSum)} mm)` : `Heavy Precipitation Advisory (${Math.round(precipSum)} mm)`,
        severity: isTorrential ? 'severe' : 'warning',
        priority: isTorrential ? 'SEVERE' : 'IMPORTANT',
        alertType: 'condition',
        source: 'Open-Meteo Synoptic Conditions',
        description: `Significant precipitation accumulation forecasted for ${locationName}. Localized surface drainage ponding may occur.`,
        reason: `Precipitation probability at ${precipProb}% with cumulative accumulation around ${Math.round(precipSum)} mm.`,
        affectedLocation: locationName,
        startTime: 'Today',
        endTime: 'Next 24 Hours',
        instructions: 'Allow extra travel time for commuting. Avoid traversing flooded underpasses or waterlogged roadway dips.',
        lastUpdated: nowIso
      });
    }

    // 5. High / Extreme UV Index
    if (uvIndex >= 8) {
      const isExtreme = uvIndex >= 11;
      alerts.push({
        id: `alert-uv-${location.id}-${new Date().toDateString()}`,
        category: 'High UV index',
        title: isExtreme ? `Extreme Solar UV Warning (Index ${Math.round(uvIndex)})` : `Very High UV Radiation Alert (Index ${Math.round(uvIndex)})`,
        severity: isExtreme ? 'severe' : 'warning',
        priority: isExtreme ? 'IMPORTANT' : 'WATCH',
        alertType: 'condition',
        source: 'Open-Meteo Synoptic Conditions',
        description: `Erythemal ultraviolet radiation levels are significantly elevated in ${locationName}.`,
        reason: `Maximum daylight solar UV Index reaches ${Math.round(uvIndex)} during midday hours.`,
        affectedLocation: locationName,
        startTime: '10:30 AM',
        endTime: '04:00 PM',
        instructions: 'Wear broad-spectrum SPF 30+ sunscreen, UV-blocking sunglasses, and wide-brim protective headwear.',
        lastUpdated: nowIso
      });
    }

    // 6. Air Quality Alert
    if (airQuality && airQuality.aqi !== null && airQuality.aqi >= 150) {
      const isSevereAqi = airQuality.aqi >= 200;
      alerts.push({
        id: `alert-aqi-${location.id}-${new Date().toDateString()}`,
        category: 'Poor air quality',
        title: isSevereAqi ? `Poor Air Quality Alert (${airQuality.aqi} AQI)` : `Elevated Particulate Advisory (${airQuality.aqi} AQI)`,
        severity: isSevereAqi ? 'severe' : 'warning',
        priority: isSevereAqi ? 'IMPORTANT' : 'WATCH',
        alertType: 'condition',
        source: 'Open-Meteo Atmospheric Air Quality',
        description: `Elevated airborne particulate concentrations recorded for ${locationName} (${airQuality.levelText}).`,
        reason: `Air Quality Index is ${airQuality.aqi} with PM2.5 at ${airQuality.pm2_5 ?? '--'} µg/m³.`,
        affectedLocation: locationName,
        startTime: 'Current Observation',
        endTime: 'Ongoing',
        instructions: airQuality.recommendation || 'Consider limiting prolonged outdoor physical exertion.',
        lastUpdated: nowIso
      });
    }

    return alerts;
  }
}
