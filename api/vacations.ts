import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const result = await db.execute(
      'SELECT * FROM time_off_entries ORDER BY start_date'
    );

    const entries = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      employeeName: row.employee_name,
      startDate: row.start_date,
      endDate: row.end_date,
      halfOrFull: row.half_or_full,
      type: row.type,
      createdAt: row.created_at,
    }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching vacations:', error);
    return res.status(500).json({ error: 'Failed to fetch vacations' });
  }
}
