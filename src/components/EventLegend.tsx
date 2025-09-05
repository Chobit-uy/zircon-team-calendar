import { CalendarEvent } from '@/types';

const eventTypes: Array<{
  type: CalendarEvent['type'];
  label: string;
  color: string;
}> = [
  { type: 'vacation', label: 'Vacaciones / Día libre', color: 'bg-vacation' },
  { type: 'birthday', label: 'Cumpleaños', color: 'bg-birthday' },
  { type: 'sick', label: 'Día por enfermedad', color: 'bg-sick' },
  { type: 'holiday', label: 'Feriados', color: 'bg-holiday' }
];

export function EventLegend() {
  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Tipos de eventos</h3>
      <div className="grid grid-cols-2 gap-3">
        {eventTypes.map(({ type, label, color }) => (
          <div key={type} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}