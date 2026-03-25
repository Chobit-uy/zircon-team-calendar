import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM holidays ORDER BY date');

    const holidays = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      date: row.date,
      scope: row.scope,
      createdBy: row.created_by,
      createdAt: row.created_at,
      ...(row.row_index != null ? { rowIndex: row.row_index } : {}),
    }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ error: 'Failed to fetch holidays' });
  }
}
