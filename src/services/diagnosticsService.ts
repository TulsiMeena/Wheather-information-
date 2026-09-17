import {
  ApiDiagnosticsReport,
  ApiErrorType,
  ApiHealthStatus,
  AirQualityData,
  CurrentWeather,
  DataQualityReport,
  RequestLogEntry
} from '../types/weather';

/**
 * Diagnostics and Request Monitoring Service
 * Developer-safe, offline-safe internal telemetry monitor.
 * Strictly local - NEVER uploads or transmits diagnostic data to external servers.
 */
class DiagnosticsServiceClass {
  private recentRequests: RequestLogEntry[] = [];
  private readonly MAX_LOG_SIZE = 50;
  private lastSuccessfulTimestamp: string | null = null;

  private weatherApiStatus: ApiHealthStatus = 'CONNECTED';
  private airQualityApiStatus: ApiHealthStatus = 'CONNECTED';
  private mapStatus: ApiHealthStatus = 'AVAILABLE';
  private historyApiStatus: ApiHealthStatus = 'AVAILABLE';

  /**
   * Classify technical exceptions into standardized, user-friendly API error types
   */
  public classifyError(err: any): { type: ApiErrorType; userMessage: string } {
    if (!err) {
      return {
        type: 'UNKNOWN_ERROR',
        userMessage: 'An unexpected error occurred while processing atmospheric data.'
      };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        type: 'OFFLINE',
        userMessage: 'Device is offline. Serving local cached weather observations.'
      };
    }

    const message = (err.message || String(err)).toLowerCase();

    if (message.includes('abort') || message.includes('timeout')) {
      return {
        type: 'TIMEOUT',
        userMessage: 'Atmospheric server connection timed out. Retrying recommended.'
      };
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return {
        type: 'RATE_LIMIT',
        userMessage: 'Open-Meteo request frequency limit reached. Please wait a brief moment.'
      };
    }

    if (message.includes('network') || message.includes('failed to fetch') || message.includes('connection')) {
      return {
        type: 'NETWORK_ERROR',
        userMessage: 'Network connectivity interrupted. Please verify your internet connection.'
      };
    }

