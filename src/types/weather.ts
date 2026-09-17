export type WeatherConditionType =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy-rain'
  | 'drizzle'
  | 'freezing-rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'night'
  | 'unknown';

export type WeatherCategory =
  | 'Clear'
  | 'Partly Cloudy'
  | 'Cloudy'
  | 'Fog'
  | 'Drizzle'
  | 'Rain'
  | 'Heavy Rain'
  | 'Freezing Rain'
  | 'Snow'
  | 'Thunderstorm'
  | 'Unknown';

export type TemperatureUnit = 'C' | 'F';
export type WindSpeedUnit = 'km/h' | 'mph' | 'm/s' | 'knots';
export type ThemeMode = 'light' | 'dark' | 'system';
export type WeatherDataState = 'LOADING' | 'SUCCESS' | 'ERROR' | 'NO_DATA' | 'OFFLINE';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationItem {
  id: string;
  name: string;
  city?: string;
  region?: string;
  state?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isFavorite?: boolean;
  isDefault?: boolean;
  addedAt?: string;
  lastUpdated?: string;
}

export interface FavoriteLocationItem {
  id: string;
  city: string;
  name: string;
  region?: string;
  state?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  addedAt: string;
  lastUpdated: string;
  isDefault?: boolean;
  isFavorite?: boolean;
}

export interface FavoriteWeatherSnapshot {
  temperature: number | null;
  feelsLike: number | null;
  condition: WeatherConditionType;
  conditionText: string;
  rainProbability: number | null;
  windSpeed: number | null;
  aqi: number | null;
  aqiLevelText?: string;
  lastUpdated: string;
  status: 'ready' | 'loading' | 'error';
  errorMessage?: string;
}


export interface CurrentWeather {
  temperature: number | null;
  feelsLike: number | null;
  condition: WeatherConditionType;
  conditionText: string;
  weatherCode: number | null;
  category: WeatherCategory;
  highTemp: number | null;
  lowTemp: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windGusts?: number | null;
  precipitation?: number | null;
  rain?: number | null;
  showers?: number | null;
  snowfall?: number | null;
  uvIndex: number | null;
  visibility: number | null;
  precipitationProbability: number | null;
  pressure: number | null;
  dewPoint: number | null;
  cloudCover: number | null;
  sunrise: string | null;
  sunset: string | null;
  isDaytime: boolean;
  updatedAt: string | null;
  isCached?: boolean;
}

export interface HourlyForecastItem {
  id: string;
  time: string;
  fullTime?: string;
  temperature: number | null;
  apparentTemperature?: number | null;
  condition: WeatherConditionType;
  conditionText: string;
  weatherCode?: number | null;
  precipitationProbability: number | null;
  precipitation?: number | null;
  rain?: number | null;
  snowfall?: number | null;
  windSpeed: number | null;
  windDirection?: number | null;
  windGusts?: number | null;
  humidity?: number | null;
  uvIndex?: number | null;
  visibility?: number | null;
  cloudCover?: number | null;
  isDaytime?: boolean;
  isNow?: boolean;
}

export interface DailyForecastItem {
  id: string;
  day: string;
  date: string;
  fullDate?: string;
  condition: WeatherConditionType;
  conditionText: string;
  weatherCode?: number | null;
  highTemp: number | null;
  lowTemp: number | null;
  apparentHighTemp?: number | null;
  apparentLowTemp?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
  precipitationProbability: number | null;
  precipitationSum?: number | null;
  rainSum?: number | null;
  showersSum?: number | null;
  snowfallSum?: number | null;
  windSpeedMax?: number | null;
  windGustsMax?: number | null;
  windDirectionDominant?: number | null;
  uvIndexMax?: number | null;
  isToday?: boolean;
}

export type DataFreshness = 'fresh' | 'cached' | 'stale' | 'unavailable';

