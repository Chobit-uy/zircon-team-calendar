import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Holiday, CalendarEvent } from '@/types';
import { holidayService } from '@/services/holidayService';
import { googleSheetsService } from '@/services/googleSheets';
import { calendarService } from '@/services/calendarService';
import { useToast } from '@/hooks/use-toast';

const ALLOWED_COUNTRIES = ['ARGENTINA', 'URUGUAY', 'CHILE', 'YEMEN'] as const;
type AllowedCountry = typeof ALLOWED_COUNTRIES[number];

const COUNTRY_COLORS: Record<AllowedCountry, string> = {
  ARGENTINA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  URUGUAY:   'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  CHILE:     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  YEMEN:     'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const COUNTRY_FLAGS: Record<AllowedCountry, string> = {
  ARGENTINA: '🇦🇷',
  URUGUAY:   '🇺🇾',
  CHILE:     '🇨🇱',
  YEMEN:     '🇾🇪',
};

function extractCountry(name: string): string {
  const parts = name.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : '';
}

function stripCountry(name: string): string {
  const parts = name.split(' - ');
  return parts.length > 1 ? parts.slice(0, -1).join(' - ') : name;
}

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

  // Feriados próximos 30 días filtrados por país
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const upcomingHolidays = holidays
    .filter(h => {
      const [y, m, d] = h.date.split('T')[0].split('-').map(Number);
      const hDate = new Date(y, m - 1, d);
      const country = extractCountry(h.name);
      return hDate >= today && hDate <= in30Days && ALLOWED_COUNTRIES.includes(country as AllowedCountry);
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const holidaysByCountry = ALLOWED_COUNTRIES.reduce((acc, country) => {
    acc[country] = upcomingHolidays.filter(h => extractCountry(h.name) === country);
    return acc;
  }, {} as Record<AllowedCountry, Holiday[]>);

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
         
      {/* Feriados próximos 30 días */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Feriados — Próximos 30 días</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {ALLOWED_COUNTRIES.map(c => `${COUNTRY_FLAGS[c]} ${c.charAt(0) + c.slice(1).toLowerCase()}`).join(' · ')}
              </p>
            </div>
            {upcomingHolidays.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {upcomingHolidays.length} {upcomingHolidays.length === 1 ? 'feriado' : 'feriados'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingHolidays.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Sin feriados en los próximos 30 días</p>
              <p className="text-xs mt-1">Para {ALLOWED_COUNTRIES.map(c => c.charAt(0) + c.slice(1).toLowerCase()).join(', ')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ALLOWED_COUNTRIES.filter(c => holidaysByCountry[c].length > 0).map(country => (
                <div key={country}>
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-md mb-2 w-fit ${COUNTRY_COLORS[country]}`}>
                    <span className="text-base">{COUNTRY_FLAGS[country]}</span>
                    <span className="text-xs font-semibold tracking-wide">
                      {country.charAt(0) + country.slice(1).toLowerCase()}
                    </span>
                    <span className="text-xs opacity-70">({holidaysByCountry[country].length})</span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {holidaysByCountry[country].map(holiday => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-2.5 border rounded-lg bg-gradient-subtle hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-sm font-medium text-foreground truncate">
                            {stripCountry(holiday.name)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(holiday.date)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                          {holiday.scope}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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