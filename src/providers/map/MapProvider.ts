import { MapLayerType, CurrentWeather, AirQualityData } from '../../types/weather';

export interface BaseMapConfig {
  id: string;
  name: string;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  subdomains?: string[];
}

export interface IBaseMapProvider {
  id: string;
  name: string;
  getConfig(): BaseMapConfig;
}

export interface LayerLegendItem {
  label: string;
  color: string;
  valueRange: string;
}

export interface LayerLegend {
  layer: MapLayerType;
  title: string;
  unit: string;
  gradient: string;
  minLabel: string;
  maxLabel: string;
  items: LayerLegendItem[];
}

export interface IWeatherLayerProvider {
  id: string;
  name: string;
  supportedLayers: MapLayerType[];
  getLegend(layer: MapLayerType, tempUnit?: 'C' | 'F', windUnit?: string): LayerLegend;
  getLayerReading(layer: MapLayerType, weather: CurrentWeather | null, airQuality: AirQualityData | null): {
    value: string;
    label: string;
    unit: string;
  };
}

export interface IRadarProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  status: 'DISCONNECTED' | 'CONNECTED' | 'UNSUPPORTED';
  noticeTitle: string;
  noticeMessage: string;
  getRadarTimestamp(): string | null;
}

export interface IMapProvider {
  id: string;
  name: string;
  baseMap: IBaseMapProvider;
  weatherLayers: IWeatherLayerProvider;
  radar: IRadarProvider;
}

/**
 * OpenStreetMap Standard Base Map Provider (API key-free, high quality)
 */
export class OpenStreetMapBaseProvider implements IBaseMapProvider {
  id = 'osm_standard';
  name = 'OpenStreetMap Standard Cartography';

  getConfig(): BaseMapConfig {
    return {
      id: this.id,
      name: this.name,
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 3,
      subdomains: ['a', 'b', 'c']
    };
  }
}

/**
 * Standard Synoptic Meteorological Layer Provider
 */
export class StandardWeatherLayerProvider implements IWeatherLayerProvider {
  id = 'standard_weather_layers';
  name = 'Atmospheric Surface Matrix';
  supportedLayers: MapLayerType[] = [
    'temperature',
    'precipitation',
    'rain',
    'wind',
    'clouds',
    'uv',
    'airquality'
  ];

