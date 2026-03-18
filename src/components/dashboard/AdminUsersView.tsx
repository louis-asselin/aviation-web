'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, User } from '@/lib/api';
import { Users, Search, Shield, ShieldAlert, KeyRound, Mail, Plus, ChevronDown } from 'lucide-react';
import { getRoleLabel, getRoleColor, formatDate, getInitials } from '@/lib/utils';

export default function AdminUsersView() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadUsers = () => {
    if (!token) return;
    usersApi.list(token)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        setFilteredUsers(list);
      })
      .catch(err => console.error('Failed to load users:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadUsers(); }, [token]);

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditActive(u.isActive !== false);
    setSaveMsg('');
  };

  const saveUser = async () => {
    if (!editingUser || !token) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await usersApi.update(editingUser.id as number, {
        role: editRole,
        isActive: editActive,
      } as Partial<User>, token);
      setSaveMsg('Saved!');
      loadUsers();
      setTimeout(() => setEditingUser(null), 800);
    } catch (e: unknown) {
      setSaveMsg(`Error: ${(e as Error).message}`);
    }
    setSaving(false);
  };

  useEffect(() => {
    let result = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  if (isLoading) {
    return (
      <div className="card animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <span className="text-sm text-gray-500">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field appearance-none pr-10 min-w-[160px]"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="pilot">Pilots</option>
            <option value="instructor">Instructors</option>
            <option value="org_admin">Org Admins</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Compliance</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Joined</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} onClick={() => openEdit(u)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getRoleColor(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {u.acceptedTermsAt ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Shield className="w-3.5 h-3.5" />
                          Terms
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-orange-500">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          No Terms
                        </span>
                      )}
                      {u.mustChangePassword && (
                        <span className="flex items-center gap-1 text-xs text-orange-500">
                          <KeyRound className="w-3.5 h-3.5" />
                          Pwd
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">
                    {u.createdAt ? formatDate(u.createdAt) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`w-2 h-2 rounded-full inline-block ${u.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-500 ml-2">{u.isActive !== false ? 'Active' : 'Inactive'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center text-white font-semibold">
                {getInitials(editingUser.firstName, editingUser.lastName)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{editingUser.firstName} {editingUser.lastName}</h2>
                <p className="text-sm text-gray-500">{editingUser.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="student">Student</option>
                  <option value="pilot">Pilot</option>
                  <option value="instructor">Instructor</option>
                  <option value="org_admin">Org Admin</option>
                  {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <button onClick={() => setEditActive(!editActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${editActive ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            {saveMsg && (
              <p className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{saveMsg}</p>
            )}

            <div className="flex gap-3">
              <button onClick={saveUser} disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
