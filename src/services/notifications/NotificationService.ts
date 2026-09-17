/**
 * Smart Weather Notification Service & Rule Evaluation Engine
 * Handles Web Notifications API, trigger rules, deduplication hysteresis, and in-app history.
 */

import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  AirQualityData,
  LocationItem,
  NotificationItem,
  NotificationRule,
  NotificationType,
  UserSettings
} from '../../types/weather';
import { StorageService } from '../storageService';

export class NotificationService {
  /**
   * Check Web Notifications API permission status
   */
  static getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as 'granted' | 'denied' | 'default';
  }

  /**
   * Request browser permission only on explicit user invocation
   */
  static async requestPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      return result as 'granted' | 'denied';
    } catch (e) {
      console.warn('[NotificationService] Permission request failed:', e);
      return 'denied';
    }
  }

  /**
   * Send notification via Web Notifications API (if permitted) and record in in-app center
   */
  static async notifyUser(notification: NotificationItem): Promise<void> {
    // 1. Record in local persistent storage
    await StorageService.addNotification(notification);

    // 2. Dispatch browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: notification.fingerprint // Replaces duplicate alerts with identical tag
        });
      } catch (e) {
        console.warn('[NotificationService] Native notification dispatch error:', e);
      }
    }
  }

  /**
   * Evaluate all active weather triggers and settings against current synoptic telemetry
   */
  static async evaluateRules(
    location: LocationItem,
    weather: CurrentWeather | null,
    daily: DailyForecastItem[],
    hourly: HourlyForecastItem[],
    airQuality: AirQualityData | null,
    settings: UserSettings
  ): Promise<NotificationItem[]> {
    if (!settings.notifications) {
      return [];
    }

    const newNotifications: NotificationItem[] = [];
    const fingerprints = await StorageService.getNotificationFingerprints();
    const now = Date.now();
    const todayIso = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const locName = location.name || location.city || 'Local Area';

    // Helper to evaluate and trigger alert with hysteresis & deduplication
    const triggerIfValid = async (
      type: NotificationType,
      title: string,
      message: string,
      severity: 'info' | 'warning' | 'severe' | 'extreme',
      source: string,
      fingerprintSuffix: string = ''
    ) => {
      const fingerprint = `${locName}_${todayIso}_${type}${fingerprintSuffix ? '_' + fingerprintSuffix : ''}`;
      const existing = fingerprints[fingerprint];

      // If triggered within the last 6 hours for same fingerprint, skip to avoid spam
      if (existing && now - existing.lastTriggeredAt < 6 * 60 * 60 * 1000) {
        return;
      }

      const item: NotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        location: locName,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        severity,
        source,
        isRead: false,
        fingerprint
      };

      fingerprints[fingerprint] = {
        lastTriggeredAt: now,
        status: 'triggered'
      };

      await this.notifyUser(item);
      newNotifications.push(item);
    };

    // 1. Rain Alert Trigger
    if (settings.rainAlertThreshold && hourly && hourly.length > 0) {
      const threshold = settings.rainAlertThreshold;
      // Check upcoming 12 hours
      const upcomingRainHours = hourly.slice(0, 12).filter((h) => (h.precipitationProbability ?? 0) >= threshold);
      if (upcomingRainHours.length > 0) {
        const firstHour = upcomingRainHours[0];
        const maxProb = Math.max(...upcomingRainHours.map((h) => h.precipitationProbability ?? 0));
        await triggerIfValid(
          maxProb >= 80 ? 'HEAVY_RAIN' : 'RAIN',
          `Rain Expected in ${locName}`,
          `Precipitation probability reaches ${maxProb}% around ${firstHour.time}. Consider carrying an umbrella.`,
          maxProb >= 80 ? 'warning' : 'info',
          'Open-Meteo High-Resolution Model',
          `rain_${Math.floor(currentHour / 4)}` // buckets into 4h periods
        );
      }
    }

    // 2. Wind Velocity Trigger
    if (settings.windAlertThreshold && weather && weather.windSpeed !== null) {
      const threshold = settings.windAlertThreshold;
      if (weather.windSpeed >= threshold) {
        await triggerIfValid(
          'STRONG_WIND',
          `High Wind Advisory for ${locName}`,
          `Wind speeds are currently ${weather.windSpeed.toFixed(1)} km/h (gusts up to ${weather.windGusts?.toFixed(1) || '--'} km/h). Exercise caution outdoors.`,
          weather.windSpeed >= 60 ? 'severe' : 'warning',
          'Synoptic Surface Stations',
          `wind_${Math.floor(currentHour / 6)}`
        );
      }
    }

    // 3. UV Radiation Alert
    if (settings.uvAlertThreshold && weather && weather.uvIndex !== null) {
      let minUv = 8;
      if (settings.uvAlertThreshold === 'high') minUv = 6;
      if (settings.uvAlertThreshold === 'very-high') minUv = 8;
      if (settings.uvAlertThreshold === 'extreme') minUv = 11;

      if (weather.uvIndex >= minUv) {
        const severity = weather.uvIndex >= 11 ? 'extreme' : 'warning';
        await triggerIfValid(
          'HIGH_UV',
          `High Solar UV Index (${weather.uvIndex.toFixed(1)})`,
          `Very high ultraviolet radiation detected in ${locName}. Seek shade and wear SPF protection between 11 AM and 4 PM.`,
          severity,
          'CAMS UV Radiation Service',
          `uv_${todayIso}`
        );
      }
    }

    // 4. Extreme Temperature Alerts (Stored internally in °C)
    if (weather && weather.temperature !== null) {
      if (settings.tempAlertHigh && weather.temperature >= settings.tempAlertHigh) {
        await triggerIfValid(
          'TEMPERATURE_CHANGE',
          `Elevated Temperature Warning in ${locName}`,
          `Ambient temperature has reached ${weather.temperature.toFixed(1)}°C. Stay hydrated and avoid intense midday exertion.`,
          weather.temperature >= 42 ? 'severe' : 'warning',
          'Synoptic Observations',
          `heat_${todayIso}`
        );
      } else if (settings.tempAlertLow && weather.temperature <= settings.tempAlertLow) {
        await triggerIfValid(
          'TEMPERATURE_CHANGE',
          `Low Temperature Notice in ${locName}`,
          `Current temperature has dropped to ${weather.temperature.toFixed(1)}°C. Wear warm thermal layers.`,
          'info',
          'Synoptic Observations',
          `cold_${todayIso}`
        );
      }
    }

    // 5. Air Quality (AQI) Alert
    const activeUsAqi = airQuality?.us_aqi ?? airQuality?.aqi ?? null;
    const activeEuAqi = airQuality?.european_aqi ?? null;
    if (settings.aqiAlertThreshold && airQuality && activeUsAqi !== null) {
      const aqiVal = settings.aqiAlertScale === 'European AQI' && activeEuAqi !== null ? activeEuAqi : activeUsAqi;
      if (aqiVal !== null && aqiVal >= settings.aqiAlertThreshold) {
        await triggerIfValid(
          'AQI_CHANGE',
          `Poor Air Quality (${settings.aqiAlertScale || 'US AQI'}: ${aqiVal})`,
          `Air quality in ${locName} is classified as ${airQuality.levelText || 'unhealthy'}. Sensitive groups should limit prolonged outdoor exposure.`,
          aqiVal >= 200 ? 'severe' : 'warning',
          'Copernicus Atmospheric Monitoring',
          `aqi_${todayIso}`
        );
      }
    }

    // 6. Daily Weather Summary Notification
    if (settings.dailySummaryEnabled && daily && daily.length > 0) {
      const todayForecast = daily[0];
      const morningTemp = hourly && hourly.length >= 8 ? hourly[8].temperature : todayForecast.lowTemp;
      const afternoonHigh = todayForecast.highTemp;
      const rainProb = todayForecast.precipitationProbability ?? 0;
      const windSpeed = todayForecast.windSpeedMax ?? weather?.windSpeed ?? 15;

      const summaryText = `Today in ${locName}: ${morningTemp !== null ? morningTemp + '°C morning → ' : ''}${afternoonHigh}°C afternoon high. Rain probability up to ${rainProb}%. Wind ${windSpeed.toFixed(0)} km/h.`;

      await triggerIfValid(
        'FORECAST_UPDATE',
        `Daily Weather Summary · ${locName}`,
        summaryText,
        'info',
        'Deterministic Synoptic Engine',
        `daily_summary_${todayIso}`
      );
    }

    // Persist updated fingerprints
    await StorageService.saveNotificationFingerprints(fingerprints);

    return newNotifications;
  }
}
