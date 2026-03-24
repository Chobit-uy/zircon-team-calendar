import type { VercelRequest, VercelResponse } from '@vercel/node';
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
    // Fetch both sources in parallel
    const [vacRes, holRes] = await Promise.all([
      fetch(`${GAS_URL}?type=vacations`),
      fetch(`${GAS_URL}?type=holidays`),
    ]);

    if (!vacRes.ok) throw new Error(`GAS vacations error: ${vacRes.status}`);
    if (!holRes.ok) throw new Error(`GAS holidays error: ${holRes.status}`);

    const vacations: TimeOffEntryRow[] = await vacRes.json();
    const holidaysRaw: unknown[] = await holRes.json();

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
    await clearTimeOffEntries();
    await upsertTimeOffEntries(vacations);

    await clearHolidays();
    await upsertHolidays(holidays);

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
