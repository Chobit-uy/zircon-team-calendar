import { CalendarEvent, TimeOffEntry, Holiday } from '@/types';
import { googleSheetsService } from './googleSheets';
import { holidayService } from './holidayService';

class CalendarService {
  private eventsCache: { [key: string]: CalendarEvent[] } = {};

  async getCalendarEvents(month: number, year: number): Promise<CalendarEvent[]> {
    const cacheKey = `${year}-${month}`;
    if (this.eventsCache[cacheKey]) {
      return this.eventsCache[cacheKey];
    }

    const [timeOffEntries, holidays] = await Promise.all([
      googleSheetsService.getTimeOffEntries(),
      holidayService.getHolidays()
    ]);

    const events: CalendarEvent[] = [];

    // Convertir entradas de tiempo libre a eventos de calendario
    timeOffEntries.forEach(entry => {
      const startDate = new Date(entry[2]);
      const endDate = new Date(entry[3]);

      // Generar eventos para cada día en el rango
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const eventDate = new Date(dateStr);
        
        if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
          events.push({
            id: `${entry[0]}-${dateStr}`,
            title: `${entry[1]} - ${this.getTypeLabel(entry[5])}`,
            date: dateStr,
            type: this.mapTypeToEventType(entry[5]),
            employeeName: entry[1],
            isHalfDay: entry[4] === 'Half Day'
          });
        }
      }
    });

    // Convertir feriados a eventos de calendario
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const dateStr = holidayDate.toISOString().split('T')[0];
      const eventDate = new Date(dateStr);
      if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
        events.push({
          id: `holiday-${holiday.id}`,
          title: holiday.name,
          date: dateStr,
          type: 'holiday'
        });
      }
    });

    this.eventsCache[cacheKey] = events.sort((a, b) => a.date.localeCompare(b.date));
    return this.eventsCache[cacheKey];
  }

  private mapTypeToEventType(type: TimeOffEntry['type']): CalendarEvent['type'] {
    switch (type) {
      case 'Vacation / Day Off':
        return 'vacation';
      case 'Birthday':
        return 'birthday';
      case 'Sick Day':
        return 'sick';
      default:
        return 'vacation';
    }
  }

  private getTypeLabel(type: TimeOffEntry['type']): string {
    switch (type) {
      case 'Vacation / Day Off':
        return 'Vacaciones';
      case 'Birthday':
        return 'Cumpleaños';
      case 'Sick Day':
        return 'Enfermedad';
      default:
        return 'Ausencia';
    }
  }

  getEventTypeColor(type: CalendarEvent['type']): string {
    switch (type) {
      case 'vacation':
        return 'hsl(var(--vacation))';
      case 'birthday':
        return 'hsl(var(--birthday))';
      case 'sick':
        return 'hsl(var(--sick))';
      case 'holiday':
        return 'hsl(var(--holiday))';
      default:
        return 'hsl(var(--primary))';
    }
  }

  getEventTypeName(type: CalendarEvent['type']): string {
    switch (type) {
      case 'vacation':
        return 'Vacaciones';
      case 'birthday':
        return 'Cumpleaños';
      case 'sick':
        return 'Enfermedad';
      case 'holiday':
        return 'Feriado';
      default:
        return 'Evento';
    }
  }
}

export const calendarService = new CalendarService();