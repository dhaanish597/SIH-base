'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../providers';
import Link from 'next/link';
import { Building2, Users, GraduationCap, BookOpen, MapPin, Calendar, Info, ChevronRight, Activity } from 'lucide-react';

type SchoolInfo = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  board: string | null;
  plan: string;
  maxStudents: number;
  createdAt: string;
};

type QuickStats = {
  studentCount: number;
  teacherCount: number;
  classCount: number;
};

export default function SchoolDashboard() {
  const { user } = useAuth();
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) return;
    (async () => {
      const [sr, stuR, tchR, clsR] = await Promise.all([
        fetch('/api/schools/me', { credentials: 'include' }),
        fetch(`/api/schools/${user.schoolId}/students`, { credentials: 'include' }),
        fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' }),
        fetch(`/api/schools/${user.schoolId}/classes`, { credentials: 'include' }),
      ]);
      if (sr.ok) setSchool(await sr.json());
      const students = stuR.ok ? await stuR.json() : [];
      const teachers = tchR.ok ? await tchR.json() : [];
      const classes = clsR.ok ? await clsR.json() : [];
      setStats({ studentCount: students.length, teacherCount: teachers.length, classCount: classes.length });
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1Yy0xLjY1NjMgMC0zIDEuMzQzNy0zIDNzMS4zNDM3IDMgMyAzIDMtMS4zNDM3IDMtMy0xLjM0MzctMy0zLTN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-indigo-200 text-sm font-medium tracking-wide uppercase">School Dashboard</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1 tracking-tight">
              {loading ? 'Loading School...' : (school?.name || 'Unknown School')}
            </h1>
            {school && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="badge bg-white/20 text-white border border-white/10 backdrop-blur-md">
                  Code: <span className="font-mono ml-1">{school.code}</span>
                </span>
                {school.city && (
                  <span className="flex items-center gap-1 text-sm text-indigo-100">
                    <MapPin className="w-4 h-4" /> {school.city}{school.state ? `, ${school.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-indigo-100">
                  <Activity className="w-4 h-4" /> {school.plan} Plan
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <StatCard icon={Users} label="Students" value={loading ? '--' : String(stats?.studentCount ?? 0)} sub={school ? `of ${school.maxStudents} max` : ''} color="indigo" loading={loading} />
        <StatCard icon={GraduationCap} label="Teachers" value={loading ? '--' : String(stats?.teacherCount ?? 0)} color="emerald" loading={loading} />
        <StatCard icon={BookOpen} label="Classes" value={loading ? '--' : String(stats?.classCount ?? 0)} color="amber" loading={loading} />
        <StatCard icon={Building2} label="Plan Capacity" value={loading ? '--' : `${school ? Math.round(((stats?.studentCount ?? 0) / school.maxStudents) * 100) : 0}%`} sub="utilized" color="violet" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="font-display font-bold text-gray-900 mb-3 text-lg">Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActionCard
                href="/school/students"
                icon={Users}
                title="Manage Students"
                desc="Add, edit, or bulk-import student accounts. View enrollment by class."
                color="indigo"
              />
              <ActionCard
                href="/school/teachers"
                icon={GraduationCap}
                title="Manage Teachers"
                desc="View teacher accounts, their assigned classes and subjects."
                color="emerald"
              />
            </div>
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div>
          {school && (
            <section className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-gray-400" />
                <h2 className="font-display font-bold text-gray-900">School Details</h2>
              </div>
              <dl className="space-y-4 text-sm">
                {[
                  ['Address', school.address],
                  ['City', school.city],
                  ['State', school.state],
                  ['Educational Board', school.board],
                  ['Subscription Plan', school.plan],
                  ['Max Students', school.maxStudents.toLocaleString()],
                  ['Joined Date', new Date(school.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })],
                ].map(([k, v]) => v ? (
                  <div key={String(k)} className="flex flex-col border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <dt className="text-gray-500 text-xs mb-0.5">{k}</dt>
                    <dd className="font-medium text-gray-900">{String(v)}</dd>
                  </div>
                ) : null)}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, loading: isLoading }: any) {
  const colorMap: Record<string, { iconBg: string; iconText: string }> = {
    indigo: { iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
    emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    amber: { iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    violet: { iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
  };
  const c = colorMap[color] || colorMap.indigo;

  if (isLoading) return <div className="skeleton h-28" />;

  return (
    <div className="stat-card group">
      <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
        <Icon className={`w-5 h-5 ${c.iconText}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, desc, color }: any) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <Link href={href} className="card p-5 flex items-start gap-4 hover:-translate-y-1 transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.bg} group-hover:scale-105 transition-transform`}>
        <Icon className={`w-6 h-6 ${c.text}`} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 self-center group-hover:text-indigo-500 transition-colors" />
    </Link>
  );
}
