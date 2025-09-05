import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent, TimeOffEntry } from '@/types';
import { googleSheetsService } from '@/services/googleSheets';
import { calendarService } from '@/services/calendarService';

interface TeamMemberStats {
  name: string;
  email: string;
  totalDaysOff: number;
  upcomingEvents: CalendarEvent[];
  lastTimeOff: string | null;
}

export function TeamView() {
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadTeamData();
  }, []);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventTypeName = (type: CalendarEvent['type']) => {
    return calendarService.getEventTypeName(type);
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
          <h2 className="text-2xl font-bold text-foreground">Vista del Equipo</h2>
          <p className="text-muted-foreground">Resumen de ausencias y próximos eventos</p>
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
                        {formatDate(event.date)}
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

        {/* Estadísticas del equipo */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Miembros del Equipo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamStats.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay datos de equipo disponibles</p>
                  <p className="text-sm">Los datos aparecerán cuando los miembros usen el formulario</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {teamStats.map(member => (
                    <div key={member.email} className="border rounded-lg p-4 bg-gradient-subtle">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{member.totalDaysOff} días</span>
                          </div>
                        </div>
                      </div>
                      
                      {member.upcomingEvents.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2">Próximas ausencias:</p>
                          <div className="flex flex-wrap gap-1">
                            {member.upcomingEvents.slice(0, 3).map(event => (
                              <Badge 
                                key={event.id} 
                                variant="outline" 
                                className="text-xs"
                              >
                                {formatDate(event.date)} - {getEventTypeName(event.type)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {member.lastTimeOff && (
                        <div className="mt-2 flex items-center space-x-1 text-xs text-muted-foreground">
                          <UserCheck className="w-3 h-3" />
                          <span>Última ausencia: {formatDate(member.lastTimeOff)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}