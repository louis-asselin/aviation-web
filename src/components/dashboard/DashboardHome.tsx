'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, coursesApi, announcementsApi, Course, Announcement } from '@/lib/api';
import { BookOpen, Clock, TrendingUp, CheckCircle2, Megaphone } from 'lucide-react';
import { formatDate, getRoleLabel } from '@/lib/utils';

export default function DashboardHome() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [coursesData, statsData] = await Promise.allSettled([
          coursesApi.list(token),
          dashboardApi.stats(token),
        ]);

        if (coursesData.status === 'fulfilled') {
          const val = coursesData.value;
          setCourses(Array.isArray(val) ? val : []);
        }
        if (statsData.status === 'fulfilled') setStats(statsData.value as Record<string, unknown>);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  const isAdmin = user?.role === 'admin' || user?.role === 'org_admin';
  const isInstructor = user?.role === 'instructor';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-white/80 mt-2">
          {isAdmin
            ? 'Manage your platform and monitor user activity.'
            : isInstructor
            ? 'Track your students\' progress and manage courses.'
            : 'Continue your training and track your progress.'}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          {getRoleLabel(user?.role || '')}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Enrolled Courses"
          value={courses.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg. Progress"
          value={courses.length > 0
            ? `${Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)}%`
            : '0%'
          }
          color="bg-green-500"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Active Modules"
          value={courses.reduce((acc, c) => acc + (c.moduleCount || 0), 0)}
          color="bg-purple-500"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={courses.filter(c => c.progress === 100).length}
          color="bg-amber-500"
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses list */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
              <span className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No courses enrolled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-accent-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">{course.title}</h3>
                      <p className="text-xs text-gray-500">{course.moduleCount || 0} modules</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full transition-all"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10 text-right">
                        {course.progress || 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick info panel */}
        <div className="space-y-6">
          {/* Account info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="text-gray-900 font-medium">{getRoleLabel(user?.role || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member since</span>
                <span className="text-gray-900 font-medium">{user?.createdAt ? formatDate(user.createdAt) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Terms accepted</span>
                <span className={`font-medium ${user?.acceptedTermsAt ? 'text-green-600' : 'text-orange-500'}`}>
                  {user?.acceptedTermsAt ? 'Yes' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Announcements placeholder */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-accent-500" />
              <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
            </div>
            <div className="text-center py-4 text-gray-500 text-sm">
              <p>No recent announcements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
