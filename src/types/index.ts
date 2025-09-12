export interface TimeOffEntry {
  id: string;
  email: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  halfOrFull: 'Half Day' | 'Full Day';
  type: 'Vacation / Day Off' | 'Birthday' | 'Sick Day';
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  scope: 'Nacional' | 'Local/Regional' | 'Empresa' | 'Otro';
  createdBy: string;
  createdAt: string;
  rowIndex?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'vacation' | 'birthday' | 'sick' | 'holiday';
  employeeName?: string;
  isHalfDay?: boolean;
}

export type EventType = 'vacation' | 'birthday' | 'sick' | 'holiday';
export type ViewMode = 'month' | 'week' | 'day';