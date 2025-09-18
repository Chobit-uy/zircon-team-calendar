import { Holiday } from '@/types';
import { GOOGLE_APPS_SCRIPT_URL } from '@/config/constants';

interface HolidayResponse {
  holidays: Array<{
    nombre: string;
    fecha: string;
    ambito: string;
    rowIndex: string;
  }>;
}

class HolidayService {
  private holidaysCache: Holiday[] | null = null;

  async getHolidays(): Promise<Holiday[]> {
    if (this.holidaysCache) {
      return this.holidaysCache;
    }
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?type=holidays`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: any = await response.json();
      // data es un array de arrays: [[headers], [row1], [row2], ...]
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error('Formato de datos inválido');
      }
      const [headers, ...rows] = data;
      const holidays = rows.map((row: any[]) => {
        const obj: any = Object.fromEntries(headers.map((header: string, i: number) => [header, row[i]]));
        // Normalizar scope
        let scope: Holiday['scope'] = 'Otro';
        if (obj.ambito === 'Nacional') scope = 'Nacional';
        else if (obj.ambito === 'Empresa') scope = 'Empresa';
        else if (obj.ambito === 'Local/Regional' || obj.ambito === 'local' || obj.ambito === 'Local') scope = 'Local/Regional';
        return {
          id: obj.rowIndex?.toString() || Math.random().toString(36).substr(2, 9),
          name: obj.nombre || '',
          date: obj.fecha || '',
          scope,
          createdBy: 'admin@zircon.tech',
          createdAt: new Date().toISOString(),
          rowIndex: obj.rowIndex
        };
      });
      this.holidaysCache = holidays;
      return holidays;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw new Error('No se pudieron cargar los feriados desde Google Sheets');
    }
  }
}

export const holidayService = new HolidayService();