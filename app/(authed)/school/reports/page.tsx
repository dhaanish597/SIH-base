'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Brain, Trophy, AlertTriangle } from 'lucide-react';

type ReportData = {
  totalStudents: number;
  activeToday: number;
  averageCompletion: number;
  averageScore: number;
  topSubjects: Array<{ subject: string; avgScore: number }>;
  atRiskStudents: Array<{ id: string; name: string; class: string; engagementScore: number }>;
};

export default function SchoolReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/school', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 w-full" />)}
    </div>
  );

  const stats = [
    { label: 'Total Students', value: data?.totalStudents ?? '—', icon: Users, color: 'text-brand-primary' },
    { label: 'Active Today', value: data?.activeToday ?? '—', icon: TrendingUp, color: 'text-accent-green' },
    { label: 'Avg. Completion', value: data ? `${data.averageCompletion}%` : '—', icon: Brain, color: 'text-brand-secondary' },
    { label: 'Avg. Score', value: data ? `${data.averageScore}%` : '—', icon: Trophy, color: 'text-accent-gold' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-brand-primary" /> SCHOOL REPORTS
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <Icon className={`w-6 h-6 mb-2 ${s.color}`} />
              <p className="text-2xl font-mono font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary mt-1 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      {data?.topSubjects && data.topSubjects.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary mb-4">SUBJECT PERFORMANCE</h2>
          <div className="space-y-3">
            {data.topSubjects.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-primary uppercase tracking-wider">{s.subject}</span>
                  <span className="font-mono text-text-secondary">{s.avgScore}%</span>
                </div>
                <div className="progress-track h-2">
                  <div className="progress-fill" style={{ width: `${Math.min(s.avgScore, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data?.atRiskStudents && data.atRiskStudents.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-red" /> AT-RISK STUDENTS
          </h2>
          <div className="space-y-2">
            {data.atRiskStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center text-sm font-bold text-accent-red">
                  {s.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{s.name}</p>
                  <p className="text-xs text-text-secondary">{s.class}</p>
                </div>
                <span className="badge badge-danger">Low engagement</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!data && (
        <div className="card p-10 text-center">
          <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="font-display font-bold text-text-primary">No data yet</p>
          <p className="text-sm text-text-secondary mt-1">Reports will appear once students start learning.</p>
        </div>
      )}
    </div>
  );
}
