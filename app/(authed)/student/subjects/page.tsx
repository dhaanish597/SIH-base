'use client';

import { useState } from 'react';
import { useAuth } from '../../../providers';
import { BookOpen, ChevronRight, Lock, CheckCircle, Circle, ArrowLeft, Gamepad2, Brain, TrendingUp } from 'lucide-react';

type Subject = {
  name: string;
  icon: string;
  grade: string;
  mastery: number;
  color: string;
  glowColor: string;
  strong: string;
  needsWork: string;
  chapters: Chapter[];
};

type Chapter = {
  name: string;
  status: 'completed' | 'in-progress' | 'locked';
  progress?: number;
};

const subjects: Subject[] = [
  {
    name: 'Mathematics',
    icon: '➕',
    grade: 'Grade 9',
    mastery: 74,
    color: 'from-violet-600 to-purple-700',
    glowColor: 'shadow-[0_0_20px_rgba(124,58,237,0.3)]',
    strong: 'Algebra',
    needsWork: 'Geometry',
    chapters: [
      { name: 'Number Systems', status: 'completed' },
      { name: 'Algebra', status: 'completed' },
      { name: 'Polynomials', status: 'in-progress', progress: 68 },
      { name: 'Geometry', status: 'locked' },
      { name: 'Statistics', status: 'locked' },
    ],
  },
  {
    name: 'Science',
    icon: '🧪',
    grade: 'Grade 9',
    mastery: 82,
    color: 'from-emerald-500 to-teal-600',
    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    strong: 'Biology',
    needsWork: 'Chemistry',
    chapters: [
      { name: 'Matter in Our Surroundings', status: 'completed' },
      { name: 'Is Matter Around Us Pure?', status: 'completed' },
      { name: 'Atoms and Molecules', status: 'in-progress', progress: 45 },
      { name: 'Structure of the Atom', status: 'locked' },
      { name: 'The Living World', status: 'locked' },
    ],
  },
  {
    name: 'English',
    icon: '📖',
    grade: 'Grade 9',
    mastery: 91,
    color: 'from-amber-500 to-orange-600',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    strong: 'Grammar',
    needsWork: 'Creative Writing',
    chapters: [
      { name: 'The Fun They Had', status: 'completed' },
      { name: 'The Sound of Music', status: 'completed' },
      { name: 'Grammar Fundamentals', status: 'completed' },
      { name: 'Creative Writing', status: 'in-progress', progress: 30 },
      { name: 'Poetry Analysis', status: 'locked' },
    ],
  },
  {
    name: 'History',
    icon: '🏛️',
    grade: 'Grade 9',
    mastery: 65,
    color: 'from-blue-600 to-indigo-700',
    glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    strong: 'Ancient India',
    needsWork: 'Modern History',
    chapters: [
      { name: 'The French Revolution', status: 'completed' },
      { name: 'Socialism in Europe', status: 'in-progress', progress: 55 },
      { name: 'Nazism and Rise of Hitler', status: 'locked' },
      { name: 'Forest Society', status: 'locked' },
    ],
  },
  {
    name: 'Geography',
    icon: '🌍',
    grade: 'Grade 9',
    mastery: 70,
    color: 'from-cyan-500 to-sky-600',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    strong: 'Map Skills',
    needsWork: 'Climate',
    chapters: [
      { name: 'India — Size and Location', status: 'completed' },
      { name: 'Physical Features of India', status: 'in-progress', progress: 72 },
      { name: 'Drainage', status: 'locked' },
      { name: 'Climate', status: 'locked' },
    ],
  },
  {
    name: 'Coding',
    icon: '💻',
    grade: 'Grade 9',
    mastery: 45,
    color: 'from-pink-500 to-rose-600',
    glowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    strong: 'HTML/CSS',
    needsWork: 'JavaScript',
    chapters: [
      { name: 'HTML Basics', status: 'completed' },
      { name: 'CSS Styling', status: 'in-progress', progress: 60 },
      { name: 'JavaScript Basics', status: 'locked' },
      { name: 'Python Intro', status: 'locked' },
    ],
  },
];

