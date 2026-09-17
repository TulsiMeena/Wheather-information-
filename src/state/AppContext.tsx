import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationItem,
  FavoriteLocationItem,
  FavoriteWeatherSnapshot,
  ThemeMode,
  ToastMessage,
  UserSettings,
  WeatherAlert,
  WeatherDataState,
  DataFreshness,
  NotificationItem,
  HomeWidgetConfig,
  HomeWidgetId
} from '../types/weather';
import { StorageService, defaultSettings, DEFAULT_HOME_WIDGETS, MAX_FAVORITES_COUNT } from '../services/storageService';
import { WeatherService } from '../services/weatherService';
import { LocationService } from '../services/locationService';
import { CacheManager } from '../services/cache/CacheManager';
import { MultiLocationService } from '../services/multiLocationService';
import { NotificationService } from '../services/notifications/NotificationService';

export type NavigationPage =
  | 'home'
  | 'hourly'
  | 'forecast'
  | 'details'
  | 'map'
  | 'history'
  | 'airquality'
  | 'alerts'
  | 'assistant'
  | 'favorites'
  | 'settings';

export const DEFAULT_INITIAL_LOCATION: LocationItem = {
  id: 'jaipur-in',
  name: 'Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  region: 'Rajasthan',
  country: 'India',
  countryCode: 'IN',
  latitude: 26.9124,
  longitude: 75.7873,
  timezone: 'Asia/Kolkata'
};

