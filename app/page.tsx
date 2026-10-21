'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Database,
  Code2,
  Terminal,
  Search,
  Filter,
  Layers,
  Sparkles,
  Compass,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { GlobeScene, GlobeEvent } from '@/components/3d/GlobeScene';
import { EventCard } from '@/components/ui/EventCard';
import { ApiExplorerModal } from '@/components/ui/ApiExplorerModal';
import { EventDetailModal } from '@/components/ui/EventDetailModal';
import { DateRangeFilter, DateRangeState } from '@/components/ui/DateRangeFilter';

export default function WorldEventsShowcasePage() {
  const [events, setEvents] = useState<GlobeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });
  const [activeView, setActiveView] = useState<'globe' | 'split' | 'grid'>('split');
  const [selectedEvent, setSelectedEvent] = useState<GlobeEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('/api/v1/events');
  const [metrics, setMetrics] = useState({
    totalEvents: 25,
    categoriesCount: 7,
    countriesCount: 16,
    upcomingCount: 8,
  });

  // Fetch initial events and stats from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/events?limit=50&sort=date.start:asc');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setEvents(json.data);
          }
        }

        const statsRes = await fetch('/api/v1/events/stats');
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          if (statsJson.data) {
            setMetrics({
              totalEvents: statsJson.data.totalEvents || 25,
              categoriesCount: Object.keys(statsJson.data.categories || {}).length || 7,
              countriesCount: statsJson.data.countryDistribution?.length || 16,
              upcomingCount: statsJson.data.upcomingHighlights?.length || 8,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load events:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      const matchImp = selectedImportance === 'all' || e.importance === selectedImportance;
      const matchSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Date Range Filtering
      let matchDate = true;
      if (dateRange.startDate) {
        const filterStartTime = new Date(dateRange.startDate).getTime();
        const eventStartTime = new Date(e.date.start).getTime();
        if (eventStartTime < filterStartTime) {
          matchDate = false;
        }
      }
      if (dateRange.endDate && matchDate) {
        const filterEndTime = new Date(`${dateRange.endDate}T23:59:59.999Z`).getTime();
        const eventStartTime = new Date(e.date.start).getTime();
        if (eventStartTime > filterEndTime) {
          matchDate = false;
        }
      }

      return matchCat && matchImp && matchSearch && matchDate;
    });
  }, [events, selectedCategory, selectedImportance, searchQuery, dateRange]);

  const handleSelectEvent = (event: GlobeEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleFocusGlobe = (event: GlobeEvent) => {
    setSelectedEvent(event);
    if (activeView === 'grid') {
      setActiveView('split');
    }
  };

  const handleOpenApiExplorer = (endpoint: string) => {
    setApiEndpoint(endpoint);
    setIsApiModalOpen(true);
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'festival', label: 'Festivals' },
    { id: 'cultural', label: 'Cultural' },
    { id: 'historical', label: 'Historical' },
    { id: 'astronomical', label: 'Astronomical' },
    { id: 'sports', label: 'Sports' },
    { id: 'science', label: 'Science' },
    { id: 'geopolitical', label: 'Geopolitical' },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3-Zone architecture strictly following frontend-design skill */}
      <header className="sticky top-0 z-40 bg-[#060913]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Globe className="w-5 h-5 text-sky-400" />
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            ChronosSphere
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => {
              setActiveView('split');
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            3D Globe
          </button>
          <button
            onClick={() => {
              setActiveView('grid');
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Events Directory
          </button>
          <button
            onClick={() => handleOpenApiExplorer('/api/v1/events')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            REST API
          </button>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span>OpenAPI Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleOpenApiExplorer('/api/v1/events')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-sky-500/20 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API Sandbox</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-10 pb-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-8">
          {/* Zero-Pill kicker */}
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
            Global Spatiotemporal Platform
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight mb-4">
            World Events REST API & 3D Interactive Explorer
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed text-balance">
            High-precision RESTful API backed by MongoDB, Mongoose, and GeoJSON 2dsphere indexing.
            Explore historical milestones, ancient Persian festivals, international celebrations,
            and astronomical events on a real-time 3D Earth Globe.
          </p>
        </div>

        {/* Live Metrics Strip with Tabular Numerals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 mb-8">
          <div>
            <div className="text-xs text-slate-500 font-medium">Curated Global Events</div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-0.5">
              {metrics.totalEvents}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Event Categories</div>
            <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums mt-0.5">
              {metrics.categoriesCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Countries & Territories</div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-0.5">
              {metrics.countriesCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">GeoJSON 2dsphere Index</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
              Active
            </div>
          </div>
        </div>

        {/* View Switcher & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, tags, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveView('globe')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeView === 'globe'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D Globe Only
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeView === 'split'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dual Split View
            </button>
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeView === 'grid'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Directory Grid
            </button>
          </div>
        </div>

        {/* Category Tabs (Clean button controls adhering to Zero-Pill discipline) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Date Range Filter Component */}
        <DateRangeFilter
          dateRange={dateRange}
          onChange={setDateRange}
          filteredCount={filteredEvents.length}
          totalCount={events.length}
        />

        {/* Main Content Layout */}
        <div className="space-y-6">
          {/* 3D Globe Section (Visible in 'globe' and 'split' views) */}
          {(activeView === 'globe' || activeView === 'split') && (
            <div className="w-full">
              <GlobeScene
                events={filteredEvents}
                selectedEventId={selectedEvent?.slug}
                onSelectEvent={handleSelectEvent}
                activeCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          )}

          {/* Events Grid Section (Visible in 'split' and 'grid' views) */}
          {(activeView === 'split' || activeView === 'grid') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Discovered Events
                  </h2>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    ({filteredEvents.length} items)
                  </span>
                </div>
                <button
                  onClick={() => handleOpenApiExplorer('/api/v1/events')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>Query in REST Sandbox</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-44 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-900/30 border border-slate-800">
                  <p className="text-slate-400 text-sm">No events match your current filter criteria.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      setDateRange({ preset: 'all', startDate: '', endDate: '' });
                    }}
                    className="mt-3 px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map((evt) => (
                    <EventCard
                      key={evt.slug}
                      event={evt}
                      isSelected={selectedEvent?.slug === evt.slug}
                      onSelect={handleSelectEvent}
                      onFocusGlobe={handleFocusGlobe}
                      onInspectApi={() => handleOpenApiExplorer(`/api/v1/events/${evt.slug}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 px-6 py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>ChronosSphere World Events Platform · Powered by MongoDB & Next.js</div>
        <div className="flex items-center gap-4">
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            OpenAPI Reference
          </a>
          <button
            onClick={() => handleOpenApiExplorer('/api/v1/events/stats')}
            className="hover:text-slate-300 transition-colors"
          >
            Stats Endpoint
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ApiExplorerModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        initialEndpoint={apiEndpoint}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setIsDetailModalOpen(false)}
        onFocusGlobe={handleFocusGlobe}
        onOpenApiExplorer={handleOpenApiExplorer}
      />
    </div>
  );
}
