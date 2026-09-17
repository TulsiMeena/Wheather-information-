import { TemperatureUnit, WindSpeedUnit } from '../types/weather';

export function formatTemperature(
  tempC: number | null | undefined,
  unit: TemperatureUnit = 'C'
): string {
  if (tempC === null || tempC === undefined) return '--°';
  if (unit === 'F') {
    const tempF = Math.round((tempC * 9) / 5 + 32);
    return `${tempF}°`;
  }
  return `${Math.round(tempC)}°`;
}

export function formatWindSpeed(
  speedKmh: number | null | undefined,
  unit: WindSpeedUnit = 'km/h'
): string {
  if (speedKmh === null || speedKmh === undefined) return '--';
  if (unit === 'mph') {
    const mph = Math.round(speedKmh * 0.621371);
    return `${mph} mph`;
  }
  if (unit === 'm/s') {
    const ms = (speedKmh / 3.6).toFixed(1);
    return `${ms} m/s`;
  }
  if (unit === 'knots') {
    const knots = Math.round(speedKmh * 0.539957);
    return `${knots} kn`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

export function getWindCardinalDirection(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

export const getWindDirectionName = getWindCardinalDirection;

export function formatPrecipitation(mm: number | null | undefined): string {
  if (mm === null || mm === undefined) return '-- mm';
  return `${mm.toFixed(1)} mm`;
}

export function formatRelativeTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--';
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--%';
  return `${Math.round(value)}%`;
}

export function formatPressure(hPa: number | null | undefined): string {
  if (hPa === null || hPa === undefined) return '-- hPa';
  return `${Math.round(hPa)} hPa`;
}

export function formatVisibility(km: number | null | undefined): string {
  if (km === null || km === undefined) return '-- km';
  return `${km.toFixed(1)} km`;
}

export function formatUVIndex(uv: number | null | undefined): { value: string; label: string } {
  if (uv === null || uv === undefined) return { value: '--', label: 'Unknown' };
  const rounded = Math.round(uv);
  let label = 'Low';
  if (rounded >= 11) label = 'Extreme';
  else if (rounded >= 8) label = 'Very High';
  else if (rounded >= 6) label = 'High';
  else if (rounded >= 3) label = 'Moderate';
  return { value: `${rounded}`, label };
}

export function formatTime(isoOrTimeStr: string | null | undefined): string {
  if (!isoOrTimeStr) return '--:--';
  try {
    const date = new Date(isoOrTimeStr);
    if (isNaN(date.getTime())) return isoOrTimeStr;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrTimeStr;
  }
}
