import { z } from 'zod';

export const CategoryEnum = z.enum([
  'cultural',
  'historical',
  'astronomical',
  'sports',
  'festival',
  'geopolitical',
  'science',
]);

export const ImportanceEnum = z.enum(['high', 'medium', 'low']);
export const RecurrencePatternEnum = z.enum(['yearly', 'monthly', 'quadrennial', 'none']);

export const GeoCoordinatesSchema = z
  .tuple([
    z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
    z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  ])
  .describe('[longitude, latitude]');

export const GeoPointSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: GeoCoordinatesSchema,
});

export const EventDateSchema = z.object({
  start: z.string().datetime({ message: 'Start date must be a valid ISO-8601 string' }),
  end: z.string().datetime({ message: 'End date must be a valid ISO-8601 string' }).optional(),
  isFloating: z.boolean().default(false),
  solarHijriDate: z.string().optional(),
});

export const EventLocationSchema = z.object({
  name: z.string().min(2, 'Location name must be at least 2 characters'),
  country: z.string().min(2, 'Country code must be at least 2 characters').max(3),
  region: z.string().min(2, 'Region is required'),
  coordinates: GeoPointSchema,
});

export const EventMediaSchema = z.object({
  thumbnail: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
  banner: z.string().url('Banner must be a valid URL').optional().or(z.literal('')),
  credits: z.string().optional(),
});

export const EventMetadataSchema = z.object({
  recurring: z.boolean().default(false),
  recurrencePattern: RecurrencePatternEnum.default('none'),
  sourceUrl: z.string().url('Source URL must be a valid URL').optional().or(z.literal('')),
});

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe kebab-case').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: CategoryEnum,
  date: EventDateSchema,
  location: EventLocationSchema,
  importance: ImportanceEnum.default('medium'),
  tags: z.array(z.string().min(1)).min(1, 'Provide at least one tag').default([]),
  media: EventMediaSchema.optional().default({}),
  metadata: EventMetadataSchema.optional().default({ recurring: false, recurrencePattern: 'none' }),
});

export const updateEventSchema = createEventSchema.partial();

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: CategoryEnum.optional(),
  importance: ImportanceEnum.optional(),
  country: z.string().toUpperCase().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  near: z
    .string()
    .regex(/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/, 'Format must be "longitude,latitude"')
    .optional(),
  radius: z.coerce.number().positive().default(500), // kilometers
  sort: z
    .string()
    .regex(/^[a-zA-Z._]+:(?:asc|desc)$/, 'Format must be "field:asc" or "field:desc"')
    .default('date.start:asc'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryParams = z.infer<typeof eventQuerySchema>;
