'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PageId } from './DashboardLayout';
import {
  LayoutDashboard, BookOpen, Users,
  Building2, BarChart3, Settings, Plane, X, LogOut, ClipboardList
} from 'lucide-react';
import { getRoleLabel, getInitials } from '@/lib/utils';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" />, roles: ['admin', 'org_admin'] },
  { id: 'organizations', label: 'Organizations', icon: <Building2 className="w-5 h-5" />, roles: ['admin'] },
  { id: 'tracking', label: 'ATPL Tracking', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'org_admin'] },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'org_admin', 'instructor'] },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-primary-500 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Aviation Learning</h1>
            <p className="text-xs text-white/50">v1.0</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      {user && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center font-semibold text-sm">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
              <span className={`badge text-[10px] mt-0.5 ${
                user.role === 'admin' ? 'bg-red-500/20 text-red-200' :
                user.role === 'org_admin' ? 'bg-purple-500/20 text-purple-200' :
                user.role === 'instructor' ? 'bg-green-500/20 text-green-200' :
                user.role === 'pilot' ? 'bg-indigo-500/20 text-indigo-200' :
                'bg-blue-500/20 text-blue-200'
              }`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150
              ${currentPage === item.id
                ? 'bg-white/15 text-white border-r-3 border-accent-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'}
            `}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
