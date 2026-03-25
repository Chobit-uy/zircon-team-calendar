import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDb } from './_db';
import {
  clearTimeOffEntries,
  clearHolidays,
  upsertTimeOffEntries,
  upsertHolidays,
  type TimeOffEntryRow,
  type HolidayRow,
} from './_schema';

const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL!;

function normalizeScope(ambito: string): string {
  if (ambito === 'Nacional') return 'Nacional';
  if (ambito === 'Empresa') return 'Empresa';
  if (['Local/Regional', 'local', 'Local'].includes(ambito)) return 'Local/Regional';
  return 'Otro';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron/manual secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure tables exist before any DB operation
    try { await initDb(); } catch(e) { return res.status(500).json({ error: 'Sync failed', step: 'initDb', detail: String(e) }); }

    // Fetch both sources in parallel
    let vacRes: Response, holRes: Response;
    try {
      [vacRes, holRes] = await Promise.all([
        fetch(`${GAS_URL}?type=vacations`),
        fetch(`${GAS_URL}?type=holidays`),
      ]);
      if (!vacRes.ok) throw new Error(`GAS vacations error: ${vacRes.status}`);
      if (!holRes.ok) throw new Error(`GAS holidays error: ${holRes.status}`);
    } catch(e) { return res.status(500).json({ error: 'Sync failed', step: 'fetch', detail: String(e) }); }

    const vacRaw: unknown[] = await vacRes.json();
    const holidaysRaw: unknown[] = await holRes.json();

    // Parse vacations 2D array: [[headers], [row1], ...]
    // Columns: Timestamp, Email Address, Starting, Finishing, Half Day or Full Day?, Type of Time off
    if (!Array.isArray(vacRaw) || vacRaw.length < 2) {
      throw new Error('Unexpected vacations format from GAS');
    }
    const [, ...vacRows] = vacRaw as string[][];
    const vacations: TimeOffEntryRow[] = vacRows.map((row, idx) => {
      const email = row[1] || '';
      const startDate = row[2] || '';
      const employeeName = email.split('@')[0] || `employee_${idx}`;
      return {
        id: `${email}-${startDate}-${idx}`,
        email,
        employeeName,
        startDate,
        endDate: row[3] || '',
        halfOrFull: row[4] || 'Full Day',
        type: row[5] || 'Vacation / Day Off',
        createdAt: row[0] || new Date().toISOString(),
      };
    });

    // Parse holidays 2D array format: [[headers], [row1], [row2], ...]
    if (!Array.isArray(holidaysRaw) || holidaysRaw.length < 2) {
      throw new Error('Unexpected holidays format from GAS');
    }
    const [headers, ...rows] = holidaysRaw as string[][];
    const holidays: HolidayRow[] = rows.map(row => {
      const obj = Object.fromEntries(
        (headers as string[]).map((header, i) => [header, row[i]])
      );
      return {
        id: obj.rowIndex?.toString() || Math.random().toString(36).slice(2, 11),
        name: obj.nombre || '',
        date: obj.fecha || '',
        scope: normalizeScope(obj.ambito || ''),
        createdBy: 'admin@zircon.tech',
        createdAt: new Date().toISOString(),
        rowIndex: obj.rowIndex?.toString(),
      };
    });

    // Full replace: clear then upsert
    try { await clearTimeOffEntries(); } catch(e) { return res.status(500).json({ error: 'Sync failed', step: 'clearVacations', detail: String(e) }); }
    try { await upsertTimeOffEntries(vacations); } catch(e) { return res.status(500).json({ error: 'Sync failed', step: 'upsertVacations', detail: String(e), sample: vacations[0] }); }
    try { await clearHolidays(); } catch(e) { return res.status(500).json({ error: 'Sync failed', step: 'clearHolidays', detail: String(e) }); }
    try { await upsertHolidays(holidays); } catch(e) { return res.status(500).json({ error: 'Sync failed', step: 'upsertHolidays', detail: String(e), sample: holidays[0] }); }

    return res.status(200).json({
      synced: true,
      vacations: vacations.length,
      holidays: holidays.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Sync failed', detail: String(error) });
  }
}
