/**
 * Next.js App Router Route Handler: /api/v1/events
 * Handles list retrieval with filtering, geo queries, sorting, and authenticated event creation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/lib/eventService';
import { eventQuerySchema, createEventSchema } from '@/lib/validations/event';
import { ZodError } from 'zod';

const API_KEY = process.env.API_KEY || 'chronos-master-key-2026';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  return res;
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, string> = {};

    searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    const parsedQuery = eventQuerySchema.safeParse(queryObj);
    if (!parsedQuery.success) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters provided',
              details: parsedQuery.error.flatten().fieldErrors,
            },
          },
          { status: 400 }
        )
      );
    }

    const result = await getEvents(parsedQuery.data);
    return setCorsHeaders(NextResponse.json(result, { status: 200 }));
  } catch (err: unknown) {
    console.error('[API GET /api/v1/events Error]:', err);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: (err as Error).message || 'Failed to retrieve events',
          },
        },
        { status: 500 }
      )
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // API Key Authentication middleware check
    const authHeader = request.headers.get('authorization');
    const xApiKey = request.headers.get('x-api-key');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : xApiKey?.trim();

    if (!token || token !== API_KEY) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or missing API key. Provide "x-api-key" or "Authorization: Bearer <key>" header.',
            },
          },
          { status: 401 }
        )
      );
    }

    const body = await request.json();
    const validatedData = createEventSchema.safeParse(body);

    if (!validatedData.success) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid event payload',
              details: validatedData.error.flatten().fieldErrors,
            },
          },
          { status: 400 }
        )
      );
    }

    const created = await createEvent(validatedData.data);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: true,
          message: 'Event created successfully',
          data: created,
        },
        { status: 201 }
      )
    );
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: err.flatten().fieldErrors,
            },
          },
          { status: 400 }
        )
      );
    }

    console.error('[API POST /api/v1/events Error]:', err);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: (err as Error).message || 'Failed to create event',
          },
        },
        { status: 500 }
      )
    );
  }
}
