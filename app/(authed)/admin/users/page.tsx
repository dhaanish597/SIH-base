'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Filter } from 'lucide-react';

type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  schoolId: string | null;
  class: string | null;
  lastLogin: string | null;
  createdAt: string;
  totalPoints: number;
  level: number;
};

const ROLES = ['', 'STUDENT', 'TEACHER', 'SCHOOL', 'ADMIN'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '200' });
    if (role) params.set('role', role);
    const r = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [role]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()),
  );

  const ROLE_COLORS: Record<string, string> = {
    STUDENT: 'bg-indigo-100 text-indigo-700',
    TEACHER: 'bg-emerald-100 text-emerald-700',
    SCHOOL: 'bg-violet-100 text-violet-700',
    ADMIN: 'bg-rose-100 text-rose-700',
    SUPERADMIN: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <Users className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">{users.length} loaded</span>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="text-sm text-gray-700 focus:outline-none"
          >
            <option value="">All roles</option>
            {ROLES.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Role', 'Class', 'Level', 'Points', 'Status', 'Last login', 'Joined'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.class || '—'}</td>
                  <td className="px-4 py-3 text-indigo-600 font-semibold">{u.level}</td>
                  <td className="px-4 py-3 text-amber-600">{u.totalPoints}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
