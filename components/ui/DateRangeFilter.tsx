'use client';

import React, { useState } from 'react';
import { Calendar, Clock, X, RotateCcw, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export type DatePreset = 'all' | 'upcoming' | '2026' | 'modern' | 'historical' | 'custom';

export interface DateRangeState {
  preset: DatePreset;
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
}

interface DateRangeFilterProps {
  dateRange: DateRangeState;
  onChange: (newRange: DateRangeState) => void;
  filteredCount?: number;
  totalCount?: number;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onChange,
  filteredCount,
  totalCount,
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(dateRange.preset === 'custom');

  const presets: { id: DatePreset; label: string; start: string; end: string }[] = [
    { id: 'all', label: 'All Epochs', start: '', end: '' },
    { id: 'upcoming', label: 'Upcoming (From Now)', start: '2026-10-21', end: '' },
    { id: '2026', label: 'Year 2026', start: '2026-01-01', end: '2026-12-31' },
    { id: 'modern', label: 'Modern (2000–2025)', start: '2000-01-01', end: '2025-12-31' },
    { id: 'historical', label: 'Historical (< 2000)', start: '1900-01-01', end: '1999-12-31' },
  ];

  const handleSelectPreset = (preset: { id: DatePreset; start: string; end: string }) => {
    if (preset.id === 'all') {
      setIsCustomOpen(false);
      onChange({ preset: 'all', startDate: '', endDate: '' });
      return;
    }

    setIsCustomOpen(false);
    onChange({
      preset: preset.id,
      startDate: preset.start,
      endDate: preset.end,
    });
  };

  const handleCustomToggle = () => {
    const nextState = !isCustomOpen;
    setIsCustomOpen(nextState);
    if (nextState) {
      onChange({
        ...dateRange,
        preset: 'custom',
      });
    }
  };

  const handleReset = () => {
    setIsCustomOpen(false);
    onChange({ preset: 'all', startDate: '', endDate: '' });
  };

  const isFiltered = dateRange.preset !== 'all' || dateRange.startDate !== '' || dateRange.endDate !== '';

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Button Segmented Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Timeframe:</span>
          </div>

          {presets.map((p) => {
            const isActive = dateRange.preset === p.id && !isCustomOpen;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleCustomToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              isCustomOpen || dateRange.preset === 'custom'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>Custom Dates</span>
            {isCustomOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Clear / Active Feedback */}
        {isFiltered && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">
              Active: <strong className="text-sky-300 font-medium">{dateRange.startDate || 'Beginning'}</strong> to{' '}
              <strong className="text-sky-300 font-medium">{dateRange.endDate || 'Present/Future'}</strong>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-slate-700/80 transition-colors flex items-center gap-1"
              title="Clear date filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Custom Date Inputs */}
      {isCustomOpen && (
        <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 font-medium">Start Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                onChange({
                  preset: 'custom',
                  startDate: e.target.value,
                  endDate: dateRange.endDate,
                })
              }
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400 font-medium">End Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                onChange({
                  preset: 'custom',
                  startDate: dateRange.startDate,
                  endDate: e.target.value,
                })
              }
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          {(dateRange.startDate || dateRange.endDate) && (
            <button
              type="button"
              onClick={() => onChange({ preset: 'custom', startDate: '', endDate: '' })}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Inputs</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
