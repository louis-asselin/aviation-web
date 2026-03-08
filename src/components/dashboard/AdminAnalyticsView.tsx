'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsApi, AdminAnalytics } from '@/lib/api';
import {
  Users, Clock, Activity, Download, UserCheck, Monitor
} from 'lucide-react';

export default function AdminAnalyticsView() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    analyticsApi.adminOverview(token, period)
      .then(setAnalytics)
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [token, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={() => setPeriod(period)} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  if (!analytics) return null;

  const genderLabels: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other', unspecified: 'Unspecified' };
  const roleLabels: Record<string, string> = { admin: 'Admin', org_admin: 'Org Admin', instructor: 'Instructor', student: 'Student', pilot: 'Pilot' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {[
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
            { label: 'All Time', value: 'all' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                period === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<Monitor className="w-5 h-5" />} label="Users Online Now" value={analytics.concurrentUsers} color="green" />
        <KPICard icon={<Users className="w-5 h-5" />} label="Active Students" value={analytics.totalActiveStudents} color="blue" />
        <KPICard icon={<UserCheck className="w-5 h-5" />} label="Active (7 days)" value={analytics.activeStudentsLast7Days} color="indigo" />
        <KPICard icon={<UserCheck className="w-5 h-5" />} label="Active (30 days)" value={analytics.activeStudentsLast30Days} color="purple" />
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<Clock className="w-5 h-5" />} label="Study Hours (week)" value={`${Math.round(analytics.totalStudyHoursThisWeek)}h`} color="orange" />
        <KPICard icon={<Activity className="w-5 h-5" />} label="Total App Time" value={`${Math.round(analytics.totalAppTimeHours)}h`} color="cyan" />
        <KPICard icon={<Download className="w-5 h-5" />} label="Offline Downloads" value={analytics.offlineDownloadsCount} color="gray" />
        <KPICard icon={<Users className="w-5 h-5" />} label="Total Students" value={analytics.totalActiveStudents} color="blue" />
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Gender Distribution</h3>
          {Object.keys(analytics.genderDistribution).length === 0 ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.genderDistribution).map(([gender, count]) => {
                const total = Object.values(analytics.genderDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={gender}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{genderLabels[gender] || gender}</span>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Role Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Role Distribution</h3>
          {Object.keys(analytics.roleDistribution).length === 0 ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.roleDistribution).map(([role, count]) => {
                const total = Object.values(analytics.roleDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, string> = { admin: 'bg-red-500', org_admin: 'bg-orange-500', instructor: 'bg-blue-500', student: 'bg-green-500', pilot: 'bg-purple-500' };
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{roleLabels[role] || role}</span>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${colors[role] || 'bg-gray-500'} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Courses by Study Time */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Courses by Study Time</h3>
        {analytics.topCoursesByTime.length === 0 ? (
          <p className="text-sm text-gray-400">No data available</p>
        ) : (
          <div className="space-y-3">
            {analytics.topCoursesByTime.map((course, i) => {
              const hours = Math.round(course.totalTime / 3600);
              const maxTime = analytics.topCoursesByTime[0]?.totalTime || 1;
              const pct = Math.round((course.totalTime / maxTime) * 100);
              return (
                <div key={course.courseId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{i + 1}. {course.courseTitle}</span>
                    <span className="font-medium">{hours}h</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Time by Organization */}
      {analytics.courseTimeByOrg.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Course Time by Organization</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-500">Organization</th>
                  <th className="text-left py-2 font-medium text-gray-500">Course</th>
                  <th className="text-right py-2 font-medium text-gray-500">Hours</th>
                </tr>
              </thead>
              <tbody>
                {analytics.courseTimeByOrg.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{row.orgName}</td>
                    <td className="py-2 text-gray-600">{row.courseTitle}</td>
                    <td className="py-2 text-right font-medium">{Math.round(row.totalSeconds / 3600)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pass Rate by Promotion */}
      {analytics.passRateByPromotion.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Pass Rate by Promotion</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-500">Promotion</th>
                  <th className="text-right py-2 font-medium text-gray-500">Attempts</th>
                  <th className="text-right py-2 font-medium text-gray-500">Avg Score</th>
                  <th className="text-right py-2 font-medium text-gray-500">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.passRateByPromotion.map((row) => (
                  <tr key={row.promotion} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700 font-medium">{row.promotion}</td>
                    <td className="py-2 text-right text-gray-600">{row.attemptCount}</td>
                    <td className="py-2 text-right text-gray-600">{Math.round(row.avgScore)}%</td>
                    <td className="py-2 text-right">
                      <span className={`font-medium ${row.passRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.passRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pass Rate by Gender */}
      {analytics.passRateByGender.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Pass Rate by Gender</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {analytics.passRateByGender.map((row) => (
              <div key={row.gender} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">{genderLabels[row.gender] || row.gender}</p>
                <p className="text-2xl font-bold text-gray-900">{row.passRate}%</p>
                <p className="text-xs text-gray-400">{row.attemptCount} attempts - Avg {Math.round(row.avgScore)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card component
function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.gray}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
