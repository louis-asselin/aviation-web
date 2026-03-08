'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogsApi, AuditLog } from '@/lib/api';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';

const EVENT_LABELS: Record<string, string> = {
  'auth.login_success': 'Login',
  'auth.login_failed': 'Login Failed',
  'auth.2fa_required': '2FA Required',
  'auth.2fa_validated': '2FA Validated',
  'auth.2fa_validation_failed': '2FA Failed',
  'auth.2fa_enabled': '2FA Enabled',
  'auth.2fa_disabled': '2FA Disabled',
  'auth.password_changed': 'Password Changed',
  'auth.profile_updated': 'Profile Updated',
  'admin.user_created': 'User Created',
  'admin.user_updated': 'User Updated',
  'admin.user_deleted': 'User Deleted',
};

const EVENT_COLORS: Record<string, string> = {
  'auth.login_success': 'bg-green-100 text-green-700',
  'auth.login_failed': 'bg-red-100 text-red-700',
  'auth.2fa_required': 'bg-yellow-100 text-yellow-700',
  'auth.2fa_validated': 'bg-green-100 text-green-700',
  'auth.2fa_validation_failed': 'bg-red-100 text-red-700',
  'auth.2fa_enabled': 'bg-blue-100 text-blue-700',
  'auth.2fa_disabled': 'bg-orange-100 text-orange-700',
  'auth.password_changed': 'bg-purple-100 text-purple-700',
  'admin.user_created': 'bg-blue-100 text-blue-700',
  'admin.user_updated': 'bg-indigo-100 text-indigo-700',
  'admin.user_deleted': 'bg-red-100 text-red-700',
};

export default function AuditLogsView() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const limit = 25;

  // Load event types
  useEffect(() => {
    if (!token) return;
    auditLogsApi.eventTypes(token).then(setEventTypes).catch(() => {});
  }, [token]);

  // Load logs
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const params: { page: number; limit: number; eventType?: string } = { page, limit };
    if (selectedEventType) params.eventType = selectedEventType;
    auditLogsApi.list(token, params)
      .then(data => {
        setLogs(data.logs);
        setTotal(data.total);
      })
      .catch(err => setError(err.message || 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [token, page, selectedEventType]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <span className="text-sm text-gray-500">{total} event{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={selectedEventType}
          onChange={(e) => { setSelectedEventType(e.target.value); setPage(1); }}
          className="input-field max-w-xs"
        >
          <option value="">All Events</option>
          {eventTypes.map(et => (
            <option key={et} value={et}>{EVENT_LABELS[et] || et}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No audit events found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 text-gray-500 font-medium">Date</th>
                  <th className="py-2 text-gray-500 font-medium">Event</th>
                  <th className="py-2 text-gray-500 font-medium">User</th>
                  <th className="py-2 text-gray-500 font-medium">IP Address</th>
                  <th className="py-2 text-gray-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-600 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        EVENT_COLORS[log.eventType] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {EVENT_LABELS[log.eventType] || log.eventType}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {log.userName ? (
                        <div>
                          <span className="text-gray-700 font-medium">{log.userName}</span>
                          <span className="text-gray-400 ml-1 text-xs">{log.userEmail}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
