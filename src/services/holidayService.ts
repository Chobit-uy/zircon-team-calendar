import { Holiday } from '@/types';
import { API_BASE_URL } from '@/config/constants';

class HolidayService {
  private holidaysCache: Holiday[] | null = null;

  async getHolidays(): Promise<Holiday[]> {
    if (this.holidaysCache) {
      return this.holidaysCache;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/holidays`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Holiday[] = await response.json();
      this.holidaysCache = data;
      return data;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw new Error('No se pudieron cargar los feriados');
    }
  }
}

export const holidayService = new HolidayService();
