'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PageId } from './DashboardLayout';
import { Menu, User, Search, RefreshCw } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import NotificationCenter from '@/components/dashboard/NotificationCenter';

interface TopBarProps {
  onMenuToggle: () => void;
  onNavigate: (page: PageId) => void;
  onRefresh?: () => void;
}

export default function TopBar({ onMenuToggle, onNavigate, onRefresh }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30 overflow-visible">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, modules..."
            className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <NotificationCenter />

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {user ? getInitials(user.firstName, user.lastName) : <User className="w-4 h-4" />}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {user?.firstName}
          </span>
        </button>
      </div>
    </header>
  );
}
