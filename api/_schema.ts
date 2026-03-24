import { getDb } from './_db';

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS time_off_entries (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  start_date    TEXT NOT NULL,
  end_date      TEXT NOT NULL,
  half_or_full  TEXT NOT NULL,
  type          TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  synced_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS holidays (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  date       TEXT NOT NULL,
  scope      TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'admin@zircon.tech',
  created_at TEXT NOT NULL,
  row_index  TEXT,
  synced_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_toe_start ON time_off_entries(start_date);
CREATE INDEX IF NOT EXISTS idx_toe_end   ON time_off_entries(end_date);
CREATE INDEX IF NOT EXISTS idx_hol_date  ON holidays(date);
`;

export interface TimeOffEntryRow {
  id: string;
  email: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  halfOrFull: string;
  type: string;
  createdAt: string;
}

export interface HolidayRow {
  id: string;
  name: string;
  date: string;
  scope: string;
  createdBy: string;
  createdAt: string;
  rowIndex?: string;
}

const CHUNK_SIZE = 100;

function chunks<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export async function upsertTimeOffEntries(entries: TimeOffEntryRow[]): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  for (const chunk of chunks(entries, CHUNK_SIZE)) {
    await db.batch(
      chunk.map(e => ({
        sql: `INSERT OR REPLACE INTO time_off_entries
              (id, email, employee_name, start_date, end_date, half_or_full, type, created_at, synced_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [e.id, e.email, e.employeeName, e.startDate, e.endDate, e.halfOrFull, e.type, e.createdAt, now],
      })),
      'write'
    );
  }
}

export async function upsertHolidays(holidays: HolidayRow[]): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  for (const chunk of chunks(holidays, CHUNK_SIZE)) {
    await db.batch(
      chunk.map(h => ({
        sql: `INSERT OR REPLACE INTO holidays
              (id, name, date, scope, created_by, created_at, row_index, synced_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [h.id, h.name, h.date, h.scope, h.createdBy, h.createdAt, h.rowIndex ?? null, now],
      })),
      'write'
    );
  }
}

export async function clearTimeOffEntries(): Promise<void> {
  await getDb().execute('DELETE FROM time_off_entries');
}

export async function clearHolidays(): Promise<void> {
  await getDb().execute('DELETE FROM holidays');
}
