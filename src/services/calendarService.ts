import { CalendarEvent, TimeOffEntry, Holiday } from '@/types';
import { googleSheetsService } from './googleSheets';
import { holidayService } from './holidayService';

class CalendarService {
  async getCalendarEvents(month: number, year: number): Promise<CalendarEvent[]> {
    const [timeOffEntries, holidays] = await Promise.all([
      googleSheetsService.getTimeOffEntries(),
      holidayService.getHolidays()
    ]);

    const events: CalendarEvent[] = [];

    // Convertir entradas de tiempo libre a eventos de calendario
    timeOffEntries.forEach(entry => {
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);
      
      // Generar eventos para cada día en el rango
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const eventDate = new Date(dateStr);
        
        if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
          events.push({
            id: `${entry.id}-${dateStr}`,
            title: `${entry.employeeName} - ${this.getTypeLabel(entry.type)}`,
            date: dateStr,
            type: this.mapTypeToEventType(entry.type),
            employeeName: entry.employeeName,
            isHalfDay: entry.halfOrFull === 'Half Day'
          });
        }
      }
    });

    // Convertir feriados a eventos de calendario
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getMonth() === month && holidayDate.getFullYear() === year) {
        events.push({
          id: `holiday-${holiday.id}`,
          title: holiday.name,
          date: holiday.date,
          type: 'holiday'
        });
      }
    });

    return events.sort((a, b) => a.date.localeCompare(b.date));
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