import { storageProvider } from '../providers/StorageProvider';
import {
  LocationItem,
  UserSettings,
  FavoriteLocationItem,
  HomeWidgetConfig,
  NotificationItem,
  NotificationRule
} from '../types/weather';

const FAVORITES_KEY = 'favorite_locations';
const SETTINGS_KEY = 'user_settings';
const LAST_LOCATION_KEY = 'last_selected_location';
const READ_ALERTS_KEY = 'read_alerts_ids';
const DISMISSED_ALERTS_KEY = 'dismissed_alerts_ids';
const WEATHER_CACHE_PREFIX = 'weather_cache_';
const HOME_WIDGETS_KEY = 'home_widgets_layout';
const NOTIFICATION_ITEMS_KEY = 'notification_history_items';
const NOTIFICATION_RULES_KEY = 'notification_rules_config';
const NOTIFICATION_FINGERPRINTS_KEY = 'notification_fingerprints';
const INSTALL_PROMPT_DISMISSED_KEY = 'install_prompt_dismissed';

export const MAX_FAVORITES_COUNT = 20;

export interface WeatherCacheSnapshot {
  location: LocationItem;
  currentWeather: any;
  hourlyForecast: any[];
  dailyForecast: any[];
  alerts: any[];
  airQuality: any;
  cachedAt: string;
}

export const defaultSettings: UserSettings = {
  theme: 'system',
  tempUnit: 'C',
  windUnit: 'km/h',
  notifications: true,
  locationPermission: 'prompt',
  refreshIntervalMinutes: 30, // default 30 min as specified in prompt
  defaultLocationId: null,
  dataUsageMode: 'normal',
  reducedMotion: false,
  rainAlertThreshold: 50, // default 50%
  windAlertThreshold: 40, // default 40 km/h
  uvAlertThreshold: 'very-high', // 8+
  tempAlertHigh: 38, // 38°C
  tempAlertLow: 5,   // 5°C
  aqiAlertThreshold: 150, // Unhealthy
  aqiAlertScale: 'US AQI',
  dailySummaryEnabled: true,
};

export const DEFAULT_HOME_WIDGETS: HomeWidgetConfig[] = [
  { id: 'current_weather', label: 'Current Weather', visible: true, order: 0 },
  { id: 'alerts_widget', label: 'Weather Alerts', visible: true, order: 1 },
  { id: 'today_summary', label: "Today's Weather Intelligence", visible: true, order: 2 },
  { id: 'hourly_forecast', label: 'Hourly Forecast (24h)', visible: true, order: 3 },
  { id: 'rain_timeline', label: 'Precipitation & Rain Track', visible: true, order: 4 },
  { id: 'wind_gauge', label: 'Wind Velocity & Compass', visible: true, order: 5 },
  { id: 'sun_cycle', label: 'Solar Arc & Daylight', visible: true, order: 6 },
  { id: 'uv_index', label: 'UV Radiation Index', visible: true, order: 7 },
  { id: 'aqi_card', label: 'Air Quality & Pollutants', visible: true, order: 8 },
  { id: 'temperature_metrics', label: 'Atmospheric Conditions Matrix', visible: true, order: 9 },
  { id: 'outdoor_score', label: 'Outdoor Comfort Score', visible: true, order: 10 },
  { id: 'favorites_quick', label: 'My Locations Quick Strip', visible: true, order: 11 }
];

export class StorageService {
  /**
   * Get all saved favorites (max 20)
   */
  static async getFavorites(): Promise<FavoriteLocationItem[]> {
    const list = await storageProvider.getItem<FavoriteLocationItem[]>(FAVORITES_KEY, []);
    // Normalize properties ensuring only allowed fields are preserved
    return list.slice(0, MAX_FAVORITES_COUNT).map((fav) => ({
      id: fav.id,
      city: fav.city || fav.name,
      name: fav.name || fav.city,
      region: fav.region || fav.state,
      state: fav.state || fav.region,
      country: fav.country,
      countryCode: fav.countryCode,
      latitude: fav.latitude,
      longitude: fav.longitude,
      timezone: fav.timezone || 'UTC',
      addedAt: fav.addedAt || new Date().toISOString(),
      lastUpdated: fav.lastUpdated || new Date().toISOString(),
      isDefault: !!fav.isDefault,
      isFavorite: true
    }));
  }

