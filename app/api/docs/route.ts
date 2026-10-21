/**
 * OpenAPI 3.1 & Interactive Documentation Endpoint
 * Returns either OpenAPI JSON schema or interactive Swagger UI
 */
import { NextRequest, NextResponse } from 'next/server';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'ChronosSphere World Events REST API',
    version: '1.0.0',
    description:
      'A production-grade REST API for historical, cultural, international, sports, and astronomical world events, powered by MongoDB, Mongoose, and GeoJSON 2dsphere indexing.',
    contact: {
      name: 'ChronosSphere API Team',
      url: 'https://chronosphere.io',
    },
    license: {
      name: 'Apache-2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current Environment API Server',
    },
  ],
  paths: {
    '/events': {
      get: {
        summary: 'List and filter world events',
        description: 'Retrieve paginated world events with advanced filters, text search, date range, and geo-spatial proximity.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12, maximum: 100 } },
          {
            name: 'category',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['cultural', 'historical', 'astronomical', 'sports', 'festival', 'geopolitical', 'science'],
            },
          },
          {
            name: 'importance',
            in: 'query',
            schema: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          { name: 'country', in: 'query', schema: { type: 'string', example: 'IR' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'search', in: 'query', schema: { type: 'string', description: 'Full-text search on title, tags, and description' } },
          { name: 'near', in: 'query', schema: { type: 'string', description: 'Coordinates formatted as longitude,latitude (e.g. 52.89,29.93)' } },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 500, description: 'Radius in kilometers' } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'date.start:asc' } },
        ],
        responses: {
          200: {
            description: 'Paginated list of events',
            content: { 'application/json': {} },
          },
        },
      },
      post: {
        summary: 'Create a new world event',
        description: 'Requires API key authorization via Bearer token or x-api-key header.',
        security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEventInput' } } },
        },
        responses: {
          201: { description: 'Event created successfully' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/events/{id_or_slug}': {
      get: {
        summary: 'Get event by ID or slug',
        parameters: [{ name: 'id_or_slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Event details' },
          404: { description: 'Event not found' },
        },
      },
      put: {
        summary: 'Update event',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id_or_slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Event updated' } },
      },
      delete: {
        summary: 'Delete event',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id_or_slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Event deleted' } },
      },
    },
    '/events/stats': {
      get: {
        summary: 'Get aggregated statistics',
        description: 'Returns event counts by category, country distribution, and upcoming highlights.',
        responses: { 200: { description: 'Aggregated analytics' } },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
    schemas: {
      CreateEventInput: {
        type: 'object',
        required: ['title', 'description', 'category', 'date', 'location'],
        properties: {
          title: { type: 'string', example: 'Perseid Meteor Shower' },
          slug: { type: 'string', example: 'perseid-meteor-shower' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['cultural', 'historical', 'astronomical', 'sports', 'festival', 'geopolitical', 'science'],
          },
          date: {
            type: 'object',
            required: ['start'],
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' },
              isFloating: { type: 'boolean' },
              solarHijriDate: { type: 'string' },
            },
          },
          location: {
            type: 'object',
            required: ['name', 'country', 'region', 'coordinates'],
            properties: {
              name: { type: 'string' },
              country: { type: 'string', example: 'ES' },
              region: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['Point'] },
                  coordinates: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
                },
              },
            },
          },
          importance: { type: 'string', enum: ['high', 'medium', 'low'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');

  if (format === 'json') {
    return NextResponse.json(openApiSpec);
  }

  // Interactive HTML Docs
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

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
