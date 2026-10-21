/**
 * Next.js App Router Route Handler: /api/v1/events/[id]
 * Handles single event retrieval, updates (PUT/PATCH), and deletions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEventByIdOrSlug, updateEvent, deleteEvent } from '@/lib/eventService';
import { updateEventSchema } from '@/lib/validations/event';

const API_KEY = process.env.API_KEY || 'chronos-master-key-2026';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  return res;
}

function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const xApiKey = request.headers.get('x-api-key');
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : xApiKey?.trim();
  return Boolean(token && token === API_KEY);
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const event = await getEventByIdOrSlug(id);
    if (!event) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Event with identifier '${id}' was not found`,
            },
          },
          { status: 404 }
        )
      );
    }

    return setCorsHeaders(
      NextResponse.json(
        {
          success: true,
          data: event,
        },
        { status: 200 }
      )
    );
  } catch (err: unknown) {
    console.error('[API GET /api/v1/events/[id] Error]:', err);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: (err as Error).message || 'Failed to fetch event',
          },
        },
        { status: 500 }
      )
    );
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  return handleUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  return handleUpdate(request, context);
}

async function handleUpdate(request: NextRequest, context: RouteParams) {
  try {
    if (!verifyApiKey(request)) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or missing API key.',
            },
          },
          { status: 401 }
        )
      );
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();

    const validated = updateEventSchema.safeParse(body);
    if (!validated.success) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid update payload',
              details: validated.error.flatten().fieldErrors,
            },
          },
          { status: 400 }
        )
      );
    }

    const updated = await updateEvent(id, validated.data);
    if (!updated) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Event with identifier '${id}' was not found`,
            },
          },
          { status: 404 }
        )
      );
    }

    return setCorsHeaders(
      NextResponse.json(
        {
          success: true,
          message: 'Event updated successfully',
          data: updated,
        },
        { status: 200 }
      )
    );
  } catch (err: unknown) {
    console.error('[API PUT/PATCH /api/v1/events/[id] Error]:', err);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: (err as Error).message || 'Failed to update event',
          },
        },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    if (!verifyApiKey(request)) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or missing API key.',
            },
          },
          { status: 401 }
        )
      );
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const deleted = await deleteEvent(id);
    if (!deleted) {
      return setCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Event with identifier '${id}' was not found`,
            },
          },
          { status: 404 }
        )
      );
    }

    return setCorsHeaders(
      NextResponse.json(
        {
          success: true,
          message: `Event '${id}' successfully deleted`,
        },
        { status: 200 }
      )
    );
  } catch (err: unknown) {
    console.error('[API DELETE /api/v1/events/[id] Error]:', err);
    return setCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: (err as Error).message || 'Failed to delete event',
          },
        },
        { status: 500 }
      )
    );
  }
}
