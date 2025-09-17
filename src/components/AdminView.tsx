import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Holiday, CalendarEvent } from '@/types';
import { holidayService } from '@/services/holidayService';
import { googleSheetsService } from '@/services/googleSheets';
import { calendarService } from '@/services/calendarService';
import { useToast } from '@/hooks/use-toast';

// TeamView logic
interface TeamMemberStats {
  name: string;
  email: string;
  totalDaysOff: number;
  upcomingEvents: CalendarEvent[];
  lastTimeOff: string | null;
}

export function AdminView() {
  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Team stats
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  // Pagination for holidays
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;
  const { toast } = useToast();

  useEffect(() => {
    loadHolidays();
    loadTeamData();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const holidayList = await holidayService.getHolidays();
      setHolidays(holidayList.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los feriados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const timeOffEntries = await googleSheetsService.getTimeOffEntries();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Obtener eventos del mes actual y siguiente
      const [currentMonthEvents, nextMonthEvents] = await Promise.all([
        calendarService.getCalendarEvents(currentMonth, currentYear),
        calendarService.getCalendarEvents(currentMonth + 1, currentYear)
      ]);

      const allEvents = [...currentMonthEvents, ...nextMonthEvents];
      const upcoming = allEvents.filter(event =>
        new Date(event.date) >= currentDate
      ).slice(0, 10);

      setUpcomingEvents(upcoming);

      // Agrupar por empleado
      const employeeMap = new Map<string, TeamMemberStats>();

      timeOffEntries.forEach(entry => {
        if (!employeeMap.has(entry.email)) {
          employeeMap.set(entry.email, {
            name: entry.employeeName,
            email: entry.email,
            totalDaysOff: 0,
            upcomingEvents: [],
            lastTimeOff: null
          });
        }

        const stats = employeeMap.get(entry.email)!;

        // Calcular días
        const startDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const daysToAdd = entry.halfOrFull === 'Half Day' ? diffDays * 0.5 : diffDays;

        stats.totalDaysOff += daysToAdd;

        // Última ausencia
        if (!stats.lastTimeOff || entry.startDate > stats.lastTimeOff) {
          stats.lastTimeOff = entry.startDate;
        }

        // Eventos próximos
        const memberUpcoming = allEvents.filter(event =>
          event.employeeName === entry.employeeName &&
          new Date(event.date) >= currentDate
        );
        stats.upcomingEvents = memberUpcoming;
      });

      setTeamStats(Array.from(employeeMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventBadgeColor = (type: CalendarEvent['type']) => {
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

  const getEventTypeName = (type: CalendarEvent['type']) => {
    return calendarService.getEventTypeName(type);
  };

  // Calcular feriados paginados
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHolidays = holidays.slice(startIndex, endIndex);
  const totalPages = Math.ceil(holidays.length / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Administración</h2>
          <p className="text-muted-foreground">Resumen de ausencias, próximos eventos y feriados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos eventos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Próximos Eventos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay eventos próximos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 8).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.employeeName || event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(event.date)}
                      </p>
                    </div>
                    <Badge className={`text-xs ${getEventBadgeColor(event.type)}`}>
                      {getEventTypeName(event.type)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Miembros del Equipo */}
        <div className="lg:col-span-2 space-y-4  ">

          {/* Lista de feriados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Feriados Programados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay feriados programados</p>
                  <p className="text-sm">Agrega el primer feriado usando el formulario</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedHolidays.map(holiday => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gradient-subtle"
                      >
                        <div>
                          <h4 className="font-medium text-foreground">{holiday.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(holiday.date)}
                          </p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                            {holiday.scope}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, holidays.length)} de {holidays.length} feriados
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="flex items-center space-x-1 px-2 py-1 border rounded text-sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 0}
                        >
                          <span>Anterior</span>
                        </button>
                        <span className="text-sm text-muted-foreground px-3">
                          {currentPage + 1} / {totalPages}
                        </span>
                        <button
                          type="button"
                          className="flex items-center space-x-1 px-2 py-1 border rounded text-sm"
                          onClick={handleNextPage}
                          disabled={currentPage >= totalPages - 1}
                        >
                          <span>Siguiente</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Integración con Google Form:</span>
              <p className="text-muted-foreground">
                Los datos de vacaciones y ausencias se sincronizan automáticamente desde el formulario de Google.
              </p>
            </div>
            <div>
              <span className="font-medium">Acceso público:</span>
              <p className="text-muted-foreground">
                El calendario es accesible públicamente. Solo los administradores pueden gestionar feriados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}