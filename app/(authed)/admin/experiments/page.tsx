'use client';

import { useEffect, useState } from 'react';
import { Settings2, Building2, Save, FlaskConical, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';

type School = {
  id: string;
  name: string;
  schoolCode: string;
  featureFlags: Record<string, boolean> | null;
};

const AVAILABLE_FEATURES = [
  { id: 'enableAI', name: 'AI Tutor & Recommendations', desc: 'Enable Claude-powered tutoring and adaptive learning paths.' },
  { id: 'enableMultiplayer', name: 'Multiplayer Lobbies', desc: 'Allow students to create and join Quiz Battle lobbies.' },
  { id: 'betaQuests', name: 'Beta Quest System', desc: 'Enable the new experimental dynamic quest generator.' },
  { id: 'parentReports', name: 'Parent PDF Reports', desc: 'Allow teachers to generate print-ready progress reports.' },
];

export default function ExperimentsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/schools', { credentials: 'include' });
        if (r.ok) setSchools(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFeature = async (schoolId: string, featureId: string) => {
    setSaving(schoolId);
    
    // Optimistic update
    setSchools(prev => prev.map(s => {
      if (s.id !== schoolId) return s;
      const flags = s.featureFlags || {};
      return { ...s, featureFlags: { ...flags, [featureId]: !flags[featureId] } };
    }));

    const school = schools.find(s => s.id === schoolId);
    if (!school) return;
    
    const newFlags = { ...(school.featureFlags || {}), [featureId]: !(school.featureFlags?.[featureId]) };

    try {
      await fetch(`/api/admin/schools/${schoolId}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featureFlags: newFlags })
      });
    } finally {
      setTimeout(() => setSaving(null), 500); // Artificial delay to show saving state
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs font-medium text-gray-500 mb-2">
        <Link href="/admin" className="hover:text-indigo-600 transition-colors">Admin Dashboard</Link>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-gray-900">Experiments & Features</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
            <FlaskConical className="w-5 h-5 text-violet-700" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Feature Flags</h1>
            <p className="text-sm text-gray-500 mt-0.5">Toggle beta features and modules per school.</p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
          </div>
        ) : schools.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No schools found</p>
          </div>
        ) : (
          schools.map((school) => {
            const flags = school.featureFlags || {};
            const enabledCount = Object.values(flags).filter(Boolean).length;
            
            return (
              <div key={school.id} className="card p-5 border-l-4 border-l-indigo-500 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="font-display font-bold text-lg text-gray-900">{school.name}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{school.schoolCode}</span>
                      <span>•</span>
                      <span>{enabledCount} active features</span>
                    </p>
                  </div>
                  {saving === school.id && (
                    <span className="badge badge-primary gap-1">
                      <Save className="w-3 h-3 animate-pulse" /> Saving...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {AVAILABLE_FEATURES.map(feat => {
                    const isEnabled = !!flags[feat.id];
                    return (
                      <button
                        key={feat.id}
                        onClick={() => toggleFeature(school.id, feat.id)}
                        className={`text-left p-3 rounded-xl border transition-all duration-200 group ${
                          isEnabled 
                            ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className={`text-sm font-semibold ${isEnabled ? 'text-indigo-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {feat.name}
                          </p>
                          <div className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors duration-200 flex-shrink-0 ${isEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </div>
                        <p className={`text-[10px] leading-relaxed ${isEnabled ? 'text-indigo-600/80' : 'text-gray-500'}`}>
                          {feat.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
