import { Holiday } from '@/types';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4nvk9gsxZIyNYzQx2_dXEF-51-Qg4jl975Bl_Wc3XB8S4hmNZrItsIA8u3hDOLcC8/exec';

interface HolidayResponse {
  holidays: Array<{
    nombre: string;
    fecha: string;
    ambito: string;
    rowIndex: string;
  }>;
}

class HolidayService {
  async getHolidays(): Promise<Holiday[]> {
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
      return holidays;
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
          rowIndex: Date.now().toString(),
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