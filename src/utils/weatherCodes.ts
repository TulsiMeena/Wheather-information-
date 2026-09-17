import {
  Sun,
  Moon,
  SunDim,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { WeatherConditionType, WeatherCategory } from '../types/weather';

/**
 * WMO Weather Code Interpreter for Open-Meteo.
 * Maps WMO code (0-99) to standardized condition, category, description, and icon.
 */
export interface WeatherCodeInfo {
  condition: WeatherConditionType;
  category: WeatherCategory;
  description: string;
  icon: LucideIcon;
  iconName: string;
}

export function parseWmoWeatherCode(
  code: number | null | undefined,
  isDay: boolean = true
): WeatherCodeInfo {
  if (code === null || code === undefined) {
    return {
      condition: isDay ? 'clear' : 'night',
      category: 'Unknown',
      description: 'Awaiting Connection',
      icon: isDay ? Sun : Moon,
      iconName: isDay ? 'Sun' : 'Moon'
    };
  }

  // WMO Code Table Mapping
  switch (code) {
    // 0: Clear sky
    case 0:
      return {
        condition: isDay ? 'clear' : 'night',
        category: 'Clear',
        description: isDay ? 'Clear Sky' : 'Clear Night',
        icon: isDay ? Sun : Moon,
        iconName: isDay ? 'Sun' : 'Moon'
      };

    // 1: Mainly clear
    case 1:
      return {
        condition: isDay ? 'clear' : 'night',
        category: 'Clear',
        description: isDay ? 'Mainly Clear' : 'Clear Sky',
        icon: isDay ? SunDim : Moon,
        iconName: isDay ? 'SunDim' : 'Moon'
      };

    // 2: Partly cloudy
    case 2:
      return {
        condition: 'partly-cloudy',
        category: 'Partly Cloudy',
        description: 'Partly Cloudy',
        icon: isDay ? CloudSun : CloudMoon,
        iconName: isDay ? 'CloudSun' : 'CloudMoon'
      };

    // 3: Overcast
    case 3:
      return {
        condition: 'cloudy',
        category: 'Cloudy',
        description: 'Overcast',
        icon: Cloud,
        iconName: 'Cloud'
      };

    // 45, 48: Fog and depositing rime fog
    case 45:
    case 48:
      return {
        condition: 'fog',
        category: 'Fog',
        description: code === 48 ? 'Depositing Rime Fog' : 'Fog',
        icon: CloudFog,
        iconName: 'CloudFog'
      };

    // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
    case 51:
      return {
        condition: 'drizzle',
        category: 'Drizzle',
        description: 'Light Drizzle',
        icon: CloudDrizzle,
        iconName: 'CloudDrizzle'
      };
    case 53:
      return {
        condition: 'drizzle',
        category: 'Drizzle',
        description: 'Moderate Drizzle',
        icon: CloudDrizzle,
        iconName: 'CloudDrizzle'
      };
    case 55:
      return {
        condition: 'drizzle',
        category: 'Drizzle',
        description: 'Dense Drizzle',
        icon: CloudDrizzle,
        iconName: 'CloudDrizzle'
      };

    // 56, 57: Freezing Drizzle: Light and dense
    case 56:
    case 57:
      return {
        condition: 'freezing-rain',
        category: 'Freezing Rain',
        description: code === 57 ? 'Dense Freezing Drizzle' : 'Light Freezing Drizzle',
        icon: CloudDrizzle,
        iconName: 'CloudDrizzle'
      };

    // 61, 63: Rain: Slight, moderate
    case 61:
      return {
        condition: 'rain',
        category: 'Rain',
        description: 'Slight Rain',
        icon: CloudRain,
        iconName: 'CloudRain'
      };
    case 63:
      return {
        condition: 'rain',
        category: 'Rain',
        description: 'Moderate Rain',
        icon: CloudRain,
        iconName: 'CloudRain'
      };

    // 65: Rain: Heavy intensity
    case 65:
      return {
        condition: 'heavy-rain',
        category: 'Heavy Rain',
        description: 'Heavy Rain',
        icon: CloudRainWind,
        iconName: 'CloudRainWind'
      };

    // 66, 67: Freezing Rain: Light and heavy
    case 66:
    case 67:
      return {
        condition: 'freezing-rain',
        category: 'Freezing Rain',
        description: code === 67 ? 'Heavy Freezing Rain' : 'Light Freezing Rain',
        icon: CloudRain,
        iconName: 'CloudRain'
      };

    // 71, 73, 75, 77: Snow fall: Slight, moderate, heavy, snow grains
    case 71:
      return {
        condition: 'snow',
        category: 'Snow',
        description: 'Slight Snow Fall',
        icon: CloudSnow,
        iconName: 'CloudSnow'
      };
    case 73:
      return {
        condition: 'snow',
        category: 'Snow',
        description: 'Moderate Snow Fall',
        icon: CloudSnow,
        iconName: 'CloudSnow'
      };
    case 75:
      return {
        condition: 'snow',
        category: 'Snow',
        description: 'Heavy Snow Fall',
        icon: CloudSnow,
        iconName: 'CloudSnow'
      };
    case 77:
      return {
        condition: 'snow',
        category: 'Snow',
        description: 'Snow Grains',
        icon: CloudSnow,
        iconName: 'CloudSnow'
      };

    // 80, 81: Rain showers: Slight, moderate
    case 80:
      return {
        condition: 'rain',
        category: 'Rain',
        description: 'Slight Rain Showers',
        icon: CloudRainWind,
        iconName: 'CloudRainWind'
      };
    case 81:
      return {
        condition: 'rain',
        category: 'Rain',
        description: 'Moderate Rain Showers',
        icon: CloudRainWind,
        iconName: 'CloudRainWind'
      };

    // 82: Violent rain showers
    case 82:
      return {
        condition: 'heavy-rain',
        category: 'Heavy Rain',
        description: 'Violent Rain Showers',
        icon: CloudRainWind,
        iconName: 'CloudRainWind'
      };

    // 85, 86: Snow showers slight and heavy
    case 85:
    case 86:
      return {
        condition: 'snow',
        category: 'Snow',
        description: code === 86 ? 'Heavy Snow Showers' : 'Slight Snow Showers',
        icon: CloudSnow,
        iconName: 'CloudSnow'
      };

    // 95: Thunderstorm: Slight or moderate
    case 95:
      return {
        condition: 'thunderstorm',
        category: 'Thunderstorm',
        description: 'Thunderstorm',
        icon: CloudLightning,
        iconName: 'CloudLightning'
      };

    // 96, 99: Thunderstorm with slight and heavy hail
    case 96:
    case 99:
      return {
        condition: 'thunderstorm',
        category: 'Thunderstorm',
        description: code === 99 ? 'Thunderstorm with Heavy Hail' : 'Thunderstorm with Slight Hail',
        icon: CloudLightning,
        iconName: 'CloudLightning'
      };

    default:
      return {
        condition: 'unknown',
        category: 'Unknown',
        description: 'Variable Atmospheric Conditions',
        icon: HelpCircle,
        iconName: 'HelpCircle'
      };
  }
}
