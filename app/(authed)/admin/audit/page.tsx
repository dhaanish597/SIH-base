'use client';

import { useEffect, useState } from 'react';
import { Activity, Shield, Search, Calendar, User, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: {
    name: string;
    role: string;
  };
  school?: {
    name: string;
  };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/audit-logs', { credentials: 'include' });
        if (r.ok) setLogs(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.entityType.toLowerCase().includes(search.toLowerCase()) ||
    (log.actor?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.school?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs font-medium text-gray-500 mb-2">
        <Link href="/admin" className="hover:text-indigo-600 transition-colors">Admin Dashboard</Link>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-gray-900">Audit Logs</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Shield className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">System Audit Logs</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and monitor all administrative actions across the platform.</p>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="card p-3 flex items-center gap-3 bg-gray-50/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, user, or school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full bg-white shadow-sm"
          />
        </div>
        <div className="text-xs text-gray-500 tabular-nums px-3 flex-shrink-0">
          Showing {filtered.length} logs
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No logs found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">School context</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filtered.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          log.action === 'LOGIN' ? 'bg-indigo-50 text-indigo-700' :
                          log.action === 'APPROVE' ? 'bg-emerald-50 text-emerald-700' :
                          log.action === 'REJECT' ? 'bg-rose-50 text-rose-700' :
                          log.action === 'CREATE' ? 'bg-blue-50 text-blue-700' :
                          log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-900">{log.entityType}</span>
                          {log.entityId && <span className="text-xs font-mono text-gray-400 ml-1 truncate max-w-[80px]" title={log.entityId}>#{log.entityId.slice(0,6)}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{log.actor?.name || 'System'}</p>
                            <p className="text-[10px] text-gray-500">{log.actor?.role || 'SYSTEM'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {log.school?.name || <span className="text-gray-400 italic">Global</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500 tabular-nums">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-gray-700">{date.toLocaleDateString()}</span>
                          <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
