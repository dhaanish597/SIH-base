'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { GraduationCap, Search } from 'lucide-react';

type Teacher = {
  id: string;
  name: string;
  email: string | null;
  status: string;
  department: string | null;
  subjectsTaught: string[];
  classesHandled: string[];
  lastLogin: string | null;
};

export default function SchoolTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.schoolId) return;
    (async () => {
      const r = await fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' });
      if (r.ok) setTeachers(await r.json());
      setLoading(false);
    })();
  }, [user]);

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.department || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <span className="text-sm text-gray-500">{teachers.length} total</span>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Department', 'Subjects', 'Classes', 'Status', 'Last login'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No teachers found.</td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{(t.subjectsTaught || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{(t.classesHandled || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.lastLogin ? new Date(t.lastLogin).toLocaleDateString() : 'Never'}
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
