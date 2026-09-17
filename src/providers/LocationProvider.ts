import { LocationItem } from '../types/weather';
import { storageProvider } from './StorageProvider';

/**
 * LocationProvider Interface
 * Designed for device GPS and Open-Meteo Geocoding API in Prompt 2.
 */
export interface ILocationProvider {
  id: string;
  name: string;
  getCurrentLocation(): Promise<LocationItem | null>;
  searchLocations(query: string): Promise<LocationItem[]>;
  getRecentSearches(): Promise<LocationItem[]>;
  saveRecentSearch(item: LocationItem): Promise<void>;
  removeRecentSearch(id: string): Promise<void>;
  clearRecentSearches(): Promise<void>;
}

export class FoundationLocationProvider implements ILocationProvider {
  id = 'foundation_location';
  name = 'Location Service Provider';

  async getCurrentLocation(): Promise<LocationItem | null> {
    return null;
  }

  async searchLocations(_query: string): Promise<LocationItem[]> {
    return [];
  }

  async getRecentSearches(): Promise<LocationItem[]> {
    return storageProvider.getItem<LocationItem[]>('recent_searches', []);
  }

  async saveRecentSearch(item: LocationItem): Promise<void> {
    const list = await this.getRecentSearches();
    const filtered = list.filter((i) => i.id !== item.id && (i.latitude !== item.latitude || i.longitude !== item.longitude));
    const updated = [item, ...filtered].slice(0, 8);
    await storageProvider.setItem('recent_searches', updated);
  }

  async removeRecentSearch(id: string): Promise<void> {
    const list = await this.getRecentSearches();
    const updated = list.filter((i) => i.id !== id);
    await storageProvider.setItem('recent_searches', updated);
  }

  async clearRecentSearches(): Promise<void> {
    await storageProvider.setItem('recent_searches', []);
  }
}

import { OpenMeteoLocationProvider } from './OpenMeteoLocationProvider';

export const locationProvider: ILocationProvider = new OpenMeteoLocationProvider();

