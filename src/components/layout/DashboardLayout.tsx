'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import AdminUsersView from '@/components/dashboard/AdminUsersView';
import SettingsView from '@/components/dashboard/SettingsView';
import ProfileView from '@/components/dashboard/ProfileView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import BugReportsView from '@/components/dashboard/BugReportsView';
import LogbookPageWrapper from '@/components/dashboard/LogbookPageWrapper';
import AdminLogbookView from '@/components/dashboard/AdminLogbookView';
import ContentBrowserView from '@/components/dashboard/ContentBrowserView';
import ToolsView from '@/components/dashboard/ToolsView';

export type PageId = 'dashboard' | 'content' | 'users' | 'audit-logs' | 'bug-reports' | 'logbook' | 'admin-logbooks' | 'tools' | 'settings' | 'profile';

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'content':
        return <ContentBrowserView />;
      case 'users':
        return <AdminUsersView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'bug-reports':
        return <BugReportsView />;
      case 'logbook':
        return <LogbookPageWrapper />;
      case 'admin-logbooks':
        return <AdminLogbookView />;
      case 'tools':
        return <ToolsView />;
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          onNavigate={setCurrentPage}
          onRefresh={handleRefresh}
        />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div key={refreshKey}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