export interface HourlyAqiItem {
  time: string;
  hour: string;
  aqi: number | null;
  pm2_5: number | null;
  pm10?: number | null;
  o3?: number | null;
  isNow?: boolean;
}

export interface AirQualityData {
  aqi: number | null;
  us_aqi?: number | null;
  european_aqi?: number | null;
  aqiScale?: 'US AQI' | 'European AQI';
  level: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous' | null;
  levelText: string;
  pm2_5: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  co: number | null;
  so2?: number | null;
  recommendation: string;
  hourlyTrends?: HourlyAqiItem[];
  freshness?: DataFreshness;
  updatedAt?: string;
}

export type AlertPriority = 'INFO' | 'WATCH' | 'IMPORTANT' | 'SEVERE';
export type AlertSeverity = 'info' | 'warning' | 'severe' | 'extreme' | AlertPriority;
export type AlertCategory =
  | 'Heavy rain'
  | 'Thunderstorm'
  | 'Extreme heat'
  | 'Strong wind'
  | 'Flood risk'
  | 'Severe weather'
  | 'Poor air quality'
  | 'High UV index';

export interface WeatherAlert {
  id: string;
  category: AlertCategory;
  title: string;
  severity: AlertSeverity;
  priority?: AlertPriority;
  alertType?: 'condition' | 'official';
  source: string;
  description: string;
  reason?: string;
  affectedLocation?: string;
  startTime: string;
  endTime: string;
  instructions?: string;
  lastUpdated?: string;
  isRead?: boolean;
  isDismissed?: boolean;
}

export type MapLayerType =
  | 'temperature'
  | 'precipitation'
  | 'rain'
  | 'wind'
  | 'clouds'
  | 'uv'
  | 'airquality';

export interface UserSettings {
  theme: ThemeMode;
  tempUnit: TemperatureUnit;
  windUnit: WindSpeedUnit;
  notifications: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
  refreshIntervalMinutes: number; // 15, 30, 60, or 0 (manual)
  defaultLocationId?: string | null;
  dataUsageMode?: 'normal' | 'saver';
  reducedMotion?: boolean;
  rainAlertThreshold?: number | null; // 10, 30, 50, 60, 70, 80, 90 (%)
  windAlertThreshold?: number | null; // in km/h internally
  uvAlertThreshold?: 'high' | 'very-high' | 'extreme' | null;
  tempAlertHigh?: number | null; // in Celsius internally
  tempAlertLow?: number | null;  // in Celsius internally
  aqiAlertThreshold?: number | null;
  aqiAlertScale?: 'US AQI' | 'European AQI';
  dailySummaryEnabled?: boolean;
}

export type NotificationType =
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'THUNDERSTORM'
  | 'STRONG_WIND'
  | 'HIGH_UV'
  | 'TEMPERATURE_CHANGE'
  | 'AQI_CHANGE'
  | 'SUNRISE'
  | 'SUNSET'
  | 'FORECAST_UPDATE';

export type NotificationSeverity = 'info' | 'warning' | 'severe' | 'extreme';

export interface NotificationItem {
  id: string;
  location: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  severity: NotificationSeverity;
  source: string;
  isRead: boolean;
  fingerprint: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'rain' | 'temp_above' | 'temp_below' | 'wind' | 'uv' | 'aqi' | 'daily_summary';
  threshold: number | string;
  scale?: 'US AQI' | 'European AQI';
  lastTriggeredAt?: string;
  lastState?: 'triggered' | 'normal';
}

export type HomeWidgetId =
  | 'current_weather'
  | 'hourly_forecast'
  | 'today_summary'
  | 'rain_timeline'
  | 'wind_gauge'
  | 'uv_index'
  | 'sun_cycle'
  | 'aqi_card'
  | 'temperature_metrics'
  | 'outdoor_score'
  | 'alerts_widget'
  | 'favorites_quick';

export interface HomeWidgetConfig {
  id: HomeWidgetId;
  label: string;
  visible: boolean;
  order: number;
}


