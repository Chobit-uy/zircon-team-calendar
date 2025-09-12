import { Holiday } from '@/types';

// Mock data para feriados
const mockHolidays: Holiday[] = [
  {
    id: '1',
    name: 'Día de la Independencia',
    date: '2024-09-16',
    scope: 'Nacional',
    createdBy: 'admin@zircon.tech',
    createdAt: '2024-09-01T09:00:00Z'
  },
  {
    id: '2', 
    name: 'Día de Acción de Gracias',
    date: '2024-11-28',
    scope: 'Empresa',
    createdBy: 'admin@zircon.tech',
    createdAt: '2024-09-01T09:00:00Z'
  }
];

class HolidayService {
  private holidays: Holiday[] = [...mockHolidays];

  async getHolidays(): Promise<Holiday[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.holidays;
  }

  async addHoliday(holiday: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
    const newHoliday: Holiday = {
      ...holiday,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    this.holidays.push(newHoliday);
    return newHoliday;
  }

  async updateHoliday(id: string, updates: Partial<Holiday>): Promise<Holiday | null> {
    const index = this.holidays.findIndex(h => h.id === id);
    if (index === -1) return null;
    
    this.holidays[index] = { ...this.holidays[index], ...updates };
    return this.holidays[index];
  }

  async deleteHoliday(id: string): Promise<boolean> {
    const index = this.holidays.findIndex(h => h.id === id);
    if (index === -1) return false;
    
    this.holidays.splice(index, 1);
    return true;
  }
}

export const holidayService = new HolidayService();