import { locationProvider } from '../providers/LocationProvider';
import { LocationItem } from '../types/weather';

export class LocationService {
  static async getCurrentLocation(): Promise<LocationItem | null> {
    return locationProvider.getCurrentLocation();
  }

  static async searchLocations(query: string): Promise<LocationItem[]> {
    return locationProvider.searchLocations(query);
  }

  static async getRecentSearches(): Promise<LocationItem[]> {
    return locationProvider.getRecentSearches();
  }

  static async saveRecentSearch(item: LocationItem): Promise<void> {
    return locationProvider.saveRecentSearch(item);
  }

  static async removeRecentSearch(id: string): Promise<void> {
    return locationProvider.removeRecentSearch(id);
  }

  static async clearRecentSearches(): Promise<void> {
    return locationProvider.clearRecentSearches();
  }
}
