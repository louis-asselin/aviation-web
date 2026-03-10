'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logbooksApi, LogbookStats, LogbookRoute } from '@/lib/api';
import { MapPin, Clock, Plane, BarChart3 } from 'lucide-react';

// ─── ICAO Airport Coordinates (major airports) ─────────────
// This is a simplified set; a full DB could be loaded from a JSON file
const AIRPORT_COORDS: Record<string, [number, number]> = {
  // France
  LFPG: [49.0097, 2.5479], LFPO: [48.7233, 2.3794], LFBO: [43.6293, 1.3638],
  LFML: [43.4393, 5.2214], LFLL: [45.7256, 5.0911], LFMN: [43.6584, 7.2159],
  LFBD: [44.8283, -0.7156], LFRS: [47.1532, -1.6107], LFSB: [47.5896, 7.5299],
  LFST: [48.5383, 7.6282], LFPB: [48.9694, 2.4414], LFOB: [49.4544, 2.1128],
  // UK
  EGLL: [51.4706, -0.4619], EGKK: [51.1481, -0.1903], EGLC: [51.5053, 0.0553],
  EGSS: [51.885, 0.235], EGCC: [53.3537, -2.275], EGBB: [52.4539, -1.748],
  // Germany
  EDDF: [50.0333, 8.5706], EDDM: [48.3538, 11.7861], EDDB: [52.3514, 13.4939],
  EDDL: [51.2895, 6.7668], EDDH: [53.6304, 9.9882],
  // Spain
  LEMD: [40.4719, -3.5626], LEBL: [41.2971, 2.0785], LEPA: [39.5517, 2.7388],
  LEMG: [36.675, -4.499], LEAL: [38.2822, -0.5582],
  // Italy
  LIRF: [41.8003, 12.2389], LIMC: [45.63, 8.7231], LIPZ: [45.5053, 12.3519],
  LIRN: [40.886, 14.2908],
  // Others Europe
  EHAM: [52.3086, 4.7639], EBBR: [50.9014, 4.4844], LSZH: [47.4647, 8.5492],
  LOWW: [48.1103, 16.5697], LPPT: [38.7813, -9.1359], LGAV: [37.9364, 23.9445],
  LTFM: [41.2751, 28.7519], EKCH: [55.618, 12.656], ENGM: [60.1939, 11.1004],
  ESSA: [59.6519, 17.9186], EFHK: [60.3172, 24.9633],
  // North America
  KJFK: [40.6413, -73.7781], KLAX: [33.9425, -118.408], KORD: [41.9742, -87.9073],
  KATL: [33.6407, -84.4277], KDFW: [32.8998, -97.0403], CYYZ: [43.6777, -79.6248],
  // Middle East / Asia
  OMDB: [25.2528, 55.3644], OERK: [24.9576, 46.6988], VHHH: [22.3089, 113.9185],
  RJTT: [35.5533, 139.7811], WSSS: [1.3502, 103.9944],
};