export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

// ==========================================
// Historical Weather Types (Prompt 7)
// ==========================================

export interface HistoricalDataPoint {
  date: string; // YYYY-MM-DD
  temperatureMax: number | null;
  temperatureMin: number | null;
  temperatureMean: number | null;
  apparentTemperatureMean?: number | null;
  precipitationSum: number | null;
  rainSum: number | null;
  windSpeedMax: number | null;
  windGustsMax?: number | null;
  windDirectionDominant?: number | null;
  humidityMean?: number | null;
  cloudCoverMean?: number | null;
  uvIndexMax?: number | null;
  weatherCode?: number | null;
  conditionText?: string;
}

export interface HistoricalHourlyPoint {
  time: string; // ISO string
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  cloudCover: number | null;
  surfacePressure: number | null;
  weatherCode?: number | null;
}

export interface HistoricalWeatherResult {
  location: {
    name: string;
    city?: string;
    region?: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  startDate: string;
  endDate: string;
  daily: HistoricalDataPoint[];
  hourly: HistoricalHourlyPoint[];
  source: string;
  retrievedAt: string;
}

export interface HistoricalStatistics {
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  avgHumidity: number | null;
  totalPrecipitation: number | null;
  maxWind: number | null;
  avgWind: number | null;
  avgCloudCover: number | null;
  maxUv: number | null;
  totalDays: number;
  validDaysCount: number;
}

export interface PeriodRecordItem {
  type: 'highest_temp' | 'lowest_temp' | 'highest_precipitation' | 'strongest_wind';
  label: string;
  value: number;
  formattedValue: string;
  unit: string;
  date: string;
  location: string;
}

export interface PeriodSummary {
  avgTempFormatted: string;
  totalPrecipFormatted: string;
  warmestDay: { date: string; temp: string } | null;
  wettestDay: { date: string; precip: string } | null;
  strongestWindDay: { date: string; wind: string } | null;
}

export interface ForecastVsHistoryComparison {
  historicalPeriodLabel: string;
  forecastPeriodLabel: string;
  historyAvgTemp: number | null;
  forecastAvgTemp: number | null;
  tempDiff: number | null;
  historyTotalPrecip: number | null;
  forecastTotalPrecip: number | null;
  precipDiff: number | null;
  historyAvgWind: number | null;
  forecastAvgWind: number | null;
  windDiff: number | null;
  disclaimer: string;
}

// ==========================================
// API Diagnostics & Monitoring Types (Prompt 7)
// ==========================================

export type ApiErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'INVALID_LOCATION'
  | 'INVALID_RESPONSE'
  | 'SERVER_ERROR'
  | 'OFFLINE'
  | 'UNKNOWN_ERROR';

export type ApiHealthStatus = 'CONNECTED' | 'ERROR' | 'OFFLINE' | 'AVAILABLE' | 'UNAVAILABLE';

export interface RequestLogEntry {
  id: string;
  provider: string;
  endpoint: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  success: boolean;
  status?: number;
  errorType?: ApiErrorType;
  errorMessage?: string;
  cacheHit: boolean;
  timestampIso: string;
}

export interface ApiDiagnosticsReport {
  weatherApiStatus: ApiHealthStatus;
  airQualityApiStatus: ApiHealthStatus;
  mapStatus: ApiHealthStatus;
  historyApiStatus: ApiHealthStatus;
  lastSuccessfulRequestTime: string | null;
  recentRequests: RequestLogEntry[];
  cacheHitRatio: number;
  avgLatencyMs: number;
}

export type DataQualityTier = 'Excellent' | 'Good' | 'Limited';

export interface DataQualityCheck {
  label: string;
  passed: boolean;
  details: string;
}

export interface DataQualityReport {
  tier: DataQualityTier;
  completeness: number; // 0-100
  freshnessLabel: string;
  checks: DataQualityCheck[];
  summary: string;
}
