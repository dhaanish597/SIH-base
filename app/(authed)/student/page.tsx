'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers';

type Quest = {
  id: string;
  questKey: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  goalCount: number;
  status: string;
  rewardXp: number;
  rewardCoins: number;
};

type GameHistory = {
  id: string;
  gameType: string;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  questionsCorrect: number;
  questionsAttempted: number;
  startedAt: string;
};

type LeaderboardRow = { id: string; name: string; points: number; level: number; rank: number };
type Badge = { key: string; name: string; type: string };

type KnowledgeState = {
  mastered_concepts: Array<{ conceptName: string; masteryLevel: number }>;
  learning_concepts: Array<{ conceptName: string; masteryLevel: number }>;
  weak_concepts: Array<{ conceptName: string; masteryLevel: number }>;
  overallMasteryScore: number;
};

const SUBJECTS = [
  { key: 'math', label: 'Mathematics', color: 'var(--s-math)' },
  { key: 'science', label: 'Science', color: 'var(--s-science)' },
  { key: 'english', label: 'English', color: 'var(--s-english)' },
  { key: 'history', label: 'History', color: 'var(--s-history)' },
  { key: 'geography', label: 'Geography', color: 'var(--s-geo)' },
  { key: 'coding', label: 'Coding', color: 'var(--s-coding)' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [knowledgeState, setKnowledgeState] = useState<KnowledgeState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.allSettled([
          fetch('/api/quests/me', { credentials: 'include' }).then((r) => r.ok ? r.json() : []),
          fetch('/api/games/history?limit=5', { credentials: 'include' }).then((r) => r.ok ? r.json() : []),
          fetch('/api/learner/knowledge-state', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
          fetch('/api/leaderboard?scope=school&limit=5', { credentials: 'include' }).then((r) => r.ok ? r.json() : []),
          fetch('/api/badges/me', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
        ]);
        if (cancelled) return;
        setQuests(results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : []);
        const history = results[1].status === 'fulfilled' ? results[1].value : [];
        setGameHistory(Array.isArray(history?.sessions) ? history.sessions : Array.isArray(history) ? history : []);
        setKnowledgeState(results[2].status === 'fulfilled' ? results[2].value?.data || results[2].value : null);
        setLeaderboard(results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : []);
        setBadges(results[4].status === 'fulfilled' && Array.isArray(results[4].value?.earnedBadges) ? results[4].value.earnedBadges : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const name = user?.name || 'Student';
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpMax = Math.max(100, level * 500);
  const streak = user?.streakDays ?? 0;
  const coins = user?.totalCoins ?? 0;
  const title = getLevelTitle(level);
  const activeQuests = quests.filter((q) => q.status === 'ACTIVE').slice(0, 4);

  return (
    <div className="page-in" style={{ minHeight: '100%' }}>
      <div className="qa-dashboard-grid" style={{ padding: 24, maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ overflow: 'hidden', position: 'relative', border: '2px solid var(--violet)', background: 'rgba(22,25,48,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div className="scanlines" style={{ padding: '28px 28px 24px', position: 'relative', minHeight: 220, background: 'rgba(14,16,40,0.45)' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="pframe violet" style={{ width: 120, height: 120 }}>
                    <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 0 #000)' }}>QA</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#000', color: 'var(--gold)', fontFamily: 'var(--f-hud)', fontSize: 12, fontWeight: 700, padding: '3px 10px', border: '2px solid var(--gold)', borderRadius: 999, whiteSpace: 'nowrap' }}>
                    LVL {level}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.2em' }}>WELCOME BACK,</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 44, lineHeight: 1, marginTop: 4 }}>{name}</div>
                  <div style={{ fontFamily: 'var(--f-hud)', fontSize: 13, color: 'var(--violet-bright)', marginTop: 6 }}>
                    Lvl {level} - {title}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="xp-bar violet" style={{ height: 16, flex: 1 }}>
                      <i style={{ width: `${Math.min(100, (xp / xpMax) * 100)}%` }} />
                    </div>
                    <span style={{ fontFamily: 'var(--f-hud)', color: 'var(--gold)', fontSize: 14, whiteSpace: 'nowrap' }}>{xp}/{xpMax}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <span className="pill pill-orange">{streak} Day Streak</span>
                    <span className="pill pill-gold">{coins.toLocaleString()} Coins</span>
                    <span className="pill pill-violet">{user?.totalPoints ?? 0} Points</span>
                  </div>
                </div>

                <div className="hidden md:flex" style={{ flexDirection: 'column', gap: 8, alignSelf: 'stretch', justifyContent: 'center' }}>
                  <Link href="/student/learn" className="btn btn-primary" style={{ textDecoration: 'none' }}>Resume Learning</Link>
                  <Link href="/student/games" className="btn btn-cyan" style={{ textDecoration: 'none' }}>Game Vault</Link>
                </div>
              </div>
            </div>
          </div>

          <section>
            <SectionHeader title="Today's Quests" />
            {loading ? <div className="skeleton h-24" /> : activeQuests.length === 0 ? (
              <EmptyCard text="No active quests are assigned yet." />
            ) : (
              <div className="qa-quest-grid" style={{ gap: 12 }}>
                {activeQuests.map((q) => (
                  <QuestCard key={q.id} tag={q.type?.toLowerCase() || 'daily'} title={q.title} desc={q.description} reward={q.rewardXp} value={q.progress} max={q.goalCount} complete={q.status === 'COMPLETED'} />
                ))}
              </div>
            )}
          </section>

          <div className="qa-two-col" style={{ gap: 16 }}>
            <section>
              <SectionHeader title="From Your Mentor" />
              <EmptyCard text="No teacher assignments are active right now." />
            </section>

            <section>
              <SectionHeader title="Continue Playing" />
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(22,25,48,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                {gameHistory.length === 0 ? (
                  <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No game sessions yet.</p>
                ) : gameHistory.slice(0, 3).map((g) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, background: 'var(--bg-elev-2)', borderLeft: '4px solid var(--violet)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--f-display)', fontSize: 14 }}>{g.gameType.replace(/_/g, ' ')}</div>
                      <div style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-3)' }}>
                        Score {g.score} - {g.xpEarned} XP - {g.coinsEarned} coins
                      </div>
                    </div>
                    <Link href="/student/games" style={{ fontFamily: 'var(--f-hud)', color: 'var(--cyan)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>PLAY</Link>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section>
            <SectionHeader title="Your Skill Map" />
            <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(22,25,48,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              {SUBJECTS.map((s) => {
                const val = getSubjectMastery(knowledgeState, s.label);
                return (
                  <div key={s.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-2)' }}>{s.label}</span>
                      <span style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--gold)' }}>{val}%</span>
                    </div>
                    <div className="xp-bar" style={{ height: 10 }}>
                      <i style={{ width: `${val}%`, background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad" style={{ background: 'rgba(22,25,48,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <SectionHeader title="School Ladder" />
            {leaderboard.length === 0 ? (
              <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No leaderboard rows yet.</p>
            ) : leaderboard.map((r) => (
              <LBRow key={r.id} rank={r.rank} you={r.id === user?.id} name={r.name} xp={r.points} total={Math.max(1, leaderboard[0]?.points || r.points)} level={r.level} />
            ))}
          </div>

          <div className="card card-pad" style={{ background: 'rgba(22,25,48,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <SectionHeader title="Recent Achievements" />
            {badges.length === 0 ? (
              <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No badges earned yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {badges.slice(0, 6).map((a) => (
                  <div key={a.key} style={{ padding: 10, background: 'var(--bg-elev-2)', borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 12 }}>{a.name}</div>
                    <div style={{ fontFamily: 'var(--f-hud)', fontSize: 9, color: 'var(--ink-3)' }}>{a.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, margin: '0 0 14px' }}>{title}</h3>;
}

function EmptyCard({ text }: { text: string }) {
  return <div className="card card-pad" style={{ color: 'var(--ink-3)', fontSize: 13, background: 'rgba(22,25,48,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>{text}</div>;
}

function QuestCard({ tag, title, desc, reward, value, max, complete }: {
  tag: string; title: string; desc: string; reward: number; value: number; max: number; complete?: boolean;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="card card-pad" style={{ borderLeftWidth: 4, borderLeftColor: complete ? 'var(--green)' : 'var(--cyan)', paddingLeft: 16, background: 'rgba(22,25,48,0.80)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <span style={{ fontFamily: 'var(--f-hud)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.06em' }}>{tag.toUpperCase()}</span>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{desc}</div>
        </div>
        <div style={{ fontFamily: 'var(--f-hud)', color: 'var(--gold)', fontSize: 16, fontWeight: 700 }}>+{reward} XP</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <div className={`xp-bar ${complete ? 'green' : 'cyan'}`} style={{ height: 10, flex: 1 }}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-2)' }}>{value}/{max}</span>
      </div>
    </div>
  );
}

function LBRow({ rank, you, name, xp, total, level }: {
  rank: number; you?: boolean; name: string; xp: number; total: number; level: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontFamily: 'var(--f-hud)', color: you ? 'var(--violet-bright)' : 'var(--ink-2)', fontWeight: 700 }}>#{rank}</div>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 14 }}>{name} {you ? '(YOU)' : ''}</div>
        <div className="xp-bar cyan" style={{ height: 6, marginTop: 4 }}>
          <i style={{ width: `${Math.min(100, (xp / total) * 100)}%` }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', fontFamily: 'var(--f-hud)', color: 'var(--gold)', fontSize: 12 }}>{xp} pts<br />Lv.{level}</div>
    </div>
  );
}

function getSubjectMastery(state: KnowledgeState | null, subject: string): number {
  if (!state) return 0;
  const all = [...state.mastered_concepts, ...state.learning_concepts, ...state.weak_concepts];
  const matches = all.filter((c) => c.conceptName.toLowerCase().includes(subject.toLowerCase()));
  if (matches.length === 0) return Math.round((state.overallMasteryScore || 0) * 100);
  return Math.round((matches.reduce((sum, c) => sum + c.masteryLevel, 0) / matches.length) * 100);
}

function getLevelTitle(level: number): string {
  if (level >= 40) return 'Legend';
  if (level >= 30) return 'Champion';
  if (level >= 20) return 'Expert';
  if (level >= 15) return 'Veteran';
  if (level >= 10) return 'Apprentice Tactician';
  if (level >= 5) return 'Apprentice';
  return 'Rookie';
}
