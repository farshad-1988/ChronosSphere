'use client';

import React from 'react';
import { Calendar, MapPin, Tag, Compass, Sparkles, ExternalLink } from 'lucide-react';
import { GlobeEvent } from '../3d/GlobeScene';

interface EventCardProps {
  event: GlobeEvent;
  isSelected?: boolean;
  onSelect: (event: GlobeEvent) => void;
  onFocusGlobe?: (event: GlobeEvent) => void;
  onInspectApi?: (event: GlobeEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSelected,
  onSelect,
  onFocusGlobe,
  onInspectApi,
}) => {
  const startDate = new Date(event.date.start);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(event)}
      className={`group relative rounded-xl border p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-slate-900/95 border-sky-500/80 shadow-lg shadow-sky-500/10'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Zero-Pill Header: Clean unboxed metadata with typographic separators */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-sky-400">
            {event.category}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{event.location.country}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{event.importance} priority</span>
        </div>
        {event.date.solarHijriDate && (
          <span className="text-amber-400/90 text-[11px] font-medium">
            {event.date.solarHijriDate}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors mb-2 leading-snug">
        {event.title}
      </h3>

      {/* Description Snippet */}
      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
        {event.description}
      </p>

      {/* Location & Date Footer */}
      <div className="flex flex-col gap-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{event.location.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {onFocusGlobe && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusGlobe(event);
                }}
                className="text-sky-400 hover:text-sky-300 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Locate on 3D Globe"
              >
                <Compass className="w-3 h-3" />
                <span>Locate</span>
              </button>
            )}
            {onInspectApi && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectApi(event);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Inspect API JSON"
              >
                <ExternalLink className="w-3 h-3" />
                <span>API</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
