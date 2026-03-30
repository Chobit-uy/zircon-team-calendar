import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM CountryHoliday ORDER BY date');

    const rows = result.rows.map(row =>
      result.columns.reduce((acc, col) => {
        const val = row[col];
        if (val !== undefined) acc[col] = val;
        return acc;
      }, {} as Record<string, unknown>)
    );

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ error: 'Failed to fetch holidays', detail: String(error) });
  }
}
