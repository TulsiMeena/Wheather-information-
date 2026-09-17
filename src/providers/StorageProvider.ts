/**
 * StorageProvider Interface & Implementation
 * Handles local persistence with support for future cloud/Firebase sync in Prompt 3+.
 */
export interface IStorageProvider {
  getItem<T>(key: string, defaultValue: T): Promise<T>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class LocalStorageProvider implements IStorageProvider {
  private prefix = 'weather_intelligence_';

  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const raw = localStorage.getItem(this.prefix + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[StorageProvider] Failed to read key "${key}":`, e);
      return defaultValue;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`[StorageProvider] Failed to set key "${key}":`, e);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.prefix + key);
      }
    } catch (e) {
      console.warn(`[StorageProvider] Failed to remove key "${key}":`, e);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage)
          .filter(k => k.startsWith(this.prefix))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('[StorageProvider] Failed to clear storage:', e);
    }
  }
}

export const storageProvider: IStorageProvider = new LocalStorageProvider();