    if (message.includes('location') || message.includes('latitude') || message.includes('longitude') || message.includes('coordinates')) {
      return {
        type: 'INVALID_LOCATION',
        userMessage: 'Coordinates supplied are outside valid geographical bounds.'
      };
    }

    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('server error')) {
      return {
        type: 'SERVER_ERROR',
        userMessage: 'Open-Meteo telemetry server is temporarily experiencing high load.'
      };
    }

    if (message.includes('parse') || message.includes('invalid response') || message.includes('malformed')) {
      return {
        type: 'INVALID_RESPONSE',
        userMessage: 'Received unexpected response format from weather telemetry feed.'
      };
    }

    return {
      type: 'UNKNOWN_ERROR',
      userMessage: err.message || 'Meteorological data could not be retrieved at this time.'
    };
  }

  /**
   * Log an internal request for performance and diagnostics auditing
   */
  public recordRequest(entry: {
    provider: string;
    endpoint: string;
    startTime: number;
    endTime: number;
    success: boolean;
    status?: number;
    error?: any;
    cacheHit: boolean;
  }): void {
    const durationMs = Math.max(0, Math.round(entry.endTime - entry.startTime));
    let errorType: ApiErrorType | undefined;
    let errorMessage: string | undefined;

    if (!entry.success && entry.error) {
      const classified = this.classifyError(entry.error);
      errorType = classified.type;
      errorMessage = classified.userMessage;

      // Update service health statuses
      if (entry.provider.toLowerCase().includes('weather')) {
        this.weatherApiStatus = errorType === 'OFFLINE' ? 'OFFLINE' : 'ERROR';
      } else if (entry.provider.toLowerCase().includes('air')) {
        this.airQualityApiStatus = errorType === 'OFFLINE' ? 'OFFLINE' : 'ERROR';
      } else if (entry.provider.toLowerCase().includes('history')) {
        this.historyApiStatus = errorType === 'OFFLINE' ? 'OFFLINE' : 'ERROR';
      }
    } else if (entry.success) {
      this.lastSuccessfulTimestamp = new Date().toISOString();
      if (entry.provider.toLowerCase().includes('weather')) {
        this.weatherApiStatus = 'CONNECTED';
      } else if (entry.provider.toLowerCase().includes('air')) {
        this.airQualityApiStatus = 'CONNECTED';
      } else if (entry.provider.toLowerCase().includes('history')) {
        this.historyApiStatus = 'AVAILABLE';
      }
    }

    const logItem: RequestLogEntry = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: entry.provider,
      endpoint: entry.endpoint,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationMs,
      success: entry.success,
      status: entry.status,
      errorType,
      errorMessage,
      cacheHit: entry.cacheHit,
      timestampIso: new Date(entry.endTime).toISOString()
    };

    this.recentRequests.unshift(logItem);
    if (this.recentRequests.length > this.MAX_LOG_SIZE) {
      this.recentRequests.pop();
    }
  }

  /**
   * Retrieve aggregate diagnostics telemetry
   */
  public getDiagnosticsReport(): ApiDiagnosticsReport {
    const total = this.recentRequests.length;
    const cacheHits = this.recentRequests.filter((r) => r.cacheHit).length;
    const cacheHitRatio = total > 0 ? Math.round((cacheHits / total) * 100) : 0;

    const latencies = this.recentRequests
      .filter((r) => !r.cacheHit && r.durationMs > 0)
      .map((r) => r.durationMs);

    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

    return {
      weatherApiStatus: this.weatherApiStatus,
      airQualityApiStatus: this.airQualityApiStatus,
      mapStatus: this.mapStatus,
      historyApiStatus: this.historyApiStatus,
      lastSuccessfulRequestTime: this.lastSuccessfulTimestamp,
      recentRequests: [...this.recentRequests],
      cacheHitRatio,
      avgLatencyMs
    };
  }

  public getRecentLogs(): RequestLogEntry[] {
    return [...this.recentRequests];
  }

  public clearLogs(): void {
    this.recentRequests = [];
  }

  /**
   * Data Quality Evaluator
   * Evaluates observation completeness, freshness, valid timestamps, and field coverage.
   * Outputs tier: 'Excellent' | 'Good' | 'Limited' without inventing fake percentages.
   */
  public evaluateDataQuality(
    weather: CurrentWeather | null,
    airQuality: AirQualityData | null,
    hourlyCount: number = 0
  ): DataQualityReport {
    if (!weather) {
      return {
        tier: 'Limited',
        completeness: 0,
        freshnessLabel: 'No Active Telemetry',
        checks: [
          { label: 'Surface Telemetry', passed: false, details: 'Observation dataset is currently empty.' },
          { label: 'Hourly Resolution', passed: false, details: 'No forecast intervals loaded.' }
        ],
        summary: 'Atmospheric observations are not loaded for the selected geographical point.'
      };
    }

    const checks: { label: string; passed: boolean; details: string }[] = [];

    // Check 1: Temperature & Apparent
    const hasTemp = weather.temperature !== null && !isNaN(weather.temperature) && isFinite(weather.temperature);
    checks.push({
      label: 'Thermal Telemetry',
      passed: hasTemp,
      details: hasTemp ? `Ambient ${Math.round(weather.temperature!)}°C verified` : 'Missing ambient temperature'
    });

    // Check 2: Atmospheric Pressure & Humidity
    const hasPressureHumidity =
      weather.humidity !== null && !isNaN(weather.humidity) &&
      weather.pressure !== null && !isNaN(weather.pressure);
    checks.push({
      label: 'Barometric & Hygrometry',
      passed: hasPressureHumidity,
      details: hasPressureHumidity
        ? `Humidity ${weather.humidity}%, Pressure ${weather.pressure} hPa`
        : 'Partial barometric sensor metrics'
    });

    // Check 3: Anemometry (Wind)
    const hasWind = weather.windSpeed !== null && !isNaN(weather.windSpeed);
    checks.push({
      label: 'Anemometry (Wind Speed/Dir)',
      passed: hasWind,
      details: hasWind ? `Wind ${Math.round(weather.windSpeed!)} km/h recorded` : 'Wind velocity unrecorded'
    });

    // Check 4: Radiometric / Solar (UV)
    const hasUv = weather.uvIndex !== null && !isNaN(weather.uvIndex);
    checks.push({
      label: 'Solar Radiation (UV Index)',
      passed: hasUv,
      details: hasUv ? `UV Index ${weather.uvIndex} confirmed` : 'UV index unrecorded'
    });

    // Check 5: Hourly Depth
    const hasHourly = hourlyCount >= 24;
    checks.push({
      label: 'Hourly Horizon (24h+)',
      passed: hasHourly,
      details: `${hourlyCount} synoptic intervals retrieved`
    });

    // Check 6: Air Quality Integration
    const hasAqi = airQuality?.aqi !== null && airQuality?.aqi !== undefined;
    checks.push({
      label: 'Air Quality Matrix',
      passed: hasAqi,
      details: hasAqi ? `US EPA AQI ${airQuality!.aqi} synced` : 'AQI channel unlinked'
    });

    const passedCount = checks.filter((c) => c.passed).length;
    const completeness = Math.round((passedCount / checks.length) * 100);

    let tier: 'Excellent' | 'Good' | 'Limited' = 'Limited';
    if (passedCount >= 5) {
      tier = 'Excellent';
    } else if (passedCount >= 3) {
      tier = 'Good';
    }

    let freshnessLabel = 'Live Fresh';
    if (weather.isCached) {
      freshnessLabel = 'Cached Local';
    } else if (weather.updatedAt) {
      const diffMin = Math.round((Date.now() - new Date(weather.updatedAt).getTime()) / 60000);
      if (diffMin > 60) freshnessLabel = `Updated ${Math.round(diffMin / 60)}h ago`;
      else if (diffMin > 1) freshnessLabel = `Updated ${diffMin}m ago`;
      else freshnessLabel = 'Just updated';
    }

    const summary =
      tier === 'Excellent'
        ? 'Comprehensive multi-sensor telemetry with high-frequency temporal granularity.'
        : tier === 'Good'
        ? 'Solid primary meteorological observations with minor secondary sensor omissions.'
        : 'Essential parameters present; ancillary telemetry channels currently limited.';

    return {
      tier,
      completeness,
      freshnessLabel,
      checks,
      summary
    };
  }

  /**
   * Data validation & sanitization helper to guarantee no NaN, Infinity, or null crashes
   */
  public validateNumber(val: any, fallback: number | null = null, min?: number, max?: number): number | null {
    if (val === null || val === undefined || typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return fallback;
    }
    if (min !== undefined && val < min) return fallback;
    if (max !== undefined && val > max) return fallback;
    return val;
  }

  public formatSafe(val: number | null | undefined, unit: string = '', fallback: string = '--'): string {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return fallback;
    }
    return `${Math.round(val * 10) / 10}${unit}`;
  }
}

export const DiagnosticsService = new DiagnosticsServiceClass();
