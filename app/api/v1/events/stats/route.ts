/**
 * Next.js App Router Route Handler: /api/v1/events/stats
 * Aggregated insights: category counts, upcoming highlights, country distribution
 */
import { NextResponse } from 'next/server';
import { getEventStats } from '@/lib/eventService';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  try {
    const stats = await getEventStats();
    return setCorsHeaders(NextResponse.json(stats, { status: 200 }));
  } catch (err: unknown) {
    console.error('[API GET /api/v1/events/stats Error]:', err);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: (err as Error).message || 'Failed to aggregate event stats',
          },
        },
        { status: 500 }
      )
    );
  }
}
