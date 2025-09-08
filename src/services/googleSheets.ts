import { TimeOffEntry } from '@/types';

// Mock data para simular la conexión con Google Sheets
// En producción esto se conectaría a la Google Sheets API
const mockTimeOffData: TimeOffEntry[] = [
  {
    id: '1',
    email: 'juan.perez@zircon.tech',
    employeeName: 'Juan Pérez',
    startDate: '2024-09-10',
    endDate: '2024-09-12',
    halfOrFull: 'Full Day',
    type: 'Vacation / Day Off',
    createdAt: '2024-09-01T10:00:00Z'
  },
  {
    id: '2',
    email: 'maria.garcia@zircon.tech',
    employeeName: 'María García',
    startDate: '2024-09-15',
    endDate: '2024-09-15',
    halfOrFull: 'Half Day',
    type: 'Birthday',
    createdAt: '2024-09-01T11:00:00Z'
  },
  {
    id: '3',
    email: 'carlos.rodriguez@zircon.tech',
    employeeName: 'Carlos Rodríguez',
    startDate: '2024-09-20',
    endDate: '2024-09-21',
    halfOrFull: 'Full Day',
    type: 'Sick Day',
    createdAt: '2024-09-01T12:00:00Z'
  }
];

class GoogleSheetsService {
  // Simula la obtención de datos desde Google Sheets
  async getTimeOffEntries(): Promise<TimeOffEntry[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTimeOffData;
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