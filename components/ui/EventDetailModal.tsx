'use client';

import React from 'react';
import {
  X,
  Calendar,
  MapPin,
  Tag,
  Compass,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { GlobeEvent } from '../3d/GlobeScene';

interface EventDetailModalProps {
  event: GlobeEvent | null;
  onClose: () => void;
  onFocusGlobe?: (event: GlobeEvent) => void;
  onOpenApiExplorer?: (endpoint: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onFocusGlobe,
  onOpenApiExplorer,
}) => {
  if (!event) return null;

  const [lng, lat] = event.location.coordinates.coordinates;
  const startDate = new Date(event.date.start);
  const formattedStart = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          {/* Zero-Pill unboxed metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-sky-400">
              {event.category}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{event.location.region}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{event.importance} priority</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
              {event.title}
            </h2>
            {event.date.solarHijriDate && (
              <div className="text-amber-400 font-medium text-sm flex items-center gap-2">
                <span>Solar Hijri Date:</span>
                <span className="font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {event.date.solarHijriDate}
                </span>
              </div>
            )}
          </div>

          {/* Time & Location Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-800/40 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-slate-400 font-medium">Event Date</span>
                <span className="text-slate-200 font-semibold">{formattedStart}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-slate-400 font-medium">Location</span>
                <span className="text-slate-200 font-semibold">{event.location.name}</span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                  [{lng.toFixed(4)}° E, {lat.toFixed(4)}° N]
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Historical & Cultural Overview
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Tags (Zero-Pill discipline: unboxed subtle text with typographic separators) */}
          {event.tags && event.tags.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500 font-medium">Associated Index Tags:</span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {event.tags.map((tag, i) => (
                  <React.Fragment key={tag}>
                    <span>#{tag}</span>
                    {i < event.tags!.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* API Link Callout */}
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-400 font-mono">
              GET /api/v1/events/{event.slug}
            </span>
            <div className="flex items-center gap-2">
              {onFocusGlobe && (
                <button
                  onClick={() => {
                    onFocusGlobe(event);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-md transition-colors flex items-center gap-1 font-medium"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Orbit Globe</span>
                </button>
              )}
              {onOpenApiExplorer && (
                <button
                  onClick={() => {
                    onOpenApiExplorer(`/api/v1/events/${event.slug}`);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-md transition-colors flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect API</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
