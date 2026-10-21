'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  Code2,
  Terminal,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ApiExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEndpoint?: string;
}

export const ApiExplorerModal: React.FC<ApiExplorerModalProps> = ({
  isOpen,
  onClose,
  initialEndpoint = '/api/v1/events',
}) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [queryParams, setQueryParams] = useState({
    limit: '8',
    category: '',
    country: '',
    near: '',
    radius: '1000',
    search: '',
    sort: 'date.start:asc',
  });
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(
      {
        title: 'International Asteroid Day',
        description: 'Global awareness campaign marking the anniversary of the 1908 Tunguska event in Siberia.',
        category: 'astronomical',
        date: {
          start: '2026-06-30T10:00:00Z',
          isFloating: false,
        },
        location: {
          name: 'Luxembourg City & Global',
          country: 'LU',
          region: 'Europe',
          coordinates: {
            type: 'Point',
            coordinates: [6.1296, 49.6116],
          },
        },
        importance: 'medium',
        tags: ['asteroid', 'space', 'planetary-defense'],
      },
      null,
      2
    )
  );

  const [apiKey, setApiKey] = useState('chronos-master-key-2026');
  const [loading, setLoading] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build full URL
  const buildUrl = () => {
    let url = endpoint;
    if (method === 'GET' && endpoint.includes('/events')) {
      const sp = new URLSearchParams();
      if (queryParams.limit) sp.set('limit', queryParams.limit);
      if (queryParams.category) sp.set('category', queryParams.category);
      if (queryParams.country) sp.set('country', queryParams.country);
      if (queryParams.near) sp.set('near', queryParams.near);
      if (queryParams.radius && queryParams.near) sp.set('radius', queryParams.radius);
      if (queryParams.search) sp.set('search', queryParams.search);
      if (queryParams.sort) sp.set('sort', queryParams.sort);
      const str = sp.toString();
      if (str) url += `?${str}`;
    }
    return url;
  };

  const fullUrl = buildUrl();

  // Generate cURL command
  const curlCommand = `curl -X ${method} "${window.location.origin}${fullUrl}" \\
  -H "Content-Type: application/json"${
    method !== 'GET' ? ` \\\n  -H "x-api-key: ${apiKey}" \\\n  -d '${requestBody.replace(/\n/g, '')}'` : ''
  }`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeRequest = async () => {
    setLoading(true);
    setResponseCode(null);
    setResponseData(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (method === 'POST' || method === 'PUT') {
        options.body = requestBody;
      }

      const res = await fetch(fullUrl, options);
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setResponseCode(res.status);

      const hdrs: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        hdrs[k] = v;
      });
      setResponseHeaders(hdrs);

      const json = await res.json();
      setResponseData(json);
    } catch (err: unknown) {
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setResponseCode(500);
      setResponseData({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Interactive REST API Sandbox</h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">OpenAPI 3.1 & Mongoose Engine</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Endpoints:</span>
            <button
              onClick={() => {
                setMethod('GET');
                setEndpoint('/api/v1/events');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                endpoint === '/api/v1/events' && method === 'GET'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              GET /api/v1/events
            </button>
            <button
              onClick={() => {
                setMethod('GET');
                setEndpoint('/api/v1/events/stats');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                endpoint === '/api/v1/events/stats'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              GET /api/v1/events/stats
            </button>
            <button
              onClick={() => {
                setMethod('GET');
                setEndpoint('/api/v1/events/nowruz-persian-new-year');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                endpoint.includes('nowruz')
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              GET /api/v1/events/:slug
            </button>
            <button
              onClick={() => {
                setMethod('POST');
                setEndpoint('/api/v1/events');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                method === 'POST'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              POST /api/v1/events (Auth)
            </button>
          </div>

          {/* Request URL Bar */}
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-sky-400 focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={fullUrl}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
            />

            <button
              onClick={executeRequest}
              disabled={loading}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>

          {/* Query Parameters Accordion (when GET /api/v1/events) */}
          {method === 'GET' && endpoint.includes('/events') && (
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Query Filters & Geo-Spatial ($nearSphere)
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={queryParams.category}
                    onChange={(e) => setQueryParams({ ...queryParams, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                  >
                    <option value="">All Categories</option>
                    <option value="festival">festival</option>
                    <option value="cultural">cultural</option>
                    <option value="historical">historical</option>
                    <option value="astronomical">astronomical</option>
                    <option value="sports">sports</option>
                    <option value="science">science</option>
                    <option value="geopolitical">geopolitical</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Country (ISO)</label>
                  <input
                    type="text"
                    placeholder="e.g. IR, FR, ES"
                    value={queryParams.country}
                    onChange={(e) => setQueryParams({ ...queryParams, country: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Near [lng, lat]</label>
                  <input
                    type="text"
                    placeholder="52.89,29.93"
                    value={queryParams.near}
                    onChange={(e) => setQueryParams({ ...queryParams, near: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Radius (km)</label>
                  <input
                    type="number"
                    value={queryParams.radius}
                    onChange={(e) => setQueryParams({ ...queryParams, radius: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Text Search</label>
                  <input
                    type="text"
                    placeholder="Search terms..."
                    value={queryParams.search}
                    onChange={(e) => setQueryParams({ ...queryParams, search: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Limit (Page Size)</label>
                  <input
                    type="number"
                    value={queryParams.limit}
                    onChange={(e) => setQueryParams({ ...queryParams, limit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Sort Field</label>
                  <select
                    value={queryParams.sort}
                    onChange={(e) => setQueryParams({ ...queryParams, sort: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                  >
                    <option value="date.start:asc">date.start:asc</option>
                    <option value="date.start:desc">date.start:desc</option>
                    <option value="importance:desc">importance:desc</option>
                    <option value="title:asc">title:asc</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Request Payload Editor (for POST/PUT) */}
          {(method === 'POST' || method === 'PUT') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">JSON Body Payload</span>
                <span className="text-slate-500 font-mono">Validated against Zod schema</span>
              </div>
              <textarea
                rows={7}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full font-mono text-xs bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* cURL Generator */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Generated cURL Command</span>
              </span>
              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {curlCommand}
            </pre>
          </div>

          {/* Response Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Live API Response</span>
                {responseCode !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                      responseCode >= 200 && responseCode < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    HTTP {responseCode}
                  </span>
                )}
                {latencyMs !== null && (
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {latencyMs}ms
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto max-h-80 font-mono text-xs text-slate-200">
              {loading ? (
                <div className="text-slate-500 py-6 text-center animate-pulse">
                  Executing request and evaluating pipeline...
                </div>
              ) : responseData ? (
                <pre>{JSON.stringify(responseData, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 py-6 text-center">
                  Click &apos;Send Request&apos; to view live JSON response from the server.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiExplorerModal;