function minutesToHHMM(min: number): string {
  if (!min || min <= 0) return '0:00';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// ─── Period helpers ────────────────────────────────────────

function getDateRange(period: string): { startDate: string; endDate: string } {
  const end = new Date();
  const endStr = end.toISOString().split('T')[0];
  const start = new Date();

  switch (period) {
    case '7d': start.setDate(start.getDate() - 7); break;
    case '1m': start.setMonth(start.getMonth() - 1); break;
    case '6m': start.setMonth(start.getMonth() - 6); break;
    case '1y': start.setFullYear(start.getFullYear() - 1); break;
    default: start.setFullYear(start.getFullYear() - 1);
  }

  return { startDate: start.toISOString().split('T')[0], endDate: endStr };
}

// ─── Map Component (uses inline SVG) ──────────────────────
// We draw routes on a simple equirectangular projection instead of
// requiring a full mapping library like Leaflet

function SimpleRouteMap({ routes }: { routes: LogbookRoute[] }) {
  // Gather all coordinates
  const lines = useMemo(() => {
    return routes
      .filter(r => AIRPORT_COORDS[r.dep] && AIRPORT_COORDS[r.dest])
      .map(r => ({
        dep: r.dep,
        dest: r.dest,
        depCoord: AIRPORT_COORDS[r.dep],
        destCoord: AIRPORT_COORDS[r.dest],
        count: r.count,
      }));
  }, [routes]);

  const airports = useMemo(() => {
    const set: Record<string, { coord: [number, number]; count: number }> = {};
    for (const r of routes) {
      if (AIRPORT_COORDS[r.dep]) {
        set[r.dep] = set[r.dep] || { coord: AIRPORT_COORDS[r.dep], count: 0 };
        set[r.dep].count += r.count;
      }
      if (AIRPORT_COORDS[r.dest]) {
        set[r.dest] = set[r.dest] || { coord: AIRPORT_COORDS[r.dest], count: 0 };
        set[r.dest].count += r.count;
      }
    }
    return Object.entries(set).map(([icao, data]) => ({ icao, ...data }));
  }, [routes]);

  if (lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-xl border">
        <p className="text-gray-400">No routes to display for this period</p>
      </div>
    );
  }

  // Compute bounds
  const allLats = airports.map(a => a.coord[0]);
  const allLons = airports.map(a => a.coord[1]);
  const minLat = Math.min(...allLats) - 2;
  const maxLat = Math.max(...allLats) + 2;
  const minLon = Math.min(...allLons) - 2;
  const maxLon = Math.max(...allLons) + 2;

  const W = 800, H = 400;
  const toX = (lon: number) => ((lon - minLon) / (maxLon - minLon)) * W;
  const toY = (lat: number) => H - ((lat - minLat) / (maxLat - minLat)) * H;

  const maxCount = Math.max(...lines.map(l => l.count), 1);

  return (
    <div className="rounded-xl border bg-gradient-to-b from-blue-50 to-blue-100 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-80">
        {/* Routes */}
        {lines.map((l, i) => {
          const opacity = 0.3 + (l.count / maxCount) * 0.7;
          const width = 1 + (l.count / maxCount) * 3;
          return (
            <line
              key={i}
              x1={toX(l.depCoord[1])} y1={toY(l.depCoord[0])}
              x2={toX(l.destCoord[1])} y2={toY(l.destCoord[0])}
              stroke="#1B3A6B"
              strokeWidth={width}
              opacity={opacity}
              strokeLinecap="round"
            />
          );
        })}

        {/* Airports */}
        {airports.map(a => {
          const r = 3 + (a.count / Math.max(...airports.map(x => x.count), 1)) * 6;
          return (
            <g key={a.icao}>
              <circle cx={toX(a.coord[1])} cy={toY(a.coord[0])} r={r} fill="#E8A630" stroke="#fff" strokeWidth={1.5} />
              <text x={toX(a.coord[1])} y={toY(a.coord[0]) - r - 3} textAnchor="middle" fontSize={8} fill="#333" fontWeight="bold">
                {a.icao}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function LogbookMapsView() {
  const { token } = useAuth();
  const [period, setPeriod] = useState('1y');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [stats, setStats] = useState<LogbookStats | null>(null);
  const [routes, setRoutes] = useState<LogbookRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    const range = period === 'custom'
      ? { startDate: customStart, endDate: customEnd }
      : getDateRange(period);

    try {
      const [s, r] = await Promise.all([
        logbooksApi.stats(token, range.startDate, range.endDate),
        logbooksApi.statsRoutes(token, range.startDate, range.endDate),
      ]);
      setStats(s);
      setRoutes(r);
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [token, period, customStart, customEnd]);

  useEffect(() => {
    if (period !== 'custom') fetchData();
  }, [period, fetchData]);

  const applyCustom = () => {
    if (customStart && customEnd) fetchData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { val: '7d', label: 'Last 7 days' },
          { val: '1m', label: 'Last Month' },
          { val: '6m', label: 'Last 6 Months' },
          { val: '1y', label: 'Last Year' },
          { val: 'custom', label: 'Custom' },
        ].map(p => (
          <button
            key={p.val}
            onClick={() => setPeriod(p.val)}
            className={`px-4 py-2 text-sm rounded-full font-medium transition ${
              period === p.val
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}

        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            <span className="text-gray-400">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            <button onClick={applyCustom}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Apply</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Map */}
          <SimpleRouteMap routes={routes} />

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalFlights}</p>
                  <p className="text-xs text-gray-500">Total Flights</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{minutesToHHMM(stats.totalBlockMinutes)}</p>
                  <p className="text-xs text-gray-500">Block Time</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{minutesToHHMM(stats.totalFlightMinutes)}</p>
                  <p className="text-xs text-gray-500">Flight Time</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.airports.length}</p>
                  <p className="text-xs text-gray-500">Airports Visited</p>
                </div>
              </div>
            </div>
          )}

          {/* Time breakdown */}
          {stats && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Time Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'IFR', val: stats.ifrMinutes },
                  { label: 'Night', val: stats.nightMinutes },
                  { label: 'PIC', val: stats.picMinutes },
                  { label: 'SIC', val: stats.sicMinutes },
                  { label: 'Cross Country', val: stats.xcMinutes },
                  { label: 'Multi-Pilot', val: stats.multiPilotMinutes },
                  { label: 'Dual Received', val: stats.dualReceivedMinutes },
                  { label: 'Dual Given', val: stats.dualGivenMinutes },
                  { label: 'Simulator', val: stats.simulatorMinutes },
                ].filter(x => x.val > 0).map(({ label, val }) => (
                  <div key={label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="font-mono font-bold text-lg">{minutesToHHMM(val)}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most frequented airports */}
          {stats && stats.airports.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Top Airports</h3>
                <div className="space-y-2">
                  {stats.airports.slice(0, 10).map((a, i) => (
                    <div key={a.icao} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                        <span className="font-mono font-semibold text-sm">{a.icao}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-blue-200 rounded-full" style={{ width: `${(a.count / stats.airports[0].count) * 100}px` }} />
                        <span className="text-xs text-gray-500 w-8 text-right">{a.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Top Routes</h3>
                <div className="space-y-2">
                  {stats.routes.slice(0, 10).map((r, i) => (
                    <div key={`${r.dep}-${r.dest}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                        <span className="font-mono text-sm">{r.dep} → {r.dest}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{r.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