  static async saveFavorites(favorites: FavoriteLocationItem[]): Promise<void> {
    const sanitized = favorites.slice(0, MAX_FAVORITES_COUNT).map((f) => ({
      id: f.id,
      city: f.city || f.name,
      name: f.name || f.city,
      region: f.region || f.state || '',
      state: f.state || f.region || '',
      country: f.country,
      countryCode: f.countryCode || '',
      latitude: f.latitude,
      longitude: f.longitude,
      timezone: f.timezone || 'UTC',
      addedAt: f.addedAt || new Date().toISOString(),
      lastUpdated: f.lastUpdated || new Date().toISOString(),
      isDefault: !!f.isDefault,
      isFavorite: true
    }));
    await storageProvider.setItem(FAVORITES_KEY, sanitized);
  }

  static async addFavorite(location: LocationItem): Promise<{ favorites: FavoriteLocationItem[]; added: boolean; reason?: string }> {
    const list = await this.getFavorites();

    // Check maximum 20 limit
    if (list.length >= MAX_FAVORITES_COUNT) {
      return { favorites: list, added: false, reason: `Maximum of ${MAX_FAVORITES_COUNT} favorite locations reached.` };
    }

    // Check duplicate
    if (
      list.some(
        (f) =>
          f.id === location.id ||
          (Math.abs(f.latitude - location.latitude) < 0.02 && Math.abs(f.longitude - location.longitude) < 0.02)
      )
    ) {
      return { favorites: list, added: false, reason: 'Location is already in your favorites.' };
    }

    const now = new Date().toISOString();
    const newFavorite: FavoriteLocationItem = {
      id: location.id || `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`,
      city: location.name || location.city || 'Unknown',
      name: location.name || location.city || 'Unknown',
      region: location.state || location.region || '',
      state: location.state || location.region || '',
      country: location.country,
      countryCode: location.countryCode || '',
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || 'UTC',
      addedAt: now,
      lastUpdated: now,
      isDefault: list.length === 0, // First favorite becomes default automatically
      isFavorite: true
    };

    const updated = [...list, newFavorite];
    await this.saveFavorites(updated);
    return { favorites: updated, added: true };
  }

