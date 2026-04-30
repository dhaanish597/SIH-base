'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../providers';
import {
  Users, TrendingUp, AlertTriangle, Award, BarChart3,
  BookOpen, Clock, ArrowUpRight, ArrowDownRight, ChevronRight,
  Gamepad2, RefreshCw, User, Activity,
} from 'lucide-react';
import Link from 'next/link';

type ClassAnalytics = {
  totalStudents: number;
  activeToday: number;
  averageCompletion: number;
  averageScore: number;
  atRiskStudents: any[];
  topPerformers: any[];
  strugglingStudents: any[];
  subjectPerformance: Record<string, number>;
  weeklyEngagement?: { day: string; engagement: number }[];
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/analytics/${user.id}`, { credentials: 'include' });
      if (r.ok) {
        setData(await r.json());
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Class Overview</h1>
          <p className="text-sm text-gray-400 mt-1">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading analytics...'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-ghost text-sm gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        <StatCard
          icon={Users}
          label="Total Students"
          value={loading ? '--' : String(data?.totalStudents || 0)}
          color="indigo"
          loading={loading}
        />
        <StatCard
          icon={Activity}
          label="Active Today"
          value={loading ? '--' : String(data?.activeToday || 0)}
          sub={data ? `${Math.round((data.activeToday / Math.max(1, data.totalStudents)) * 100)}% engagement` : ''}
          color="emerald"
          loading={loading}
        />
        <StatCard
          icon={Award}
          label="Avg Score"
          value={loading ? '--' : `${Math.round(data?.averageScore || 0)}%`}
          color="amber"
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="At Risk"
          value={loading ? '--' : String(data?.atRiskStudents?.length || 0)}
          sub={data?.atRiskStudents?.length ? 'need attention' : 'none'}
          color="rose"
          loading={loading}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Performance */}
          <section className="card p-5">
            <h2 className="font-display font-bold text-gray-900 mb-4">Subject Performance</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
              </div>
            ) : !data?.subjectPerformance || Object.keys(data.subjectPerformance).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No subject data available yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.subjectPerformance).map(([subj, score]) => {
                  const pct = Math.round(Number(score));
                  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-400';
                  return (
                    <div key={subj}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 font-medium">{subj}</span>
                        <span className={`text-sm font-bold tabular-nums ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* At-Risk Students */}
          {data?.atRiskStudents && data.atRiskStudents.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="font-display font-bold text-gray-900">At-Risk Students</h2>
                <span className="badge badge-error">{data.atRiskStudents.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {data.atRiskStudents.slice(0, 8).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">
                      {s.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-400">
                        Mastery: {Math.round((s.mastery || 0) * 100)}% · Engagement: {s.engagementScore ? `${Math.round(s.engagementScore * 100)}%` : 'low'}
                      </p>
                    </div>
                    <Link href={`/teacher/students?id=${s.id}`} className="btn-ghost text-xs p-1.5">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right (1/3) */}
        <div className="space-y-6">
          {/* Top Performers */}
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <h2 className="font-display font-bold text-gray-900 text-sm">Top Performers</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
            ) : !data?.topPerformers?.length ? (
              <p className="text-xs text-gray-400 text-center py-3">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {data.topPerformers.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="w-6 text-xs font-bold text-gray-400 text-center tabular-nums">{i + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{s.name}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">{Math.round((s.mastery || 0) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Struggling Students */}
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownRight className="w-4 h-4 text-amber-500" />
              <h2 className="font-display font-bold text-gray-900 text-sm">Needs Improvement</h2>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
            ) : !data?.strugglingStudents?.length ? (
              <p className="text-xs text-gray-400 text-center py-3">No struggling students — great job!</p>
            ) : (
              <div className="space-y-2">
                {data.strugglingStudents.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{s.name}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 tabular-nums">{Math.round((s.mastery || 0) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Link href="/teacher/students" className="card flex items-center gap-3 p-3.5 hover:-translate-y-0.5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Student List</p>
                <p className="text-[10px] text-gray-400">View all students</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </Link>
            <Link href="/teacher/questions" className="card flex items-center gap-3 p-3.5 hover:-translate-y-0.5 group">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Question Bank</p>
                <p className="text-[10px] text-gray-400">Create & manage questions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
            </Link>
          </div>
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
    rose: { iconBg: 'bg-rose-100', iconText: 'text-rose-600' },
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
