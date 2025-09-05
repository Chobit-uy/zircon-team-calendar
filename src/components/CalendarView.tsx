import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarEvent } from '@/types';
import { calendarService } from '@/services/calendarService';
import { googleSheetsService } from '@/services/googleSheets';
import { EventLegend } from './EventLegend';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb'];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadEvents();
  }, [currentMonth, currentYear]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const calendarEvents = await calendarService.getCalendarEvents(currentMonth, currentYear);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Días del mes anterior para completar la primera semana
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDay = new Date(currentYear, currentMonth, -i);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        events: []
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.date === dateStr);
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }

    // Días del próximo mes para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonthDay = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'vacation':
        return 'bg-vacation text-white';
      case 'birthday':
        return 'bg-birthday text-white';
      case 'sick':
        return 'bg-sick text-white';
      case 'holiday':
        return 'bg-holiday text-white';
      default:
        return 'bg-primary text-white';
    }
  };

  const openGoogleForm = () => {
    window.open(googleSheetsService.getGoogleFormUrl(), '_blank');
  };

  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={openGoogleForm} className="bg-gradient-zircon hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Solicitar tiempo libre
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Calendario del equipo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Días de la semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-24 p-1 border rounded-md ${
                          day.isCurrentMonth 
                            ? 'bg-background border-border' 
                            : 'bg-muted/30 border-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {day.events.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${getEventColor(event.type)}`}
                              title={`${event.title}${event.isHalfDay ? ' (Medio día)' : ''}`}
                            >
                              {event.employeeName || event.title}
                              {event.isHalfDay && ' (½)'}
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{day.events.length - 2} más
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <EventLegend />
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Formulario de solicitudes:</span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={openGoogleForm}
                    className="p-0 h-auto ml-2 text-primary"
                  >
                    Google Form
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa el formulario para solicitar vacaciones, reportar cumpleaños o días de enfermedad.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}