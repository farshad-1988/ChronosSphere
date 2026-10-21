/**
 * Production-ready Express Backend Server with Vite Middleware Integration
 * Hosts the complete RESTful World Events API under /api/v1/events and serves the React/Three.js frontend.
 */
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getEvents,
  getEventByIdOrSlug,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
} from './lib/eventService';
import { eventQuerySchema, createEventSchema, updateEventSchema } from './lib/validations/event';
import { openApiSpec } from './app/api/docs/route';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const API_KEY = process.env.API_KEY || 'chronos-master-key-2026';

app.use(express.json());

// CORS & Preflight middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Auth helper
function checkApiKey(req: Request, res: Response): boolean {
  const authHeader = req.headers.authorization;
  const xApiKey = req.headers['x-api-key'] as string | undefined;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : xApiKey?.trim();

  if (!token || token !== API_KEY) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key. Provide "x-api-key" or "Authorization: Bearer <key>" header.',
      },
    });
    return false;
  }
  return true;
}

// ==================== RESTful API Endpoints ====================

// 1. GET /api/v1/events (Query, filters, nearSphere, sorting, pagination)
app.get('/api/v1/events', async (req: Request, res: Response) => {
  try {
    const parsedQuery = eventQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters provided',
          details: parsedQuery.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const result = await getEvents(parsedQuery.data);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (err as Error).message || 'Failed to retrieve events',
      },
    });
  }
});

// 2. GET /api/v1/events/stats (Aggregated analytics)
app.get('/api/v1/events/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getEventStats();
    res.json(stats);
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (err as Error).message || 'Failed to aggregate statistics',
      },
    });
  }
});

// 3. GET /api/v1/events/:id_or_slug (Single event)
app.get('/api/v1/events/:id_or_slug', async (req: Request, res: Response) => {
  try {
    const { id_or_slug } = req.params;
    const event = await getEventByIdOrSlug(id_or_slug);
    if (!event) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Event with identifier '${id_or_slug}' was not found`,
        },
      });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (err as Error).message || 'Failed to retrieve event',
      },
    });
  }
});

// 4. POST /api/v1/events (Create event with validation & auth)
app.post('/api/v1/events', async (req: Request, res: Response) => {
  try {
    if (!checkApiKey(req, res)) return;

    const validated = createEventSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event payload',
          details: validated.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const created = await createEvent(validated.data);
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: created,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (err as Error).message || 'Failed to create event',
      },
    });
  }
});

// 5. PUT & PATCH /api/v1/events/:id (Update event)
const handleUpdate = async (req: Request, res: Response) => {
  try {
    if (!checkApiKey(req, res)) return;

    const { id_or_slug } = req.params;
    const validated = updateEventSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update payload',
          details: validated.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const updated = await updateEvent(id_or_slug, validated.data);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Event with identifier '${id_or_slug}' was not found`,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updated,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (err as Error).message || 'Failed to update event',
      },
    });
  }
};

app.put('/api/v1/events/:id_or_slug', handleUpdate);
app.patch('/api/v1/events/:id_or_slug', handleUpdate);

// 6. DELETE /api/v1/events/:id (Delete event)
app.delete('/api/v1/events/:id_or_slug', async (req: Request, res: Response) => {
  try {
    if (!checkApiKey(req, res)) return;

    const { id_or_slug } = req.params;
    const deleted = await deleteEvent(id_or_slug);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Event with identifier '${id_or_slug}' was not found`,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: `Event '${id_or_slug}' successfully deleted`,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: (err as Error).message || 'Failed to delete event',
      },
    });
  }
});

// 7. GET /api/docs (OpenAPI / Swagger UI)
app.get('/api/docs', (req: Request, res: Response) => {
  if (req.query.format === 'json') {
    res.json(openApiSpec);
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ChronosSphere REST API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0b0f19; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`;
  res.type('html').send(html);
});

// ==================== Vite Integration ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChronosSphere Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
});