  getLegend(layer: MapLayerType, tempUnit: 'C' | 'F' = 'C', windUnit: string = 'kmh'): LayerLegend {
    switch (layer) {
      case 'temperature': {
        const isF = tempUnit === 'F';
        const toF = (c: number) => Math.round((c * 9) / 5 + 32);
        return {
          layer,
          title: `Surface Temperature (°${tempUnit})`,
          unit: `°${tempUnit}`,
          gradient: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)',
          minLabel: isF ? `${toF(-10)}°F` : '-10°C',
          maxLabel: isF ? `${toF(45)}°F` : '45°C',
          items: [
            { label: 'Freezing', color: '#3b82f6', valueRange: isF ? `< ${toF(0)}°F` : '< 0°C' },
            { label: 'Cool', color: '#06b6d4', valueRange: isF ? `${toF(0)} - ${toF(15)}°F` : '0 - 15°C' },
            { label: 'Mild', color: '#10b981', valueRange: isF ? `${toF(15)} - ${toF(25)}°F` : '15 - 25°C' },
            { label: 'Warm', color: '#f59e0b', valueRange: isF ? `${toF(25)} - ${toF(35)}°F` : '25 - 35°C' },
            { label: 'Extreme', color: '#ef4444', valueRange: isF ? `> ${toF(35)}°F` : '> 35°C' }
          ]
        };
      }
      case 'precipitation':
      case 'rain':
        return {
          layer,
          title: 'Precipitation Intensity & Rain Accumulation',
          unit: 'mm / %',
          gradient: 'linear-gradient(90deg, #93c5fd, #3b82f6, #1d4ed8, #4338ca)',
          minLabel: '0 mm (Dry)',
          maxLabel: '50+ mm (Torrential)',
          items: [
            { label: 'Trace / Dry', color: '#93c5fd', valueRange: '0 - 1 mm' },
            { label: 'Light Rain', color: '#3b82f6', valueRange: '1 - 5 mm' },
            { label: 'Moderate', color: '#2563eb', valueRange: '5 - 15 mm' },
            { label: 'Heavy', color: '#1d4ed8', valueRange: '15 - 35 mm' },
            { label: 'Torrential', color: '#4338ca', valueRange: '> 35 mm' }
          ]
        };
      case 'wind': {
        const u = windUnit || 'km/h';
        return {
          layer,
          title: `Surface Wind Velocity (${u})`,
          unit: u,
          gradient: 'linear-gradient(90deg, #a7f3d0, #34d399, #059669, #047857, #b91c1c)',
          minLabel: `Calm (< 5 ${u})`,
          maxLabel: `Gale (80+ ${u})`,
          items: [
            { label: 'Light Air', color: '#a7f3d0', valueRange: `0 - 15 ${u}` },
            { label: 'Moderate', color: '#34d399', valueRange: `15 - 30 ${u}` },
            { label: 'Fresh Breeze', color: '#059669', valueRange: `30 - 50 ${u}` },
            { label: 'Strong / Gale', color: '#b91c1c', valueRange: `> 50 ${u}` }
          ]
        };
      }
      case 'clouds':
        return {
          layer,
          title: 'Total Cloud Vault Occlusion',
          unit: '%',
          gradient: 'linear-gradient(90deg, #e2e8f0, #94a3b8, #64748b, #334155)',
          minLabel: '0% (Clear)',
          maxLabel: '100% (Overcast)',
          items: [
            { label: 'Clear', color: '#e2e8f0', valueRange: '0 - 20%' },
            { label: 'Partly Cloudy', color: '#94a3b8', valueRange: '20 - 60%' },
            { label: 'Overcast', color: '#334155', valueRange: '60 - 100%' }
          ]
        };
      case 'uv':
        return {
          layer,
          title: 'Erythemal UV Solar Index',
          unit: 'UVI',
          gradient: 'linear-gradient(90deg, #10b981, #f59e0b, #f97316, #ef4444, #a855f7)',
          minLabel: '0 (Low)',
          maxLabel: '11+ (Extreme)',
          items: [
            { label: 'Low', color: '#10b981', valueRange: '0 - 2' },
            { label: 'Moderate', color: '#f59e0b', valueRange: '3 - 5' },
            { label: 'High', color: '#f97316', valueRange: '6 - 7' },
            { label: 'Very High', color: '#ef4444', valueRange: '8 - 10' },
            { label: 'Extreme', color: '#a855f7', valueRange: '11+' }
          ]
        };
      case 'airquality':
        return {
          layer,
          title: 'Air Quality Index (US EPA AQI)',
          unit: 'AQI',
          gradient: 'linear-gradient(90deg, #10b981, #f59e0b, #f97316, #ef4444, #8b5cf6, #7f1d1d)',
          minLabel: '0 (Good)',
          maxLabel: '300+ (Hazardous)',
          items: [
            { label: 'Good', color: '#10b981', valueRange: '0 - 50' },
            { label: 'Moderate', color: '#f59e0b', valueRange: '51 - 100' },
            { label: 'Sensitive', color: '#f97316', valueRange: '101 - 150' },
            { label: 'Unhealthy', color: '#ef4444', valueRange: '151 - 200' },
            { label: 'Very Unhealthy', color: '#8b5cf6', valueRange: '201 - 300' },
            { label: 'Hazardous', color: '#7f1d1d', valueRange: '301+' }
          ]
        };
    }
  }


  getLayerReading(
    layer: MapLayerType,
    weather: CurrentWeather | null,
    airQuality: AirQualityData | null
  ): { value: string; label: string; unit: string } {
    if (!weather) {
      return { value: '--', label: 'Data Unavailable', unit: '' };
    }

    switch (layer) {
      case 'temperature':
        return {
          value: weather.temperature !== null ? `${Math.round(weather.temperature)}°` : '--',
          label: `Feels like ${weather.feelsLike !== null ? `${Math.round(weather.feelsLike)}°` : '--'}`,
          unit: '°C'
        };
      case 'precipitation':
      case 'rain':
        return {
          value: `${weather.precipitationProbability ?? 0}%`,
          label: `${weather.precipitation ?? 0} mm/h precipitation`,
          unit: '%'
        };
      case 'wind':
        return {
          value: `${Math.round(weather.windSpeed ?? 0)}`,
          label: `Gusts up to ${Math.round(weather.windGusts ?? weather.windSpeed ?? 0)} km/h`,
          unit: 'km/h'
        };
      case 'clouds':
        return {
          value: `${weather.cloudCover ?? 0}%`,
          label: weather.cloudCover && weather.cloudCover > 80 ? 'Heavy Overcast' : 'Scattered Clouds',
          unit: '%'
        };
      case 'uv':
        return {
          value: `${weather.uvIndex ?? 0}`,
          label: weather.uvIndex && weather.uvIndex >= 6 ? 'High Solar Radiation' : 'Moderate Solar Radiation',
          unit: 'UVI'
        };
      case 'airquality':
        return {
          value: airQuality?.aqi !== null && airQuality?.aqi !== undefined ? `${airQuality.aqi}` : '--',
          label: airQuality?.levelText || 'Air Quality Monitoring',
          unit: 'AQI'
        };
    }
  }
}

/**
 * Radar Provider Abstraction
 * As mandated by Prompt 4:
 * Open-Meteo does not provide live raster radar tiles.
 * We provide a pristine "Live Radar Provider Not Connected" notice without creating fake radar movement or fake precipitation clouds.
 */
export class OpenMeteoRadarProvider implements IRadarProvider {
  id = 'radar_unconnected';
  name = 'Live Weather Radar Layer';
  isAvailable = false;
  status: 'DISCONNECTED' = 'DISCONNECTED';
  noticeTitle = 'Live Radar Provider Not Connected';
  noticeMessage =
    'Open-Meteo supplies point-based synoptic numerical models. Live Doppler radar reflectivity and composite precipitation tiles require an external radar provider (e.g. RainViewer or IMD Doppler). The interface architecture is calibrated and ready for radar stream connection.';

  getRadarTimestamp(): string | null {
    return null;
  }
}

export class ConsolidatedMapProvider implements IMapProvider {
  id = 'consolidated_weather_map';
  name = 'Weather Intelligence Synoptic Map';
  baseMap: IBaseMapProvider = new OpenStreetMapBaseProvider();
  weatherLayers: IWeatherLayerProvider = new StandardWeatherLayerProvider();
  radar: IRadarProvider = new OpenMeteoRadarProvider();
}

export const defaultMapProvider: IMapProvider = new ConsolidatedMapProvider();
