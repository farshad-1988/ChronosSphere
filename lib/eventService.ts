import { connectToDatabase, isMongoConfigured } from './mongodb';
import { Event, IEvent } from '../models/Event';
import { SEED_EVENTS, SeedEventData } from '../scripts/seed';
import {
  CreateEventInput,
  UpdateEventInput,
  EventQueryParams,
  createEventSchema,
  updateEventSchema,
} from './validations/event';

// In-memory fallback repository initialized with the seed data
interface InMemoryEvent extends SeedEventData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

let inMemoryStore: InMemoryEvent[] = SEED_EVENTS.map((e, index) => ({
  ...e,
  _id: `mem_evt_${index + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * Calculates Great Circle distance between two [lng, lat] coordinates in kilometers using Haversine formula
 */
function haversineDistance(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface PaginationResult<T> {
  success: boolean;
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    datasource: 'mongodb' | 'in-memory-seed';
    timestamp: string;
    filtersApplied: Record<string, unknown>;
  };
}

export async function getEvents(params: EventQueryParams): Promise<PaginationResult<unknown>> {
  const mongo = await connectToDatabase();
  const filtersApplied: Record<string, unknown> = { ...params };

  if (mongo && isMongoConfigured()) {
    // If connected MongoDB collection is empty, auto-seed with initial dataset
    const globalCount = await Event.countDocuments();
    if (globalCount === 0) {
      const formattedDocs = SEED_EVENTS.map((e) => ({
        ...e,
        date: {
          ...e.date,
          start: new Date(e.date.start),
          end: e.date.end ? new Date(e.date.end) : undefined,
        },
      }));
      await Event.insertMany(formattedDocs);
    }

    const mongoFilter: Record<string, unknown> = {};

    if (params.category) mongoFilter.category = params.category;
    if (params.importance) mongoFilter.importance = params.importance;
    if (params.country) mongoFilter['location.country'] = params.country.toUpperCase();

    if (params.from || params.to) {
      mongoFilter['date.start'] = {};
      if (params.from) {
        (mongoFilter['date.start'] as Record<string, unknown>)['$gte'] = new Date(params.from);
      }
      if (params.to) {
        (mongoFilter['date.start'] as Record<string, unknown>)['$lte'] = new Date(params.to);
      }
    }

    if (params.search) {
      mongoFilter.$text = { $search: params.search };
    }

    if (params.near) {
      const [lng, lat] = params.near.split(',').map(Number);
      const radiusKm = params.radius || 500;
      // Convert km to meters for $maxDistance in 2dsphere
      mongoFilter['location.coordinates'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusKm * 1000,
        },
      };
    }

    // Dynamic sorting
    const [sortField, sortDir] = params.sort.split(':');
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortDir === 'desc' ? -1 : 1 };

    const totalItems = await Event.countDocuments(mongoFilter);
    const totalPages = Math.ceil(totalItems / params.limit) || 1;
    const skip = (params.page - 1) * params.limit;

    const data = await Event.find(mongoFilter)
      .sort(sortObj)
      .skip(skip)
      .limit(params.limit)
      .lean();

    return {
      success: true,
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: params.page,
        limit: params.limit,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
      },
      meta: {
        datasource: 'mongodb',
        timestamp: new Date().toISOString(),
        filtersApplied,
      },
    };
  }

  // --- Fallback in-memory processing ---
  let results = [...inMemoryStore];

  if (params.category) {
    results = results.filter((e) => e.category === params.category);
  }
  if (params.importance) {
    results = results.filter((e) => e.importance === params.importance);
  }
  if (params.country) {
    results = results.filter((e) => e.location.country === params.country?.toUpperCase());
  }
  if (params.from) {
    const fromTime = new Date(params.from).getTime();
    results = results.filter((e) => new Date(e.date.start).getTime() >= fromTime);
  }
  if (params.to) {
    const toTime = new Date(params.to).getTime();
    results = results.filter((e) => new Date(e.date.start).getTime() <= toTime);
  }
  if (params.search) {
    const query = params.search.toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.tags.some((t) => t.toLowerCase().includes(query)) ||
        e.location.name.toLowerCase().includes(query)
    );
  }
  if (params.near) {
    const [targetLng, targetLat] = params.near.split(',').map(Number);
    const radius = params.radius || 500;
    results = results.filter((e) => {
      const dist = haversineDistance(
        [targetLng, targetLat],
        e.location.coordinates.coordinates
      );
      return dist <= radius;
    });
  }

  // Dynamic sorting
  const [sortField, sortDir] = params.sort.split(':');
  results.sort((a, b) => {
    let valA: unknown = a;
    let valB: unknown = b;
    sortField.split('.').forEach((part) => {
      valA = (valA as Record<string, unknown>)?.[part];
      valB = (valB as Record<string, unknown>)?.[part];
    });

    if (valA instanceof Date || typeof valA === 'string') {
      const timeA = new Date(String(valA)).getTime();
      const timeB = new Date(String(valB)).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) {
        return sortDir === 'desc' ? timeB - timeA : timeA - timeB;
      }
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDir === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
    }

    return 0;
  });

  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / params.limit) || 1;
  const startIndex = (params.page - 1) * params.limit;
  const pageData = results.slice(startIndex, startIndex + params.limit);

  return {
    success: true,
    data: pageData,
    pagination: {
      totalItems,
      totalPages,
      currentPage: params.page,
      limit: params.limit,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
    meta: {
      datasource: 'in-memory-seed',
      timestamp: new Date().toISOString(),
      filtersApplied,
    },
  };
}

export async function getEventByIdOrSlug(idOrSlug: string) {
  const mongo = await connectToDatabase();
  if (mongo && isMongoConfigured()) {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug };
    const event = await Event.findOne(query).lean();
    return event;
  }

  // In memory
  return inMemoryStore.find((e) => e._id === idOrSlug || e.slug === idOrSlug) || null;
}

export async function createEvent(input: CreateEventInput) {
  const validated = createEventSchema.parse(input);
  const mongo = await connectToDatabase();

  const slug =
    validated.slug ||
    validated.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  if (mongo && isMongoConfigured()) {
    const newEvent = new Event({
      ...validated,
      slug,
      date: {
        ...validated.date,
        start: new Date(validated.date.start),
        end: validated.date.end ? new Date(validated.date.end) : undefined,
      },
    });
    return await newEvent.save();
  }

  // In memory store
  const newMemEvent: InMemoryEvent = {
    ...validated,
    slug,
    _id: `mem_evt_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryStore.unshift(newMemEvent);
  return newMemEvent;
}

export async function updateEvent(idOrSlug: string, input: UpdateEventInput) {
  const validated = updateEventSchema.parse(input);
  const mongo = await connectToDatabase();

  if (mongo && isMongoConfigured()) {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug };
    const updated = await Event.findOneAndUpdate(query, validated, {
      new: true,
      runValidators: true,
    }).lean();
    return updated;
  }

  // In memory
  const idx = inMemoryStore.findIndex((e) => e._id === idOrSlug || e.slug === idOrSlug);
  if (idx === -1) return null;

  const existing = inMemoryStore[idx];
  const merged: InMemoryEvent = {
    ...existing,
    ...validated,
    location: {
      ...existing.location,
      ...(validated.location || {}),
    },
    date: {
      ...existing.date,
      ...(validated.date || {}),
    },
    media: {
      ...existing.media,
      ...(validated.media || {}),
    },
    metadata: {
      ...existing.metadata,
      ...(validated.metadata || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore[idx] = merged;
  return merged;
}

export async function deleteEvent(idOrSlug: string) {
  const mongo = await connectToDatabase();
  if (mongo && isMongoConfigured()) {
    const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug };
    const deleted = await Event.findOneAndDelete(query).lean();
    return Boolean(deleted);
  }

  const idx = inMemoryStore.findIndex((e) => e._id === idOrSlug || e.slug === idOrSlug);
  if (idx === -1) return false;
  inMemoryStore.splice(idx, 1);
  return true;
}

export async function getEventStats() {
  const mongo = await connectToDatabase();
  if (mongo && isMongoConfigured()) {
    const categoryCounts = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const countryDistribution = await Event.aggregate([
      { $group: { _id: '$location.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.find({ 'date.start': { $gte: new Date() } })
      .sort({ 'date.start': 1 })
      .limit(5)
      .lean();

    return {
      success: true,
      data: {
        totalEvents,
        categories: Object.fromEntries(categoryCounts.map((c) => [c._id, c.count])),
        countryDistribution: countryDistribution.map((c) => ({ country: c._id, count: c.count })),
        upcomingHighlights: upcomingEvents,
      },
      meta: { datasource: 'mongodb', timestamp: new Date().toISOString() },
    };
  }

  // In memory
  const categories: Record<string, number> = {};
  const countryMap: Record<string, number> = {};
  inMemoryStore.forEach((e) => {
    categories[e.category] = (categories[e.category] || 0) + 1;
    countryMap[e.location.country] = (countryMap[e.location.country] || 0) + 1;
  });

  const now = Date.now();
  const upcomingHighlights = inMemoryStore
    .filter((e) => new Date(e.date.start).getTime() >= now)
    .sort((a, b) => new Date(a.date.start).getTime() - new Date(b.date.start).getTime())
    .slice(0, 5);

  return {
    success: true,
    data: {
      totalEvents: inMemoryStore.length,
      categories,
      countryDistribution: Object.entries(countryMap)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      upcomingHighlights,
    },
    meta: { datasource: 'in-memory-seed', timestamp: new Date().toISOString() },
  };
}
