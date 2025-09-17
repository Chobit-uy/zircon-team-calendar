import { TimeOffEntry } from '@/types';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4nvk9gsxZIyNYzQx2_dXEF-51-Qg4jl975Bl_Wc3XB8S4hmNZrItsIA8u3hDOLcC8/exec';

class GoogleSheetsService {
  // Obtiene los datos desde Google Sheets usando fetch
  async getTimeOffEntries(): Promise<TimeOffEntry[]> {
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?type=vacations`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      // Se asume que el endpoint retorna un array de TimeOffEntry
      return data as TimeOffEntry[];
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
      return true;
    } catch (error) {
      console.error('Error syncing with Google Form:', error);
      return false;
    }
  }

  // URL del Google Form proporcionado
  getGoogleFormUrl(): string {
    return 'https://docs.google.com/forms/d/e/1FAIpQLSczGCvGvpeenWw2jzm--GpEz9X4HUQqh_7SmrzvWGYOsU5R-g/viewform';
  }
}

export const googleSheetsService = new GoogleSheetsService();