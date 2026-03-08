'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import CoursesView from '@/components/dashboard/CoursesView';
import AdminCoursesView from '@/components/dashboard/AdminCoursesView';
import AdminUsersView from '@/components/dashboard/AdminUsersView';
import AdminOrgsView from '@/components/dashboard/AdminOrgsView';
import SettingsView from '@/components/dashboard/SettingsView';
import ProfileView from '@/components/dashboard/ProfileView';
import AdminAnalyticsView from '@/components/dashboard/AdminAnalyticsView';
import StudentTrackingView from '@/components/dashboard/StudentTrackingView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';

export type PageId = 'dashboard' | 'content' | 'courses' | 'users' | 'organizations' | 'analytics' | 'tracking' | 'audit-logs' | 'settings' | 'profile';

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'content':
        return <AdminCoursesView />;
      case 'courses':
        return <CoursesView />;
      case 'users':
        return <AdminUsersView />;
      case 'organizations':
        return <AdminOrgsView />;
      case 'analytics':
        return <AdminAnalyticsView />;
      case 'tracking':
        return <StudentTrackingView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h2>
              <p className="text-gray-500">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          onNavigate={setCurrentPage}
        />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
