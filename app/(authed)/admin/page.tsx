'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Building2, Users, Activity, TrendingUp, AlertTriangle, Shield, ChevronRight } from 'lucide-react';

type PlatformAnalytics = {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  activeUsersToday: number;
  averageEngagement: number;
  platformHealthScore: number;
  schoolComparisons: Array<{
    schoolId: string;
    schoolName: string;
    studentCount: number;
    avgMastery: number;
    avgEngagement: number;
    healthScore: number;
  }>;
  subjectDifficultyAnalysis: Array<{
    subject: string;
    avgAccuracy: number;
    questionCount: number;
  }>;
};

export default function AdminDashboard() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/analytics', { credentials: 'include' });
        if (r.ok) setData(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1Yy0xLjY1NjMgMC0zIDEuMzQzNy0zIDNzMS4zNDM3IDMgMyAzIDMtMS4zNDM3IDMtMy0xLjM0MzctMy0zLTN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-slate-300 text-sm font-medium tracking-wide uppercase">System Admin</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1 tracking-tight">Platform Dashboard</h1>
            <p className="text-slate-400 text-sm mt-2">Monitor global health, analytics, and moderation queues.</p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
        <StatCard icon={Building2} label="Schools" value={loading ? '--' : data?.totalSchools} color="indigo" />
        <StatCard icon={Users} label="Students" value={loading ? '--' : data?.totalStudents} color="emerald" />
        <StatCard icon={Users} label="Teachers" value={loading ? '--' : data?.totalTeachers} color="violet" />
        <StatCard icon={Activity} label="Active Today" value={loading ? '--' : data?.activeUsersToday} color="amber" />
        <StatCard icon={TrendingUp} label="Engagement" value={loading ? '--' : `${Math.round((data?.averageEngagement || 0) * 100)}%`} color="indigo" />
        <StatCard
          icon={AlertTriangle}
          label="Health Score"
          value={loading ? '--' : `${Math.round(data?.platformHealthScore || 0)}`}
          sub="/ 100"
          color={(data?.platformHealthScore ?? 0) >= 70 ? 'emerald' : 'rose'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Comparisons */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-bold text-gray-900">School Performance</h2>
          </div>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
          ) : !data?.schoolComparisons?.length ? (
            <p className="text-sm text-gray-400 text-center py-4">No school data available.</p>
          ) : (
            <div className="space-y-4">
              {data.schoolComparisons.slice(0, 5).map((s) => (
                <div key={s.schoolId}>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-medium text-gray-800 truncate pr-2" title={s.schoolName}>{s.schoolName}</span>
                    <span className="text-gray-500 tabular-nums flex-shrink-0">{Math.round(s.avgMastery * 100)}% mastery</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill bg-indigo-500" style={{ width: `${s.avgMastery * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <Link href="/admin/schools" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors w-fit">
              View all schools <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Subject Difficulty */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display font-bold text-gray-900">Global Subject Difficulty</h2>
          </div>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
          ) : !data?.subjectDifficultyAnalysis?.length ? (
            <p className="text-sm text-gray-400 text-center py-4">No subject data available.</p>
          ) : (
            <div className="space-y-4">
              {data.subjectDifficultyAnalysis.slice(0, 6).map((s) => {
                const acc = s.avgAccuracy * 100;
                const barColor = acc < 50 ? 'bg-rose-400' : acc < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                const textColor = acc < 50 ? 'text-rose-600' : acc < 70 ? 'text-amber-600' : 'text-emerald-600';
                return (
                  <div key={s.subject}>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="font-medium text-gray-800">{s.subject}</span>
                      <span className={`tabular-nums font-bold ${textColor}`}>
                        {Math.round(acc)}% accuracy
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${barColor}`} style={{ width: `${acc}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <h2 className="font-display font-bold text-gray-900 text-lg pt-2">Management & Moderation</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminAction href="/admin/schools" icon={Building2} title="Schools Directory" desc="Manage subscriptions, licenses, and school profiles." color="indigo" />
        <AdminAction href="/admin/users" icon={Users} title="User Directory" desc="Search and audit any student or teacher account." color="violet" />
        <AdminAction href="/admin/moderation" icon={AlertTriangle} title="Moderation Queue" desc="Review user-submitted content and reported questions." color="rose" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="stat-card group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform ${c.bg}`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <p className="text-xl font-bold text-gray-900 tabular-nums">
        {value} {sub && <span className="text-xs text-gray-400 font-normal">{sub}</span>}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function AdminAction({ href, icon: Icon, title, desc, color }: any) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <Link href={href} className="card p-5 flex items-start gap-4 hover:-translate-y-1 transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.bg} group-hover:scale-105 transition-transform`}>
        <Icon className={`w-6 h-6 ${c.text}`} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">{title}</h3>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 self-center group-hover:text-indigo-500 transition-colors" />
    </Link>
  );
}
