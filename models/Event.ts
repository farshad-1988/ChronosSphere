import mongoose, { Schema, Document, Model } from 'mongoose';

export type EventCategory =
  | 'cultural'
  | 'historical'
  | 'astronomical'
  | 'sports'
  | 'festival'
  | 'geopolitical'
  | 'science';

export type EventImportance = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'yearly' | 'monthly' | 'quadrennial' | 'none';

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IEventDate {
  start: Date;
  end?: Date;
  isFloating?: boolean;
  solarHijriDate?: string;
}

export interface IEventLocation {
  name: string;
  country: string;
  region: string;
  coordinates: IGeoPoint;
}

export interface IEventMedia {
  thumbnail?: string;
  banner?: string;
  credits?: string;
}

export interface IEventMetadata {
  recurring: boolean;
  recurrencePattern: RecurrencePattern;
  sourceUrl?: string;
}

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  date: IEventDate;
  location: IEventLocation;
  importance: EventImportance;
  tags: string[];
  media: IEventMedia;
  metadata: IEventMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const GeoPointSchema = new Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (coords: number[]) {
          return (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90
          );
        },
        message: 'Coordinates must be [longitude, latitude] within valid WGS84 bounds.',
      },
    },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 200,
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: [
          'cultural',
          'historical',
          'astronomical',
          'sports',
          'festival',
          'geopolitical',
          'science',
        ],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },
    date: {
      start: {
        type: Date,
        required: [true, 'Event start date is required'],
        index: true,
      },
      end: {
        type: Date,
      },
      isFloating: {
        type: Boolean,
        default: false,
      },
      solarHijriDate: {
        type: String,
        trim: true,
      },
    },
    location: {
      name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'Country code is required'],
        trim: true,
        uppercase: true,
        index: true,
      },
      region: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: GeoPointSchema,
        required: true,
      },
    },
    importance: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    media: {
      thumbnail: { type: String, trim: true },
      banner: { type: String, trim: true },
      credits: { type: String, trim: true },
    },
    metadata: {
      recurring: { type: Boolean, default: false },
      recurrencePattern: {
        type: String,
        enum: ['yearly', 'monthly', 'quadrennial', 'none'],
        default: 'none',
      },
      sourceUrl: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
EventSchema.index({ 'location.coordinates': '2dsphere' });
EventSchema.index({ 'date.start': 1, category: 1, importance: 1 });
EventSchema.index(
  {
    title: 'text',
    description: 'text',
    tags: 'text',
    'location.name': 'text',
  },
  {
    weights: {
      title: 10,
      tags: 5,
      'location.name': 3,
      description: 1,
    },
    name: 'EventTextIndex',
  }
);

// Auto-generate slug if not provided
EventSchema.pre('validate', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

export const Event: Model<IEvent> =
  (mongoose.models?.Event as Model<IEvent>) ||
  mongoose.model<IEvent>('Event', EventSchema);

export default Event;