interface AppContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  currentLocation: LocationItem | null;
  setCurrentLocation: (loc: LocationItem) => void;
  currentWeather: CurrentWeather | null;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
  airQuality: AirQualityData | null;
  alerts: WeatherAlert[];
  readAlertIds: string[];
  dismissedAlertIds: string[];
  markAlertAsRead: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  favorites: FavoriteLocationItem[];
  favoriteSnapshots: Record<string, FavoriteWeatherSnapshot>;
  isLoadingFavorites: boolean;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  addFavorite: (loc: LocationItem) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  reorderFavorites: (newOrder: FavoriteLocationItem[]) => Promise<void>;
  setDefaultFavorite: (id: string) => Promise<void>;
  refreshFavoriteCity: (id: string) => Promise<void>;
  refreshAllFavorites: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  showLocationPrompt: boolean;
  dismissLocationPrompt: (rememberChoice?: boolean) => void;
  isLoading: boolean;
  dataState: WeatherDataState;
  weatherFreshness: DataFreshness;
  airQualityFreshness: DataFreshness;
  isOffline: boolean;
  isCached: boolean;
  cachedAt: string | null;
  lastUpdated: string | null;
  error: string | null;
  airQualityError: string | null;
  refreshData: (force?: boolean) => Promise<void>;
  detectDeviceLocation: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  // Notifications Center
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  notificationPermission: 'granted' | 'denied' | 'default' | 'unsupported';
  requestNotificationPermission: () => Promise<void>;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  // Home Widgets
  homeWidgets: HomeWidgetConfig[];
  updateHomeWidgets: (widgets: HomeWidgetConfig[]) => Promise<void>;
  resetHomeWidgets: () => Promise<void>;
  toggleWidgetVisibility: (id: HomeWidgetId) => Promise<void>;
  moveWidget: (id: HomeWidgetId, direction: 'up' | 'down') => Promise<void>;
  isCustomizeWidgetsOpen: boolean;
  setIsCustomizeWidgetsOpen: (open: boolean) => void;
  // Diagnostics Center
  isDiagnosticsOpen: boolean;
  setIsDiagnosticsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [currentLocation, setCurrentLocationState] = useState<LocationItem | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastItem[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteLocationItem[]>([]);
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<Record<string, FavoriteWeatherSnapshot>>({});
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataState, setDataState] = useState<WeatherDataState>('NO_DATA');
  const [weatherFreshness, setWeatherFreshness] = useState<DataFreshness>('unavailable');
  const [airQualityFreshness, setAirQualityFreshness] = useState<DataFreshness>('unavailable');
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [airQualityError, setAirQualityError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(
    NotificationService.getPermissionStatus()
  );

  // Home Widgets
  const [homeWidgets, setHomeWidgets] = useState<HomeWidgetConfig[]>(DEFAULT_HOME_WIDGETS);
  const [isCustomizeWidgetsOpen, setIsCustomizeWidgetsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const activeFetchPromiseRef = useRef<Promise<void> | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Toast system
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id, duration: toast.duration || 4000 };
    setToasts((prev) => [...prev, newToast]);
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme synchronization with DOM
  const applyTheme = useCallback((theme: ThemeMode) => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, []);

  // Network offline/online listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast({
        type: 'success',
        title: 'Connection Restored',
        message: 'Back online. Real-time data stream re-enabled.'
      });
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDataState((prev) => (prev === 'SUCCESS' ? 'OFFLINE' : prev));
      setWeatherFreshness('cached');
      setAirQualityFreshness('cached');
      addToast({
        type: 'warning',
        title: 'Offline Mode',
        message: 'No internet connection. Displaying verified local cache.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Initialize Settings, Favorites, Location, Widgets, Notifications
  useEffect(() => {
    async function init() {
      try {
        const storedSettings = await StorageService.getSettings();
        setSettings(storedSettings);
        applyTheme(storedSettings.theme);

        const [storedFavorites, storedWidgets, storedNotifs] = await Promise.all([
          StorageService.getFavorites(),
          StorageService.getHomeWidgets(),
          StorageService.getNotifications()
        ]);
        setFavorites(storedFavorites);
        setHomeWidgets(storedWidgets);
        setNotifications(storedNotifs);

        const [readIds, dismissedIds] = await Promise.all([
          StorageService.getReadAlertIds(),
          StorageService.getDismissedAlertIds()
        ]);
        setReadAlertIds(readIds);
        setDismissedAlertIds(dismissedIds);

        // Check if there is a Default Favorite configured
        let initialLoc: LocationItem | null = null;
        if (storedSettings.defaultLocationId && storedFavorites.length > 0) {
          const defFav = storedFavorites.find((f) => f.id === storedSettings.defaultLocationId || f.isDefault);
          if (defFav) {
            initialLoc = defFav;
          }
        }

        if (!initialLoc) {
          const lastLoc = await StorageService.getLastLocation();
          if (lastLoc) {
            initialLoc = lastLoc;
          } else {
            if (storedSettings.locationPermission === 'prompt') {
              setShowLocationPrompt(true);
            }
            initialLoc = DEFAULT_INITIAL_LOCATION;
          }
        }

        setCurrentLocationState(initialLoc);
      } catch (e) {
        console.error('Initialization error:', e);
        setCurrentLocationState(DEFAULT_INITIAL_LOCATION);
      }
    }
    init();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      StorageService.getSettings().then((s) => {
        if (s.theme === 'system') applyTheme('system');
      });
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [applyTheme]);

  // Update Settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
    await StorageService.saveSettings(updated);
    addToast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your settings have been saved locally.'
    });
  };

  const dismissLocationPrompt = useCallback((rememberChoice: boolean = true) => {
    setShowLocationPrompt(false);
    if (rememberChoice) {
      updateSettings({ locationPermission: 'denied' });
    }
  }, [updateSettings]);

  // Set Location and persist
  const setCurrentLocation = (loc: LocationItem) => {
    setCurrentLocationState(loc);
    setAlerts([]); // Clear previous location's active alerts immediately
    StorageService.setLastLocation(loc);
  };

  // Favorites management
  const addFavorite = async (loc: LocationItem) => {
    const result = await StorageService.addFavorite(loc);
    setFavorites(result.favorites);
    if (result.added) {
      addToast({
        type: 'success',
        title: 'Location Saved',
        message: `${loc.name} added to your favorite locations.`
      });
      // Fetch snapshot for this newly added favorite
      const snap = await MultiLocationService.fetchCitySnapshot(
        result.favorites.find((f) => f.id === loc.id) || (loc as any),
        settings.tempUnit
      );
      setFavoriteSnapshots((prev) => ({ ...prev, [loc.id]: snap }));
    } else {
      addToast({
        type: 'warning',
        title: 'Favorites Limit',
        message: result.reason || `Maximum of ${MAX_FAVORITES_COUNT} favorite locations allowed.`
      });
    }
  };

  const removeFavorite = async (id: string) => {
    const updated = await StorageService.removeFavorite(id);
    setFavorites(updated);
    setFavoriteSnapshots((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    addToast({
      type: 'info',
      title: 'Location Removed',
      message: 'Removed from favorite locations.'
    });
  };

  const reorderFavorites = async (newOrder: FavoriteLocationItem[]) => {
    setFavorites(newOrder);
    await StorageService.reorderFavorites(newOrder);
  };

  const setDefaultFavorite = async (id: string) => {
    const updated = await StorageService.setDefaultFavorite(id);
    setFavorites(updated);
    const def = updated.find((f) => f.id === id);
    addToast({
      type: 'success',
      title: 'Default Location Set',
      message: `${def ? def.city : 'City'} set as default location on app launch.`
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some((f) => f.id === id);
  };

  // Multi-location favorites fetching
  const refreshFavoriteCity = async (id: string) => {
    const loc = favorites.find((f) => f.id === id);
    if (!loc) return;
    setFavoriteSnapshots((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), status: 'loading' } as FavoriteWeatherSnapshot
    }));
    const snap = await MultiLocationService.fetchCitySnapshot(loc, settings.tempUnit, true);
    setFavoriteSnapshots((prev) => ({ ...prev, [id]: snap }));
  };

  const refreshAllFavorites = useCallback(async () => {
    if (favorites.length === 0) return;
    setIsLoadingFavorites(true);
    try {
      const snaps = await MultiLocationService.fetchAllCities(favorites, settings.tempUnit, true);
      setFavoriteSnapshots(snaps);
    } catch (e) {
      console.warn('Failed to refresh all favorites:', e);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [favorites, settings.tempUnit]);

  // Load favorite snapshots on initial load or change
  useEffect(() => {
    if (favorites.length > 0) {
      MultiLocationService.fetchAllCities(favorites, settings.tempUnit, false).then((snaps) => {
        setFavoriteSnapshots(snaps);
      });
    }
  }, [favorites.length, settings.tempUnit]);

  // Alert interactions
  const markAlertAsRead = async (id: string) => {
    const updated = await StorageService.markAlertAsRead(id);
    setReadAlertIds(updated);
  };

  const dismissAlert = async (id: string) => {
    const updated = await StorageService.dismissAlert(id);
    setDismissedAlertIds(updated);
    addToast({
      type: 'info',
      title: 'Alert Dismissed',
      message: 'Informational alert dismissed.'
    });
  };

  // Notification Center interactions
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = async (id: string) => {
    const updated = await StorageService.markNotificationRead(id);
    setNotifications(updated);
  };

  const markAllNotificationsAsRead = async () => {
    const updated = await StorageService.markAllNotificationsRead();
    setNotifications(updated);
    addToast({
      type: 'success',
      title: 'Notifications',
      message: 'All notifications marked as read.'
    });
  };

  const clearAllNotifications = async () => {
    await StorageService.clearAllNotifications();
    setNotifications([]);
    addToast({
      type: 'info',
      title: 'Notifications Cleared',
      message: 'Notification center history cleared.'
    });
  };

  const requestNotificationPermission = async () => {
    const res = await NotificationService.requestPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      addToast({
        type: 'success',
        title: 'Notifications Enabled',
        message: 'You will receive meteorological notices and severe weather warnings.'
      });
    } else if (res === 'denied') {
      addToast({
        type: 'warning',
        title: 'Permission Denied',
        message: 'Browser notification permission was blocked. You can still view notices in-app.'
      });
    }
  };

  // Home Widgets customization
  const updateHomeWidgets = async (widgets: HomeWidgetConfig[]) => {
    setHomeWidgets(widgets);
    await StorageService.saveHomeWidgets(widgets);
  };

  const resetHomeWidgets = async () => {
    setHomeWidgets(DEFAULT_HOME_WIDGETS);
    await StorageService.saveHomeWidgets(DEFAULT_HOME_WIDGETS);
    addToast({
      type: 'info',
      title: 'Layout Reset',
      message: 'Home dashboard widgets reset to default order.'
    });
  };

  const toggleWidgetVisibility = async (id: HomeWidgetId) => {
    const updated = homeWidgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    await updateHomeWidgets(updated);
  };

  const moveWidget = async (id: HomeWidgetId, direction: 'up' | 'down') => {
    const idx = homeWidgets.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= homeWidgets.length) return;

    const copy = [...homeWidgets];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);

    const reordered = copy.map((w, index) => ({ ...w, order: index }));
    await updateHomeWidgets(reordered);
  };

  // Fetch / Refresh data through Provider abstraction with CacheManager & Notification Rules Evaluation
  const refreshData = useCallback(async (force: boolean = false) => {
    if (!currentLocation) {
      setDataState('NO_DATA');
      return;
    }

    if (activeFetchPromiseRef.current && !force) {
      return activeFetchPromiseRef.current;
    }

    // Cancel previous inflight controller if forcing refresh
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    activeAbortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setAirQualityError(null);
    setDataState((prev) => (prev === 'NO_DATA' ? 'LOADING' : prev));

    const fetchPromise = (async () => {
      try {
        // Offline handling
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const cached = await StorageService.getCachedWeather(currentLocation);
          if (cached) {
            setCurrentWeather({ ...cached.currentWeather, isCached: true });
            setHourlyForecast(cached.hourlyForecast || []);
            setDailyForecast(cached.dailyForecast || []);
            setAlerts(cached.alerts || []);
            setAirQuality(cached.airQuality || null);
            setIsCached(true);
            setCachedAt(cached.cachedAt);
            setLastUpdated(cached.cachedAt);
            setWeatherFreshness('cached');
            setAirQualityFreshness('cached');
            setDataState('OFFLINE');
            return;
          } else {
            throw new Error('You are currently offline, and no cached weather data is available for this location.');
          }
        }

        // Centralized Cache check (unless force refresh requested)
        const weatherCacheKey = CacheManager.generateKey(currentLocation.latitude, currentLocation.longitude, settings.tempUnit, 'current');
        const cachedEntry = CacheManager.get<CurrentWeather>(weatherCacheKey);

        const isDataSaver = settings.dataUsageMode === 'saver';

        // Decoupled parallel execution for Weather and Air Quality
        const [weatherResult, hourlyResult, dailyResult, aqiResult] = await Promise.allSettled([
          WeatherService.getCurrentWeather(currentLocation.latitude, currentLocation.longitude),
          WeatherService.getHourlyForecast(currentLocation.latitude, currentLocation.longitude),
          WeatherService.getDailyForecast(currentLocation.latitude, currentLocation.longitude),
          // In Data Saver mode, we avoid AQI if not necessary unless forced
          isDataSaver && !force && airQuality
            ? Promise.resolve(airQuality)
            : WeatherService.getAirQuality(currentLocation.latitude, currentLocation.longitude)
        ]);

        const fetchedWeather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
        const fetchedHourly = hourlyResult.status === 'fulfilled' ? hourlyResult.value : [];
        const fetchedDaily = dailyResult.status === 'fulfilled' ? dailyResult.value : [];
        const fetchedAqi = aqiResult.status === 'fulfilled' ? aqiResult.value : null;

        const nowIso = new Date().toISOString();

        // 1. Evaluate Weather success/failure
        if (fetchedWeather) {
          setCurrentWeather(fetchedWeather);
          setHourlyForecast(fetchedHourly);
          setDailyForecast(fetchedDaily);
          setWeatherFreshness('fresh');
          setDataState('SUCCESS');
          setIsCached(false);
          setCachedAt(null);
          setLastUpdated(nowIso);

          // Update Central Cache
          CacheManager.set(weatherCacheKey, fetchedWeather, 'current', 'Open-Meteo', currentLocation.timezone);
        } else {
          setWeatherFreshness('unavailable');
          if (weatherResult.status === 'rejected') {
            setError(weatherResult.reason?.message || 'Weather data temporarily unavailable.');
          }
        }

        // 2. Evaluate Air Quality success/failure (Independent resilience)
        if (fetchedAqi) {
          setAirQuality(fetchedAqi);
          setAirQualityFreshness('fresh');
        } else {
          setAirQualityFreshness('unavailable');
          if (aqiResult.status === 'rejected') {
            setAirQualityError('Air quality telemetry temporarily unavailable.');
          }
        }

        // 3. Location-Specific Weather Alert generation
        let generatedAlerts: WeatherAlert[] = [];
        if (fetchedWeather) {
          generatedAlerts = await WeatherService.getWeatherAlerts(
            currentLocation,
            fetchedWeather,
            fetchedDaily,
            fetchedHourly,
            fetchedAqi
          );
          setAlerts(generatedAlerts);
        } else {
          setAlerts([]);
        }

        // 4. Smart Weather Triggers & Notification Rules Evaluation
        if (fetchedWeather && settings.notifications) {
          NotificationService.evaluateRules(
            currentLocation,
            fetchedWeather,
            fetchedDaily,
            fetchedHourly,
            fetchedAqi,
            settings
          ).then((newNotifs) => {
            if (newNotifs.length > 0) {
              StorageService.getNotifications().then((all) => setNotifications(all));
            }
          });
        }

        // Persist snapshot to local cache
        if (fetchedWeather) {
          await StorageService.setCachedWeather({
            location: currentLocation,
            currentWeather: fetchedWeather,
            hourlyForecast: fetchedHourly,
            dailyForecast: fetchedDaily,
            alerts: generatedAlerts,
            airQuality: fetchedAqi,
            cachedAt: nowIso
          });
        }
      } catch (err: unknown) {
        console.warn('Refresh error:', err);
        const cached = await StorageService.getCachedWeather(currentLocation);
        if (cached) {
          setCurrentWeather({ ...cached.currentWeather, isCached: true });
          setHourlyForecast(cached.hourlyForecast || []);
          setDailyForecast(cached.dailyForecast || []);
          setAlerts(cached.alerts || []);
          setAirQuality(cached.airQuality || null);
          setIsCached(true);
          setCachedAt(cached.cachedAt);
          setLastUpdated(cached.cachedAt);
          setWeatherFreshness('cached');
          setAirQualityFreshness('cached');
          setDataState('OFFLINE');
          addToast({
            type: 'warning',
            title: 'Offline Fallback',
            message: `Could not reach live API. Showing cached records from ${new Date(cached.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          });
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Weather data is temporarily unavailable.';
          setError(errorMsg);
          setDataState('ERROR');
          setWeatherFreshness('unavailable');
          setAirQualityFreshness('unavailable');
        }
      } finally {
        setIsLoading(false);
        activeFetchPromiseRef.current = null;
      }
    })();

    activeFetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [currentLocation, addToast, settings, airQuality]);

  // Refresh whenever currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      refreshData();
    }
  }, [currentLocation, refreshData]);

  // Auto-refresh interval (15, 30, 60 minutes, or 0 for manual)
  useEffect(() => {
    if (!settings.refreshIntervalMinutes || settings.refreshIntervalMinutes <= 0) return;
    const intervalMs = settings.refreshIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      // Pause if document hidden or offline or data saver is active and user is idle
      if (document.visibilityState === 'visible' && navigator.onLine) {
        refreshData(true);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [settings.refreshIntervalMinutes, refreshData]);

  // Request device location
  const detectDeviceLocation = async () => {
    setIsLoading(true);
    try {
      const detected = await LocationService.getCurrentLocation();
      if (detected) {
        setCurrentLocation(detected);
        await updateSettings({ locationPermission: 'granted' });
        addToast({
          type: 'success',
          title: 'Location Detected',
          message: `${detected.name}${detected.state ? `, ${detected.state}` : ''}, ${detected.country}`
        });
      } else {
        addToast({
          type: 'info',
          title: 'Location Access',
          message: 'Could not access GPS coordinates. You can select a city manually.'
        });
      }
    } catch (e: any) {
      console.warn('Location detection failed', e);
      addToast({
        type: 'warning',
        title: 'Location Note',
        message: e?.message || 'Location access was not completed. You can search manually.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        currentLocation,
        setCurrentLocation,
        currentWeather,
        hourlyForecast,
        dailyForecast,
        airQuality,
        alerts,
        readAlertIds,
        dismissedAlertIds,
        markAlertAsRead,
        dismissAlert,
        favorites,
        favoriteSnapshots,
        isLoadingFavorites,
        settings,
        updateSettings,
        addFavorite,
        removeFavorite,
        reorderFavorites,
        setDefaultFavorite,
        refreshFavoriteCity,
        refreshAllFavorites,
        isFavorite,
        isSearchOpen,
        setIsSearchOpen,
        showLocationPrompt,
        dismissLocationPrompt,
        isLoading,
        dataState,
        weatherFreshness,
        airQualityFreshness,
        isOffline,
        isCached,
        cachedAt,
        lastUpdated,
        error,
        airQualityError,
        refreshData,
        detectDeviceLocation,
        toasts,
        addToast,
        removeToast,
        // Notifications Center
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        notificationPermission,
        requestNotificationPermission,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        // Home Widgets
        homeWidgets,
        updateHomeWidgets,
        resetHomeWidgets,
        toggleWidgetVisibility,
        moveWidget,
        isCustomizeWidgetsOpen,
        setIsCustomizeWidgetsOpen,
        // Diagnostics
        isDiagnosticsOpen,
        setIsDiagnosticsOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

