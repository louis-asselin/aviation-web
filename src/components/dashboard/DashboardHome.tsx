'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi, logbooksApi } from '@/lib/api';
import { Users, Eye, BookOpen, TrendingUp, Megaphone, Plane, Clock, MapPin, Calendar } from 'lucide-react';
import { getRoleLabel, formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Helper to call API with token
async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default function DashboardHome() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin';

  if (isAdmin) {
    return <AdminDashboard />;
  }
  return <UserDashboard />;
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────
function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [analyticsData, usersData] = await Promise.allSettled([
          analyticsApi.adminOverview(token, '30d'),
          apiFetch('/users?limit=1', token),
        ]);

        if (analyticsData.status === 'fulfilled') setStats(analyticsData.value);
        if (usersData.status === 'fulfilled') {
          const val = usersData.value as any;
          setUserCount(val.total || (Array.isArray(val) ? val.length : 0));
        }
      } catch (e) {
        console.error('Admin dashboard load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold">Administration Panel</h1>
        <p className="text-white/80 mt-2">Welcome back, {user?.firstName}. Here&apos;s an overview of your platform.</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          {getRoleLabel(user?.role || '')}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Users"
          value={userCount}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Active Sessions (30d)"
          value={stats?.totalSessions ?? '—'}
          color="bg-green-500"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Content Views"
          value={stats?.totalCourseTime ? `${Math.round(stats.totalCourseTime / 60)}h` : '—'}
          color="bg-purple-500"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg. Score"
          value={stats?.averageScore ? `${Math.round(stats.averageScore)}%` : '—'}
          color="bg-amber-500"
        />
      </div>

      {/* Most viewed content + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most viewed content */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-accent-500" />
            <h2 className="text-lg font-semibold text-gray-900">Most Viewed Content</h2>
          </div>
          {stats?.topCourses && stats.topCourses.length > 0 ? (
            <div className="space-y-3">
              {stats.topCourses.slice(0, 5).map((course: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title || course.name}</p>
                    <p className="text-xs text-gray-500">{course.enrollmentCount || course.views || 0} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No content data available yet.</p>
          )}
        </div>

        {/* User distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent-500" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Users</span>
              <span className="text-2xl font-bold text-gray-900">{userCount}</span>
            </div>
            {stats?.roleDistribution ? (
              Object.entries(stats.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">{getRoleLabel(role)}</span>
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Active Sessions Today</span>
                  <span className="font-semibold text-gray-900">{stats?.activeSessions ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">New Users (30d)</span>
                  <span className="font-semibold text-gray-900">{stats?.newUsers ?? '—'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// USER DASHBOARD
// ─────────────────────────────────────────────
function UserDashboard() {
  const { user, token } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [logbookStats, setLogbookStats] = useState<any>(null);
  const [recentFlights, setRecentFlights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = (user as any)?.subscriptionTier === 'premium' || (user as any)?.role === 'admin' || (user as any)?.role === 'org_admin';

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [announcementsData, statsData, flightsData] = await Promise.allSettled([
          apiFetch('/announcements/me', token),
          logbooksApi.stats(token),
          logbooksApi.list(token, { page: 1, limit: 5 }),
        ]);

        if (announcementsData.status === 'fulfilled') {
          const val = announcementsData.value;
          setAnnouncements(Array.isArray(val) ? val : []);
        }
        if (statsData.status === 'fulfilled') setLogbookStats(statsData.value);
        if (flightsData.status === 'fulfilled') {
          const val = flightsData.value as any;
          setRecentFlights(val.data || []);
        }
      } catch (e) {
        console.error('User dashboard load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  if (isLoading) return <LoadingSkeleton />;

  const totalHours = logbookStats?.totalFlightTime
    ? (logbookStats.totalFlightTime / 60).toFixed(1)
    : '0';
  const totalFlights = logbookStats?.totalEntries ?? 0;
  const totalAirports = logbookStats?.uniqueAirports ?? 0;
  const totalAircraft = logbookStats?.uniqueAircraft ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold">Welcome back, {user?.firstName}</h1>
        <p className="text-white/80 mt-2">Track your flights, access your training content, and use aviation tools.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            {getRoleLabel(user?.role || '')}
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm ${isPremium ? 'bg-yellow-400/20' : 'bg-white/10'}`}>
            {isPremium ? '★ Premium' : 'Basic'}
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.slice(0, 3).map((ann: any) => (
            <div key={ann.id} className="card border-l-4 border-accent-500 bg-accent-50/30">
              <div className="flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{ann.createdAt ? formatDate(ann.createdAt) : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {announcements.length === 0 && (
        <div className="card border-l-4 border-gray-200">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-gray-400" />
            <p className="text-sm text-gray-500">No announcements at the moment.</p>
          </div>
        </div>
      )}

      {/* Logbook stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Hours"
          value={`${totalHours}h`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Plane className="w-5 h-5" />}
          label="Flights"
          value={totalFlights}
          color="bg-green-500"
        />
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="Airports"
          value={totalAirports}
          color="bg-purple-500"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Aircraft Types"
          value={totalAircraft}
          color="bg-amber-500"
        />
      </div>

      {/* Recent flights */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-accent-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Flights</h2>
          </div>
          <span className="text-sm text-gray-500">{totalFlights} total</span>
        </div>
        {recentFlights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Plane className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No flights recorded yet. Start logging your flights!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFlights.map((flight: any) => (
              <div key={flight.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-accent-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">
                    {flight.departureAirport || '?'} → {flight.arrivalAirport || '?'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {flight.date ? formatDate(flight.date) : '—'} · {flight.aircraftType || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {flight.totalFlightTime ? `${(flight.totalFlightTime / 60).toFixed(1)}h` : '—'}
                  </p>
                  <p className="text-xs text-gray-500">{flight.functionType || ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