  static async removeFavorite(locationId: string): Promise<FavoriteLocationItem[]> {
    const list = await this.getFavorites();
    const updated = list.filter((f) => f.id !== locationId);
    // If the removed item was default and other favorites exist, make first one default
    const removedWasDefault = list.find((f) => f.id === locationId)?.isDefault;
    if (removedWasDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    await this.saveFavorites(updated);
    return updated;
  }

  static async reorderFavorites(newOrder: FavoriteLocationItem[]): Promise<FavoriteLocationItem[]> {
    await this.saveFavorites(newOrder);
    return newOrder;
  }

  static async setDefaultFavorite(locationId: string): Promise<FavoriteLocationItem[]> {
    const list = await this.getFavorites();
    const updated = list.map((f) => ({
      ...f,
      isDefault: f.id === locationId
    }));
    await this.saveFavorites(updated);

    // Also update settings defaultLocationId
    const settings = await this.getSettings();
    await this.saveSettings({ ...settings, defaultLocationId: locationId });

    return updated;
  }

  static async getSettings(): Promise<UserSettings> {
    return storageProvider.getItem<UserSettings>(SETTINGS_KEY, defaultSettings);
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    await storageProvider.setItem(SETTINGS_KEY, settings);
  }

  static async getLastLocation(): Promise<LocationItem | null> {
    return storageProvider.getItem<LocationItem | null>(LAST_LOCATION_KEY, null);
  }

  static async setLastLocation(loc: LocationItem): Promise<void> {
    await storageProvider.setItem(LAST_LOCATION_KEY, loc);
  }

  static async getCachedWeather(loc: LocationItem): Promise<WeatherCacheSnapshot | null> {
    const key = `${WEATHER_CACHE_PREFIX}${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}`;
    return storageProvider.getItem<WeatherCacheSnapshot | null>(key, null);
  }

  static async setCachedWeather(snapshot: WeatherCacheSnapshot): Promise<void> {
    const key = `${WEATHER_CACHE_PREFIX}${snapshot.location.latitude.toFixed(2)}_${snapshot.location.longitude.toFixed(2)}`;
    await storageProvider.setItem(key, snapshot);
  }

  // Home Widgets layout
  static async getHomeWidgets(): Promise<HomeWidgetConfig[]> {
    const stored = await storageProvider.getItem<HomeWidgetConfig[]>(HOME_WIDGETS_KEY, []);
    if (!stored || stored.length === 0) {
      return DEFAULT_HOME_WIDGETS;
    }
    // Merge with any newly added widgets in code
    const existingIds = new Set(stored.map((w) => w.id));
    const merged = [...stored];
    DEFAULT_HOME_WIDGETS.forEach((def) => {
      if (!existingIds.has(def.id)) {
        merged.push({ ...def, order: merged.length });
      }
    });
    return merged.sort((a, b) => a.order - b.order);
  }

  static async saveHomeWidgets(widgets: HomeWidgetConfig[]): Promise<void> {
    await storageProvider.setItem(HOME_WIDGETS_KEY, widgets);
  }

  // Notifications Store
  static async getNotifications(): Promise<NotificationItem[]> {
    return storageProvider.getItem<NotificationItem[]>(NOTIFICATION_ITEMS_KEY, []);
  }

  static async saveNotifications(items: NotificationItem[]): Promise<void> {
    // Keep last 50 notifications
    await storageProvider.setItem(NOTIFICATION_ITEMS_KEY, items.slice(0, 50));
  }

  static async addNotification(item: NotificationItem): Promise<NotificationItem[]> {
    const items = await this.getNotifications();
    const updated = [item, ...items.filter((i) => i.id !== item.id)].slice(0, 50);
    await this.saveNotifications(updated);
    return updated;
  }

  static async markNotificationRead(id: string): Promise<NotificationItem[]> {
    const items = await this.getNotifications();
    const updated = items.map((i) => (i.id === id ? { ...i, isRead: true } : i));
    await this.saveNotifications(updated);
    return updated;
  }

  static async markAllNotificationsRead(): Promise<NotificationItem[]> {
    const items = await this.getNotifications();
    const updated = items.map((i) => ({ ...i, isRead: true }));
    await this.saveNotifications(updated);
    return updated;
  }

  static async clearAllNotifications(): Promise<void> {
    await storageProvider.setItem(NOTIFICATION_ITEMS_KEY, []);
  }

  // Notification Rules
  static async getNotificationRules(): Promise<NotificationRule[]> {
    return storageProvider.getItem<NotificationRule[]>(NOTIFICATION_RULES_KEY, []);
  }

  static async saveNotificationRules(rules: NotificationRule[]): Promise<void> {
    await storageProvider.setItem(NOTIFICATION_RULES_KEY, rules);
  }

  // Notification Trigger Fingerprints (for deduplication & condition recovery)
  static async getNotificationFingerprints(): Promise<Record<string, { lastTriggeredAt: number; status: string }>> {
    return storageProvider.getItem<Record<string, { lastTriggeredAt: number; status: string }>>(
      NOTIFICATION_FINGERPRINTS_KEY,
      {}
    );
  }

  static async saveNotificationFingerprints(fps: Record<string, { lastTriggeredAt: number; status: string }>): Promise<void> {
    await storageProvider.setItem(NOTIFICATION_FINGERPRINTS_KEY, fps);
  }

  // PWA Install prompt dismissal
  static async isInstallPromptDismissed(): Promise<boolean> {
    return storageProvider.getItem<boolean>(INSTALL_PROMPT_DISMISSED_KEY, false);
  }

  static async setInstallPromptDismissed(dismissed: boolean): Promise<void> {
    await storageProvider.setItem(INSTALL_PROMPT_DISMISSED_KEY, dismissed);
  }

  static async getReadAlertIds(): Promise<string[]> {
    return storageProvider.getItem<string[]>(READ_ALERTS_KEY, []);
  }

  static async markAlertAsRead(alertId: string): Promise<string[]> {
    const list = await this.getReadAlertIds();
    if (!list.includes(alertId)) {
      const updated = [...list, alertId];
      await storageProvider.setItem(READ_ALERTS_KEY, updated);
      return updated;
    }
    return list;
  }

  static async getDismissedAlertIds(): Promise<string[]> {
    return storageProvider.getItem<string[]>(DISMISSED_ALERTS_KEY, []);
  }

  static async dismissAlert(alertId: string): Promise<string[]> {
    const list = await this.getDismissedAlertIds();
    if (!list.includes(alertId)) {
      const updated = [...list, alertId];
      await storageProvider.setItem(DISMISSED_ALERTS_KEY, updated);
      return updated;
    }
    return list;
  }

  static async clearAll(): Promise<void> {
    await storageProvider.clear();
  }
}

