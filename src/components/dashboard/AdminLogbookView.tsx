'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logbooksApi, LogbookEntry, LogbookUser } from '@/lib/api';
import { Search, ChevronLeft, BookOpenCheck, Building2, Clock } from 'lucide-react';

function minutesToHHMM(m: number): string {
  if (!m) return '0:00';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, '0')}`;
}

export default function AdminLogbookView() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<LogbookUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LogbookUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LogbookUser | null>(null);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await logbooksApi.adminUsers(token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
    } else {
      const q = search.toLowerCase();
      setFilteredUsers(users.filter(u =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName || '').toLowerCase().includes(q)
      ));
    }
  }, [search, users]);

  const fetchUserEntries = async (u: LogbookUser) => {
    if (!token) return;
    setSelectedUser(u);
    setEntriesLoading(true);
    try {
      const res = await logbooksApi.adminUserEntries(u.id, token);
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
    setEntriesLoading(false);
  };

  // User list view
  if (!selectedUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Logbooks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'admin' ? 'View logbooks of all users' : 'View logbooks of your organization members'}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpenCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No users with logbook entries found</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => fetchUserEntries(u)}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all text-left"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                {u.organizationName && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Building2 className="w-3.5 h-3.5" />
                    {u.organizationName}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">{u.entryCount}</p>
                  <p className="text-[10px] text-gray-400 uppercase">flights</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Selected user logbook (read-only)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setSelectedUser(null); setEntries([]); }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedUser.firstName} {selectedUser.lastName}&apos;s Logbook
          </h1>
          <p className="text-sm text-gray-500">{selectedUser.email} — Read-only view</p>
        </div>
      </div>

      {entriesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No logbook entries yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Callsign</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Aircraft</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">DEP</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">DEST</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Block Off</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">T/O</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">LDG</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Block In</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">PIC</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">SIC</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">IFR</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Night</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">PIC Time</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">SIC Time</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">T/O D</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">T/O N</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">LDG D</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">LDG N</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{e.date}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.callsign || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{e.aircraftId || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.aircraftType || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{e.departure || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{e.destination || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.blockOff || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.takeOffTime || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.landingTime || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.blockIn || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.picName || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.sicName || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{minutesToHHMM(e.ifrTime)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{minutesToHHMM(e.nightTime)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{minutesToHHMM(e.picTime)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{minutesToHHMM(e.sicTime)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.takeoffDay}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.takeoffNight}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.landingDay}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.landingNight}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{e.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
