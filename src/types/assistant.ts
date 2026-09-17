export type AssistantIntent =
  | 'CURRENT_WEATHER'
  | 'RAIN'
  | 'TEMPERATURE'
  | 'FEELS_LIKE'
  | 'WIND'
  | 'UV'
  | 'AQI'
  | 'HOURLY_FORECAST'
  | 'DAILY_FORECAST'
  | 'BEST_OUTDOOR_TIME'
  | 'TRAVEL_PLANNER'
  | 'CLOTHING'
  | 'UMBRELLA'
  | 'SUNRISE'
  | 'SUNSET'
  | 'WEATHER_COMPARISON'
  | 'WEEK_FORECAST'
  | 'DATA_FRESHNESS';

export type OutdoorCategory =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Less Suitable'
  | 'Poor';

export interface OutdoorScoreResult {
  score: number; // 0-100
  category: OutdoorCategory;
  reasons: string[];
  factorsUsed: string[];
  weightsUsed: Record<string, number>;
  normalizedNotice?: string;
}

export interface BestTimeWindow {
  rank: number;
  timeRange: string;
  label: 'Best' | 'Good' | 'Less Suitable';
  explanation: string;
  score: number;
  factors: {
    temp?: number;
    rainProb?: number;
    wind?: number;
    uv?: number;
    condition?: string;
  };
}

export interface DayPeriodItem {
  period: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  timeSpan: string;
  temperature: number | null;
  feelsLike: number | null;
  conditionText: string;
  rainProbability: number | null;
  windSpeed: number | null;
  uvIndex?: number | null;
  summary: string;
  available: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  value: string;
  subtext: string;
  type: 'sunrise' | 'sunset' | 'warmest' | 'rain' | 'wind' | 'uv';
}

export interface DayComparisonResult {
  day1Name: string;
  day1Date: string;
  day2Name: string;
  day2Date: string;
  preferredDay: string;
  explanation: string;
  day1Metrics: {
    tempMax: number | null;
    tempMin: number | null;
    rainProb: number | null;
    precipitation: number | null;
    windSpeed: number | null;
    uvIndex: number | null;
    condition: string;
    outdoorScore: number;
  };
  day2Metrics: {
    tempMax: number | null;
    tempMin: number | null;
    rainProb: number | null;
    precipitation: number | null;
    windSpeed: number | null;
    uvIndex: number | null;
    condition: string;
    outdoorScore: number;
  };
}

export interface LocationComparisonResult {
  loc1Name: string;
  loc2Name: string;
  loc1Metrics: {
    temp: number | null;
    feelsLike: number | null;
    rainProb: number | null;
    wind: number | null;
    humidity: number | null;
    uv: number | null;
    aqi: number | null;
    condition: string;
  };
  loc2Metrics: {
    temp: number | null;
    feelsLike: number | null;
    rainProb: number | null;
    wind: number | null;
    humidity: number | null;
    uv: number | null;
    aqi: number | null;
    condition: string;
  };
  summary: string;
}

export interface TravelWeatherResult {
  destination: string;
  date: string;
  available: boolean;
  statusMessage?: string;
  tempRange?: string;
  rainProb?: number | null;
  wind?: number | null;
  uv?: number | null;
  aqi?: number | null;
  condition?: string;
  outdoorScore?: number | null;
  considerations: string[];
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  query?: string;
  timestamp: string;
  intent?: AssistantIntent;
  title?: string;
  headline: string;
  detailedText: string;
  simplifiedText?: string;
  dataConfidence: 'High' | 'Moderate' | 'Limited';
  confidenceReason: string;
  basedOn: string[];
  source: string;
  locationName: string;
  // Specific intelligence payload
  outdoorScore?: OutdoorScoreResult;
  bestTimes?: BestTimeWindow[];
  umbrellaAdvice?: {
    recommendation: 'Likely useful' | 'Probably not needed' | 'Rain data unavailable';
    reason: string;
    maxRainProb?: number | null;
  };
  clothingAdvice?: {
    summary: string;
    tags: string[];
  };
  comfortEstimate?: {
    currentTemp: number | null;
    feelsLike: number | null;
    comfortLevel: string;
    reason: string;
  };
  timelineEvents?: TimelineEvent[];
  dayPeriods?: DayPeriodItem[];
  dayComparison?: DayComparisonResult;
  locationComparison?: LocationComparisonResult;
  travelResult?: TravelWeatherResult;
}
