import { TimeOffEntry } from '@/types';
import { GOOGLE_APPS_SCRIPT_URL, GOOGLE_FORM_URL } from '@/config/constants';

const CACHE_KEY = 'timeOffEntriesCache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

type CachePayload = {
  timestamp: number;
  data: TimeOffEntry[];
};

class GoogleSheetsService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private getCachedEntries(): TimeOffEntry[] | null {
    if (!this.isBrowser()) return null;
    try {
      const cacheRaw = window.localStorage.getItem(CACHE_KEY);
      if (!cacheRaw) return null;

      const cache = JSON.parse(cacheRaw) as Partial<CachePayload> | null;
      if (
        !cache ||
        typeof cache.timestamp !== 'number' ||
        !Array.isArray(cache.data)
      ) {
        return null;
      }

      const isExpired = Date.now() - cache.timestamp > CACHE_TTL_MS;
      if (isExpired) {
        window.localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cache.data;
    } catch (error) {
      console.warn('Error reading cached time off entries:', error);
      return null;
    }
  }

  private setCachedEntries(entries: TimeOffEntry[]): void {
    if (!this.isBrowser()) return;
    try {
      const payload: CachePayload = {
        timestamp: Date.now(),
        data: entries,
      };
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Error caching time off entries:', error);
    }
  }

  clearTimeOffEntriesCache(): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Error clearing time off entries cache:', error);
    }
  }

  // Obtiene los datos desde Google Sheets usando fetch
  async getTimeOffEntries(): Promise<TimeOffEntry[]> {
    try {
      const cachedEntries = this.getCachedEntries();
      if (cachedEntries) {
        return cachedEntries;
      }

      const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?type=vacations`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = (await response.json()) as TimeOffEntry[];
      this.setCachedEntries(data);
      // Se asume que el endpoint retorna un array de TimeOffEntry
      return data;
    } catch (error) {
      console.error('Error fetching time off entries:', error);
      return [];
    }
  }

  // En producción, esto actualizaría automáticamente cuando el Google Form se actualice
  async syncWithGoogleForm(): Promise<boolean> {
    try {
      // Aquí iría la lógica para sincronizar con Google Sheets
      console.log('Syncing with Google Form...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.clearTimeOffEntriesCache();
      return true;
    } catch (error) {
      console.error('Error syncing with Google Form:', error);
      return false;
    }
  }

  // URL del Google Form proporcionado
  getGoogleFormUrl(): string {
    return GOOGLE_FORM_URL;
  }
}

export const googleSheetsService = new GoogleSheetsService();