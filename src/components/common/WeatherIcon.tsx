import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Tornado,
  LucideIcon
} from 'lucide-react';
import { WeatherConditionType } from '../../types/weather';
import { parseWmoWeatherCode } from '../../utils/weatherCodes';

interface WeatherIconProps {
  condition?: WeatherConditionType | string;
  code?: number | null;
  isDaytime?: boolean;
  size?: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  condition,
  code,
  isDaytime = true,
  size = 24,
  className = ''
}) => {
  // If numeric WMO code is provided, use parseWmoWeatherCode
  if (code !== undefined && code !== null) {
    const info = parseWmoWeatherCode(code, isDaytime);
    const IconComp = info.icon;
    return <IconComp size={size} className={className} aria-label={info.description} />;
  }

  // Otherwise map from WeatherCondition enum
  let IconComponent: LucideIcon = Sun;
  let label = 'Clear Sky';

  switch (condition) {
    case 'clear':
      IconComponent = isDaytime ? Sun : Moon;
      label = isDaytime ? 'Clear Sunny Sky' : 'Clear Night Sky';
      break;

    case 'partly-cloudy':
      IconComponent = isDaytime ? CloudSun : CloudMoon;
      label = isDaytime ? 'Partly Cloudy' : 'Partly Cloudy Night';
      break;

    case 'cloudy':
    case 'overcast':
      IconComponent = Cloud;
      label = 'Cloudy / Overcast Sky';
      break;

    case 'fog':
    case 'mist':
    case 'rime-fog':
      IconComponent = CloudFog;
      label = 'Atmospheric Fog / Mist';
      break;

    case 'drizzle':
    case 'light-drizzle':
    case 'dense-drizzle':
    case 'freezing-drizzle':
      IconComponent = CloudDrizzle;
      label = 'Precipitating Drizzle';
      break;

    case 'rain':
    case 'slight-rain':
    case 'moderate-rain':
    case 'heavy-rain':
    case 'freezing-rain':
    case 'rain-showers':
      IconComponent = CloudRain;
      label = 'Precipitating Rain';
      break;

    case 'snow':
    case 'slight-snow':
    case 'heavy-snow':
    case 'snow-grains':
    case 'snow-showers':
      IconComponent = CloudSnow;
      label = 'Precipitating Snow';
      break;

    case 'thunderstorm':
    case 'thunderstorm-hail':
      IconComponent = CloudLightning;
      label = 'Severe Thunderstorm';
      break;

    case 'squall':
    case 'tornado':
      IconComponent = Tornado;
      label = 'Extreme Atmospheric Vortex';
      break;

    default:
      IconComponent = isDaytime ? CloudSun : CloudMoon;
      label = 'Atmospheric Condition';
      break;
  }

  return <IconComponent size={size} className={className} aria-label={label} />;
};
