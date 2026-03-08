'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bugReportsApi, BugReport } from '@/lib/api';
import {
  Bug, ChevronLeft, ChevronRight, MessageSquare, AlertTriangle,
  CheckCircle2, Clock, X, Send
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-50 text-blue-600',
  medium: 'bg-yellow-50 text-yellow-600',
  high: 'bg-orange-50 text-orange-600',
  critical: 'bg-red-50 text-red-600',
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  ui: 'User Interface',
  content: 'Content',
  performance: 'Performance',
  other: 'Other',
};

export default function BugReportsView() {
  const { token } = useAuth();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stats, setStats] = useState<{ open: number; inProgress: number; resolved: number; total: number } | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!token) return;
    bugReportsApi.stats(token).then(setStats).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params: { page: number; limit: number; status?: string } = { page, limit };
    if (statusFilter) params.status = statusFilter;
    bugReportsApi.list(token, params)
      .then(data => {
        setReports(data.reports);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const updated = await bugReportsApi.update(reportId, {
        status: newStatus,
        adminResponse: adminResponse || undefined,
      }, token);
      setReports(prev => prev.map(r => r.id === reportId ? updated : r));
      setSelectedReport(updated);
      setAdminResponse('');
      // Refresh stats
      bugReportsApi.stats(token).then(setStats).catch(() => {});
    } catch {}
    setIsUpdating(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Detail view
  if (selectedReport) {
    return (
      <div className="space-y-6 max-w-3xl">
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" /> Back to reports
        </button>

        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedReport.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Reported by {selectedReport.userName || 'Unknown'} ({selectedReport.userEmail}) — {formatDate(selectedReport.createdAt)}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[selectedReport.status] || ''}`}>
              {STATUS_LABELS[selectedReport.status] || selectedReport.status}
            </span>
          </div>

          <div className="flex gap-2 mb-4">
            <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[selectedReport.severity] || ''}`}>
              {selectedReport.severity}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {CATEGORY_LABELS[selectedReport.category] || selectedReport.category}
            </span>
            {selectedReport.deviceInfo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {selectedReport.deviceInfo}
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
          </div>

          {selectedReport.adminResponse && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Admin Response</p>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedReport.adminResponse}</p>
            </div>
          )}

          {/* Admin actions */}
          <div className="border-t pt-4 space-y-3">
            <textarea
              value={adminResponse}
              onChange={e => setAdminResponse(e.target.value)}
              placeholder="Write a response (optional)..."
              className="input-field w-full min-h-[80px]"
            />
            <div className="flex gap-2 flex-wrap">
              {adminResponse.trim() && (
                <button
                  onClick={async () => {
                    if (!token || !adminResponse.trim()) return;
                    setIsUpdating(true);
                    try {
                      const updated = await bugReportsApi.update(selectedReport.id, {
                        adminResponse: adminResponse,
                      }, token);
                      setReports(prev => prev.map(r => r.id === selectedReport.id ? updated : r));
                      setSelectedReport(updated);
                      setAdminResponse('');
                    } catch {}
                    setIsUpdating(false);
                  }}
                  disabled={isUpdating}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send Response
                </button>
              )}
              {selectedReport.status === 'open' && (
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'in_progress')}
                  disabled={isUpdating}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" /> In Progress
                </button>
              )}
              {(selectedReport.status === 'open' || selectedReport.status === 'in_progress') && (
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                </button>
              )}
              {selectedReport.status !== 'closed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'closed')}
                  disabled={isUpdating}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">Bug Reports</h1>
        </div>
        <span className="text-sm text-gray-500">{total} report{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card py-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            <p className="text-xs text-gray-500">Open</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-gray-500">Resolved</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field max-w-xs"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Bug className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bug reports found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {reports.map(report => (
              <div
                key={report.id}
                onClick={() => { setSelectedReport(report); setAdminResponse(''); }}
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{report.title}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status] || ''}`}>
                        {STATUS_LABELS[report.status] || report.status}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${SEVERITY_COLORS[report.severity] || ''}`}>
                        {report.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{report.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{report.userName || 'Unknown'}</span>
                      <span>{report.userRole}</span>
                      <span>{formatDate(report.createdAt)}</span>
                      {report.deviceInfo && <span>{report.deviceInfo}</span>}
                    </div>
                  </div>
                  {report.adminResponse && (
                    <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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