export default function SubjectsPage() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  if (selectedSubject) {
    return <SubjectDetail subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <header className="relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
            📚 YOUR SUBJECTS
          </h1>
          <p className="text-sm text-text-secondary mt-2">Track your mastery across all subjects</p>
        </div>
      </header>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {subjects.map((sub) => {
          const masteryColor = sub.mastery > 80 ? 'text-accent-green' : sub.mastery > 60 ? 'text-brand-primaryGlow' : 'text-accent-red';
          return (
            <button
              key={sub.name}
              onClick={() => setSelectedSubject(sub)}
              className={`card p-5 text-left group hover:-translate-y-1 transition-all duration-300 ${sub.glowColor} relative overflow-hidden`}
            >
              {/* Background glow */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${sub.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sub.icon}</span>
                    <div>
                      <h3 className="font-display font-bold text-text-primary tracking-wider uppercase text-sm">{sub.name}</h3>
                      <p className="text-[10px] text-text-muted">{sub.grade}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-xl ${masteryColor}`}>{sub.mastery}%</span>
                </div>

                {/* Mastery bar */}
                <div className="progress-track h-2 mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${sub.mastery}%`,
                      background: sub.mastery > 80 ? 'var(--color-accent-green)' : sub.mastery > 60 ? 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' : 'var(--color-accent-red)',
                    }}
                  />
                </div>

                {/* Strong / Needs Work */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-accent-green flex-shrink-0" />
                    <span className="text-text-secondary">Strong: <span className="text-accent-green font-bold">{sub.strong}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
                    <span className="text-text-secondary">Needs work: <span className="text-accent-gold font-bold">{sub.needsWork}</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <span className="flex-1 btn-primary py-2 text-[10px] text-center">PRACTICE</span>
                  <span className="flex-1 btn-secondary py-2 text-[10px] text-center">PLAY GAMES</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Subject Detail View ─────────────────────────────────────

function SubjectDetail({ subject, onBack }: { subject: Subject; onBack: () => void }) {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
            {subject.icon} {subject.name}
          </h1>
          <p className="text-xs text-text-secondary">{subject.grade} · Mastery: {subject.mastery}%</p>
        </div>
      </header>

      {/* Chapter Tree */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold tracking-widest uppercase text-text-primary mb-6">
          CHAPTER TREE
        </h2>
        <div className="space-y-1">
          {subject.chapters.map((ch, i) => {
            const isLast = i === subject.chapters.length - 1;
            return (
              <div key={ch.name}>
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  ch.status === 'completed' ? 'bg-accent-green/5 border-accent-green/20' :
                  ch.status === 'in-progress' ? 'bg-brand-primary/5 border-brand-primary/20' :
                  'bg-bg-elevated border-white/5 opacity-60'
                }`}>
                  {/* Status icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    ch.status === 'completed' ? 'bg-accent-green/20' :
                    ch.status === 'in-progress' ? 'bg-brand-primary/20' :
                    'bg-white/5'
                  }`}>
                    {ch.status === 'completed' && <CheckCircle className="w-4 h-4 text-accent-green" />}
                    {ch.status === 'in-progress' && <Circle className="w-4 h-4 text-brand-primaryGlow" />}
                    {ch.status === 'locked' && <Lock className="w-4 h-4 text-text-muted" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${ch.status === 'locked' ? 'text-text-muted' : 'text-text-primary'}`}>
                      Ch.{i + 1} {ch.name}
                    </p>
                    {ch.status === 'in-progress' && ch.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] font-mono text-text-secondary mb-1">
                          <span>In Progress</span>
                          <span>{ch.progress}%</span>
                        </div>
                        <div className="progress-track h-1.5">
                          <div className="progress-fill" style={{ width: `${ch.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {ch.status === 'completed' && (
                      <p className="text-[10px] text-accent-green font-bold mt-1">✅ Completed</p>
                    )}
                  </div>

                  {ch.status !== 'locked' && (
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                  )}
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div className="flex justify-start ml-8 py-0.5">
                    <div className="w-px h-4 bg-white/10" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
