/**
 * Centralized Weather Data Cache Manager
 * Implements configurable TTL policies, stale-while-revalidate, and offline persistence.
 */

export type CacheDataType = 'current' | 'hourly' | 'daily' | 'airquality' | 'multi' | 'alerts';

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number; // epoch ms
  cachedAtIso: string;
  source: string;
  timezone?: string;
  ttlMs: number;
}

// Configurable Cache Expiration Policies (TTL in milliseconds)
export const DEFAULT_TTL_POLICIES: Record<CacheDataType, number> = {
  current: 15 * 60 * 1000,    // 15 minutes (short TTL)
  hourly: 30 * 60 * 1000,     // 30 minutes (moderate TTL)
  daily: 60 * 60 * 1000,      // 60 minutes (moderate TTL)
  airquality: 45 * 60 * 1000, // 45 minutes (moderate TTL)
  multi: 20 * 60 * 1000,      // 20 minutes for favorite city multi-cards
  alerts: 15 * 60 * 1000      // 15 minutes
};

class CacheManagerClass {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private storagePrefix = 'weather_central_cache_';

  public generateKey(lat: number, lon: number, units: string, dataType: CacheDataType): string {
    const latFixed = Number(lat).toFixed(2);
    const lonFixed = Number(lon).toFixed(2);
    return `${latFixed}_${lonFixed}_${units}_${dataType}`;
  }

  public get<T>(key: string): CacheEntry<T> | null {
    // 1. Check in-memory cache first for zero-lag instant lookups
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as CacheEntry<T>;
    }

    // 2. Check localStorage for persistent offline availability
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const itemStr = localStorage.getItem(this.storagePrefix + key);
        if (itemStr) {
          const entry = JSON.parse(itemStr) as CacheEntry<T>;
          this.memoryCache.set(key, entry);
          return entry;
        }
      } catch (e) {
        console.warn(`[CacheManager] Failed to retrieve key ${key} from storage:`, e);
      }
    }

    return null;
  }

  public set<T>(
    key: string,
    data: T,
    dataType: CacheDataType = 'current',
    source: string = 'Open-Meteo',
    timezone?: string,
    customTtlMs?: number
  ): void {
    const ttlMs = customTtlMs ?? DEFAULT_TTL_POLICIES[dataType] ?? 30 * 60 * 1000;
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      cachedAtIso: new Date(now).toISOString(),
      source,
      timezone,
      ttlMs
    };

    // Store in-memory
    this.memoryCache.set(key, entry);

    // Persist to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(entry));
      } catch (e) {
        // In case of quota exceeded, prune oldest items
        console.warn(`[CacheManager] Storage write failed for key ${key}. Pruning old entries.`, e);
        this.pruneStaleEntries();
      }
    }
  }

  public isFresh(entry: CacheEntry<any> | null): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttlMs;
  }

  public isStale(entry: CacheEntry<any> | null): boolean {
    if (!entry) return true;
    return !this.isFresh(entry);
  }

  public remove(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(this.storagePrefix + key);
      } catch (e) {
        console.warn(`[CacheManager] Failed to remove key ${key}:`, e);
      }
    }
  }

  public clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(this.storagePrefix))
          .forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('[CacheManager] Failed to clear localStorage cache:', e);
      }
    }
  }

  public pruneStaleEntries(): void {
    const now = Date.now();
    // Prune in-memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttlMs * 2) {
        this.memoryCache.delete(key);
      }
    }

    // Prune localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(this.storagePrefix))
          .forEach((k) => {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const entry = JSON.parse(raw);
                if (now - entry.timestamp > (entry.ttlMs || 3600000) * 2) {
                  localStorage.removeItem(k);
                }
              }
            } catch {
              localStorage.removeItem(k);
            }
          });
      } catch (e) {
        console.warn('[CacheManager] Prune error:', e);
      }
    }
  }
}

export const CacheManager = new CacheManagerClass();
