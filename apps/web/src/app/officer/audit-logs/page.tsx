'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity,
  FileText,
} from 'lucide-react';

interface AuditLogItem {
  _id: string;
  actorId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 20 };
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/analytics/audit-logs', { params });
      setLogs(res.data?.data?.logs || []);
      setTotalPages(res.data?.data?.pagination?.totalPages || 1);
      setTotalCount(res.data?.data?.pagination?.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('SECURITY') || action.includes('MODERATION') || action.includes('DECRYPT')) {
      return 'bg-red-50 text-red-700 border-red-200/60';
    }
    if (action.includes('POLICY') || action.includes('UPDATE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200/60';
    }
    if (action.includes('VERIFIED') || action.includes('APPROVED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Institutional Audit Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
              {totalCount} Total Events
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Immutable, non-repudiable audit ledger capturing administrative and security events.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 transition shadow-xs"
          >
            <option value="">All Audit Actions</option>
            <option value="SECURITY_MESSAGE_DECRYPTED_FOR_MODERATION">
              Message Decrypted for Moderation
            </option>
            <option value="PROGRAMME_POLICY_UPDATE">Programme Policy Update</option>
            <option value="ALUMNI_VERIFIED">Alumni Verified</option>
            <option value="REGISTRAR_SYNC_BATCH">Registrar Batch Sync</option>
          </select>

          <button
            onClick={() => fetchLogs()}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition shadow-xs"
            title="Refresh Ledger"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-neutral-200/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 text-sm">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200/70 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-medium text-neutral-900 text-sm">No Audit Records Found</h3>
          <p className="text-xs text-neutral-500 mt-1">
            No events match the selected criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/70 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200/70 text-neutral-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Metadata & Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.actorId ? (
                        <div>
                          <div className="font-medium text-neutral-900">
                            {log.actorId.firstName} {log.actorId.lastName}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {log.actorId.role} &bull; {log.actorId.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Automated System Process</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                      <span className="font-semibold text-neutral-800">{log.entityType}:</span>{' '}
                      {log.entityId}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      {log.metadata ? (
                        <pre className="text-[10px] font-mono bg-neutral-50 p-2 rounded-lg border border-neutral-200/60 overflow-x-auto text-neutral-700">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-neutral-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-neutral-200/70 flex items-center justify-between text-xs text-neutral-500">
              <div>
                Page {page} of {totalPages} ({totalCount} total entries)
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 transition shadow-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 transition shadow-xs flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
