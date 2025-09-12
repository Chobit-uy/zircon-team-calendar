import { Holiday } from '@/types';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/a/macros/zircon.tech/s/AKfycby7PGv445MKUswcEuzBwCCEeL9OMH7lGEjzcFWiLvN1VC7Om8u3Sgrr6TW1Y9qC3LYX/exec';

interface HolidayResponse {
  holidays: Array<{
    nombre: string;
    fecha: string;
    ambito: string;
    rowIndex: number;
  }>;
}

class HolidayService {
  async getHolidays(): Promise<Holiday[]> {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: HolidayResponse = await response.json();
      
      return data.holidays.map(holiday => ({
        id: holiday.rowIndex.toString(),
        name: holiday.nombre,
        date: holiday.fecha,
        scope: holiday.ambito as Holiday['scope'],
        createdBy: 'admin@zircon.tech',
        createdAt: new Date().toISOString(),
        rowIndex: holiday.rowIndex
      }));
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw new Error('No se pudieron cargar los feriados desde Google Sheets');
    }
  }

  async addHoliday(holiday: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          nombre: holiday.name,
          fecha: holiday.date,
          ambito: holiday.scope
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        ...holiday,
        id: result.rowIndex?.toString() || Date.now().toString(),
        createdAt: new Date().toISOString(),
        rowIndex: result.rowIndex
      };
    } catch (error) {
      console.error('Error adding holiday:', error);
      throw new Error('No se pudo agregar el feriado');
    }
  }

  async deleteHoliday(rowIndex: number): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          rowIndex: rowIndex
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting holiday:', error);
      throw new Error('No se pudo eliminar el feriado');
    }
  }
}

export const holidayService = new HolidayService();