'use client';

import { useState } from 'react';
import { X, Brain, TrendingUp, TrendingDown, BookOpen, Star } from 'lucide-react';

export type ConceptBreakdown = {
  concept: string;
  mastery: number;
  questions: number;
  correct: number;
  feedback: string;
};

export type FeedbackData = {
  overallScore: number;
  conceptBreakdown: ConceptBreakdown[];
  strengths: Array<{ concept: string; mastery: number }>;
  weaknesses: Array<{ concept: string; mastery: number }>;
  recommendations: Array<{ type: 'lesson' | 'quiz'; concept: string; message: string }>;
};

type Props = {
  data: FeedbackData;
  onClose: () => void;
};

type Tab = 'overview' | 'breakdown' | 'tips';

export default function FeedbackDisplay({ data, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview');

  const scoreColor =
    data.overallScore >= 80 ? 'text-accent-green' :
    data.overallScore >= 60 ? 'text-accent-gold' :
    'text-accent-red';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-bg-overlay border-2 border-brand-primary rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(107,75,255,0.3)]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-brand-primary" />
            <h2 className="font-display font-bold text-text-primary tracking-widest uppercase text-sm">QUIZ FEEDBACK</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score hero */}
        <div className="p-6 text-center border-b border-white/5">
          <p className={`font-display text-6xl font-bold ${scoreColor}`}>{data.overallScore}%</p>
          <p className="text-sm text-text-secondary mt-1 font-bold uppercase tracking-wider">Overall Score</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(['overview', 'breakdown', 'tips'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                tab === t
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {tab === 'overview' && (
            <div className="space-y-4">
              {data.strengths.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-accent-green uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> STRENGTHS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.strengths.map((s) => (
                      <span key={s.concept} className="badge badge-success">
                        {s.concept} {Math.round(s.mastery * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-accent-red uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> NEEDS WORK
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.weaknesses.map((w) => (
                      <span key={w.concept} className="badge badge-danger">
                        {w.concept} {Math.round(w.mastery * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.strengths.length === 0 && data.weaknesses.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">Complete a quiz to see your strengths and weaknesses.</p>
              )}
            </div>
          )}

          {tab === 'breakdown' && (
            <div className="space-y-4">
              {data.conceptBreakdown.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No concept breakdown available.</p>
              ) : data.conceptBreakdown.map((c) => (
                <div key={c.concept}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-text-primary">{c.concept}</span>
                    <span className="text-xs font-mono text-text-secondary">{c.correct}/{c.questions}</span>
                  </div>
                  <div className="progress-track h-2">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round(c.mastery * 100)}%`,
                        background: c.mastery >= 0.8 ? 'var(--green)' : c.mastery >= 0.5 ? 'var(--violet)' : 'var(--hot)',
                      }}
                    />
                  </div>
                  {c.feedback && <p className="text-xs text-text-muted mt-1">{c.feedback}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div className="space-y-3">
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Great work — no specific recommendations right now!</p>
              ) : data.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-bg-elevated rounded-xl border border-white/5">
                  {r.type === 'lesson'
                    ? <BookOpen className="w-4 h-4 text-brand-secondary mt-0.5 flex-shrink-0" />
                    : <Star className="w-4 h-4 text-accent-gold mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-xs font-bold text-text-primary">{r.concept}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button onClick={onClose} className="btn btn-primary btn-block">CONTINUE</button>
        </div>
      </div>
    </div>
  );
}
