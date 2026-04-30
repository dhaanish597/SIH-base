'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers';

// ── Types ───────────────────────────────────────────────────

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
  completedAt: string | null;
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

type KnowledgeState = {
  mastered_concepts: Array<{ conceptName: string; masteryLevel: number }>;
  learning_concepts: Array<{ conceptName: string; masteryLevel: number }>;
  weak_concepts: Array<{ conceptName: string; masteryLevel: number }>;
  overallMasteryScore: number;
};

const SUBJECTS = [
  { key: 'math',    label: 'Mathematics', emoji: '🔢', color: 'var(--s-math)',    val: 78 },
  { key: 'science', label: 'Science',     emoji: '⚗️', color: 'var(--s-science)', val: 65 },
  { key: 'english', label: 'English',     emoji: '📖', color: 'var(--s-english)', val: 82 },
  { key: 'history', label: 'History',     emoji: '🏛',  color: 'var(--s-history)', val: 41 },
  { key: 'geo',     label: 'Geography',   emoji: '🗺',  color: 'var(--s-geo)',     val: 58 },
  { key: 'coding',  label: 'Coding',      emoji: '💻', color: 'var(--s-coding)',  val: 92 },
];

const ACHIEVEMENTS = [
  { e: '🔥', l: 'Hot Streak', c: 'var(--orange)' },
  { e: '🎯', l: 'Sharp Shot', c: 'var(--cyan)' },
  { e: '⚔️', l: 'First Blood', c: 'var(--hot)' },
  { e: '🧠', l: 'Big Brain',   c: 'var(--violet)' },
  { e: '⚡', l: 'Lightning',  c: 'var(--gold)' },
  { e: '🛡', l: 'Defender',   c: 'var(--green)' },
];

// ── Dashboard ───────────────────────────────────────────────

export default function StudentDashboard() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
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
        ]);
        if (cancelled) return;
        setQuests(results[0].status === 'fulfilled' ? results[0].value : []);
        setGameHistory(results[1].status === 'fulfilled' ? (results[1].value.sessions || results[1].value) : []);
        setKnowledgeState(results[2].status === 'fulfilled' ? results[2].value?.data || results[2].value : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const name = user?.name || 'Warrior';
  const level = user?.level || 14;
  const xp = user?.xp || 1840;
  const xpMax = level * 500;
  const streak = user?.streakDays || 12;
  const coins = user?.totalCoins || 1770;
  const title = getLevelTitle(level);

  const activeQuests = quests.filter(q => q.status === 'ACTIVE');
  const demoQuests = [
    { tag: 'daily',  title: 'Slay 5 Math Mobs',    desc: 'Defeat 5 math problems on any difficulty', reward: 50,  value: 3,  max: 5,  complete: false },
    { tag: 'daily',  title: 'Win a Quiz Battle',    desc: 'Beat any opponent in PvP',                  reward: 75,  value: 0,  max: 1,  complete: false },
    { tag: 'daily',  title: 'Train for 15 min',     desc: 'Study any subject',                         reward: 30,  value: 15, max: 15, complete: true  },
    { tag: 'weekly', title: 'Master Algebra Ch.4',  desc: 'Complete all lessons in chapter 4',         reward: 500, value: 2,  max: 10, complete: false, timeLeft: '3d 12h' },
  ];
  const displayQuests = activeQuests.length > 0
    ? activeQuests.slice(0, 4).map(q => ({ tag: q.type?.toLowerCase() || 'daily', title: q.title, desc: q.description, reward: q.rewardXp, value: q.progress, max: q.goalCount, complete: q.status === 'COMPLETED' }))
    : demoQuests;

  const demoHistory: Array<{ name: string; emoji: string; color: string; xp: number; xpMax: number }> = [
    { name: 'Number Knights', emoji: '🔢', color: 'var(--s-math)',    xp: 340, xpMax: 500 },
    { name: 'Photon Forge',   emoji: '⚗️', color: 'var(--s-science)', xp: 120, xpMax: 400 },
    { name: 'Word Warriors',  emoji: '📖', color: 'var(--s-english)', xp: 80,  xpMax: 200 },
  ];

  const leaderboard = [
    { rank: 1, name: 'Aiden K.', xp: 4820, total: 5000, badges: 42, you: false },
    { rank: 2, name: 'Maya P.',  xp: 4310, total: 5000, badges: 38, you: false },
    { rank: 3, name,             xp: xp + 2400, total: 5000, badges: 29, you: true  },
    { rank: 4, name: 'Liam J.', xp: 2980, total: 5000, badges: 22, you: false },
    { rank: 5, name: 'Sara C.', xp: 2640, total: 5000, badges: 19, you: false },
  ];

  return (
    <div className="arena-bg page-in" style={{ minHeight: '100%' }}>
      <div className="qa-dashboard-grid" style={{ padding: 24, maxWidth: 1320, margin: '0 auto' }}>

        {/* ── MAIN COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* HERO BANNER */}
          <div className="card" style={{ overflow: 'hidden', position: 'relative', border: '2px solid var(--violet)' }}>
            <div className="arena-bg scanlines" style={{ padding: '28px 28px 24px', position: 'relative', minHeight: 220 }}>
              {/* Pixel stars */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%`,
                  width: 2, height: 2,
                  background: i % 3 === 0 ? 'var(--gold)' : 'var(--cyan)',
                  opacity: 0.5 + (i % 5) * 0.1,
                  animation: `pulseGlow ${1 + (i % 4) * 0.5}s ease-in-out infinite`,
                  pointerEvents: 'none',
                }} />
              ))}
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative' }}>
                {/* Avatar octagon */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="pframe violet" style={{ width: 120, height: 120 }}>
                    <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 0 #000)' }}>🧙</span>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                    background: '#000', color: 'var(--gold)',
                    fontFamily: 'var(--f-hud)', fontSize: 12, fontWeight: 700,
                    padding: '3px 10px', border: '2px solid var(--gold)', borderRadius: 999,
                    letterSpacing: '0.08em', boxShadow: '0 2px 0 #000', whiteSpace: 'nowrap',
                  }}>LVL {level}</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.2em' }}>WELCOME BACK,</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 44, lineHeight: 1, marginTop: 4 }}>{name}</div>
                  <div style={{ fontFamily: 'var(--f-hud)', fontSize: 13, color: 'var(--violet-bright)', marginTop: 6 }}>
                    ⚔ Lvl {level} · {title} · Diamond III
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="xp-bar violet" style={{ height: 16, flex: 1 }}>
                      <i style={{ width: `${Math.min(100, (xp / xpMax) * 100)}%` }} />
                    </div>
                    <span style={{ fontFamily: 'var(--f-hud)', color: 'var(--gold)', fontSize: 14, whiteSpace: 'nowrap' }}>{xp}/{xpMax}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <span className="pill pill-orange">🔥 {streak} Day Streak</span>
                    <span className="pill pill-gold">🪙 {coins.toLocaleString()} Coins</span>
                    <span className="pill pill-violet">🏆 Rank #3 in School</span>
                    <span className="pill pill-cyan">⚔ 12W · 3L</span>
                  </div>
                </div>

                {/* CTA buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'stretch', justifyContent: 'center' }}
                  className="hidden md:flex">
                  <Link href="/student/games" className="btn btn-primary" style={{ textDecoration: 'none' }}>▶ Resume Quest</Link>
                  <Link href="/student/leaderboard" className="btn btn-cyan" style={{ textDecoration: 'none' }}>⚡ Quick Battle</Link>
                </div>
              </div>
            </div>
          </div>

          {/* DAILY QUESTS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>⚔️</span>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, margin: 0, flex: 1 }}>Today's Quests</h3>
              <Link href="/student/quests" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View all →</Link>
            </div>
            <div className="qa-quest-grid" style={{ gap: 12 }}>
              {displayQuests.map((q, i) => <QuestCard key={i} {...q} />)}
            </div>
          </div>

          {/* FROM MENTOR + CONTINUE PLAYING */}
          <div className="qa-two-col" style={{ gap: 16 }}>
            {/* FROM MENTOR */}
            <div>
              <SectionHeader icon="📜" title="From your Mentor" />
              <div className="card card-pad" style={{ borderLeft: '4px solid var(--gold)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="pframe gold" style={{ width: 36, height: 36, display: 'grid', placeItems: 'center' }}>
                    <span style={{ fontSize: 16 }}>🧙</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 14 }}>Ms. Reyes</div>
                    <div style={{ fontFamily: 'var(--f-hud)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>Algebra · Period 4</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, marginBottom: 4 }}>Quadratic Quests</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 10 }}>Solve 8 quadratic equations to unlock the boss fight.</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--f-hud)', fontSize: 9, padding: '2px 6px', border: '1.5px solid var(--s-math)', color: 'var(--s-math)', borderRadius: 4, letterSpacing: '0.06em' }}>ALGEBRA</span>
                  <span style={{ fontFamily: 'var(--f-hud)', fontSize: 9, padding: '2px 6px', border: '1.5px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, letterSpacing: '0.06em' }}>+200 XP</span>
                  <span style={{ fontFamily: 'var(--f-hud)', fontSize: 9, padding: '2px 6px', border: '1.5px solid var(--hot)', color: 'var(--hot)', borderRadius: 4, letterSpacing: '0.06em' }}>DUE FRI</span>
                </div>
                <Link href="/student/games" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>Play Now</Link>
              </div>
            </div>

            {/* CONTINUE PLAYING */}
            <div>
              <SectionHeader icon="▶️" title="Continue Playing" />
              <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(gameHistory.length > 0
                  ? gameHistory.slice(0, 3).map(g => ({ name: g.gameType, emoji: '🎮', color: 'var(--violet)', xp: g.xpEarned, xpMax: 500 }))
                  : demoHistory
                ).map((g, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 10, borderRadius: 10,
                    background: 'var(--bg-elev-2)',
                    borderLeft: `4px solid ${g.color}`,
                  }}>
                    <div style={{ fontSize: 24, width: 40, height: 40, display: 'grid', placeItems: 'center', background: '#000', borderRadius: 8 }}>{g.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--f-display)', fontSize: 14 }}>{g.name}</div>
                      <div className="xp-bar cyan" style={{ height: 6, marginTop: 4 }}>
                        <i style={{ width: `${Math.min(100, (g.xp / g.xpMax) * 100)}%` }} />
                      </div>
                    </div>
                    <Link href="/student/games" style={{ fontFamily: 'var(--f-hud)', color: 'var(--cyan)', fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.06em' }}>CONTINUE →</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SKILL MAP */}
          <div>
            <SectionHeader icon="🧠" title="Your Skill Map" />
            <div className="card card-pad qa-skill-grid" style={{ gap: 24, alignItems: 'center' }}>
              <SkillRadar />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SUBJECTS.map(s => (
                  <div key={s.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.06em' }}>{s.emoji} {s.label}</span>
                      <span style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.06em' }}>{s.val}%</span>
                    </div>
                    <div className="xp-bar" style={{ height: 10 }}>
                      <i style={{ width: `${s.val}%`, background: s.color, boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3), 0 0 12px ${s.color}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* MINI LEADERBOARD */}
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>🏆</span>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, margin: 0, flex: 1 }}>School Ladder</h3>
              <span style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>WEEK 17</span>
            </div>
            <div>
              {leaderboard.map(r => <LBRow key={r.rank} {...r} />)}
            </div>
            <div style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--green)', textAlign: 'center', marginTop: 6, padding: 8, background: 'rgba(45,212,110,0.1)', borderRadius: 8, border: '1.5px solid var(--green)', letterSpacing: '0.06em' }}>
              🔥 +500 XP TO PROMOTE TO MASTER LEAGUE
            </div>
          </div>

          {/* DAILY CHEST */}
          <div className="card card-pad" style={{ borderColor: 'var(--gold)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>🎁</span>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, margin: 0 }}>Daily Chest</h3>
            </div>
            <div style={{ height: 100, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 64, filter: 'drop-shadow(0 0 16px var(--gold))', animation: 'pulseGlow 1.6s ease-in-out infinite' }}>📦</span>
            </div>
            <div style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, letterSpacing: '0.06em' }}>UNLOCKS IN</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, color: 'var(--gold)', marginBottom: 12 }}>02:14:38</div>
            <button className="btn btn-gold btn-sm btn-block">Open Chest</button>
          </div>

          {/* ACHIEVEMENTS */}
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>🏅</span>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, margin: 0 }}>Recent Achievements</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {ACHIEVEMENTS.map((a, i) => (
                <div key={i} style={{
                  aspectRatio: '1', display: 'grid', placeItems: 'center',
                  background: 'var(--bg-elev-2)', borderRadius: 12,
                  border: `2px solid ${a.c}`, position: 'relative',
                  boxShadow: `0 0 12px -2px ${a.c}88`,
                }}>
                  <span style={{ fontSize: 26 }}>{a.e}</span>
                  <span style={{ fontFamily: 'var(--f-hud)', position: 'absolute', bottom: 4, fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.l}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.1, margin: 0 }}>{title}</h3>
    </div>
  );
}

function QuestCard({ tag, title, desc, reward, value, max, complete, timeLeft }: {
  tag: string; title: string; desc: string; reward: number; value: number; max: number; complete?: boolean; timeLeft?: string;
}) {
  const tagMap: Record<string, { color: string; bg: string; label: string }> = {
    daily:   { color: 'var(--cyan)',          bg: '#042A36', label: 'Daily' },
    weekly:  { color: 'var(--violet-bright)', bg: '#1A1340', label: 'Weekly' },
    special: { color: 'var(--gold)',           bg: '#2B1F00', label: 'Event' },
    boss:    { color: 'var(--hot)',            bg: '#2A0805', label: 'Boss' },
  };
  const t = tagMap[tag] || tagMap.daily;
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="card card-pad" style={{
      borderLeftWidth: 4, borderLeftColor: complete ? 'var(--green)' : t.color,
      paddingLeft: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <span style={{
            display: 'inline-block', alignSelf: 'flex-start',
            fontFamily: 'var(--f-hud)', fontSize: 9, color: t.color, background: t.bg,
            border: `1.5px solid ${t.color}`, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em',
          }}>{t.label.toUpperCase()}</span>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{desc}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 16 }}>⭐</span>
            <span style={{ fontFamily: 'var(--f-hud)', color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>+{reward}</span>
          </div>
          <div style={{ fontFamily: 'var(--f-hud)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>XP</div>
          {timeLeft && <div style={{ fontFamily: 'var(--f-hud)', fontSize: 10, color: 'var(--hot)', marginTop: 6, letterSpacing: '0.06em' }}>⏱ {timeLeft}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <div className={`xp-bar ${complete ? 'green' : 'cyan'}`} style={{ height: 10, flex: 1 }}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontFamily: 'var(--f-hud)', fontSize: 11, color: 'var(--ink-2)', minWidth: 44, textAlign: 'right', letterSpacing: '0.06em' }}>{value}/{max}</span>
      </div>
      {complete && (
        <button className="btn btn-green btn-sm" style={{ marginTop: 10 }}>Claim {reward} XP</button>
      )}
    </div>
  );
}

function LBRow({ rank, you, name, xp, total, badges }: {
  rank: number; you?: boolean; name: string; xp: number; total: number; badges: number;
}) {
  const variant = you ? 'you' : rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  const variantStyles: Record<string, React.CSSProperties> = {
    gold:   { borderColor: 'var(--gold)',   background: 'linear-gradient(90deg, rgba(255,201,60,0.18), transparent 60%), var(--bg-elev-1)' },
    silver: { borderColor: 'var(--silver)', background: 'linear-gradient(90deg, rgba(201,210,224,0.15), transparent 60%), var(--bg-elev-1)' },
    bronze: { borderColor: 'var(--bronze)', background: 'linear-gradient(90deg, rgba(208,136,80,0.18), transparent 60%), var(--bg-elev-1)' },
    you:    { borderColor: 'var(--violet)', background: 'rgba(107,75,255,0.18)', boxShadow: '0 0 0 1px var(--violet), 0 0 20px -4px var(--violet)' },
  };
  const rankColors: Record<string, string> = {
    gold: 'var(--gold)', silver: 'var(--silver)', bronze: 'var(--bronze)', you: 'var(--violet-bright)',
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '48px 44px 1fr auto',
      alignItems: 'center', gap: 14,
      padding: '10px 14px', borderRadius: 12,
      border: '2px solid var(--line)',
      background: 'var(--bg-elev-1)',
      marginBottom: 8,
      ...(variantStyles[variant] || {}),
    }}>
      <div style={{ fontFamily: 'var(--f-hud)', fontSize: 22, fontWeight: 700, textAlign: 'center', color: rankColors[variant] || 'var(--ink-2)' }}>
        {medal ? <span style={{ fontSize: 22 }}>{medal}</span> : `#${rank}`}
      </div>
      <div className="pframe violet" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontSize: 18 }}>🧙</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>{name}</span>
          {you && <span style={{ fontFamily: 'var(--f-hud)', fontSize: 9, padding: '2px 6px', background: 'var(--violet)', color: '#fff', borderRadius: 4, letterSpacing: '0.1em', fontWeight: 700 }}>YOU</span>}
        </div>
        <div className={`xp-bar ${variant === 'gold' ? '' : variant === 'you' ? 'violet' : 'cyan'}`} style={{ height: 6, marginTop: 4 }}>
          <i style={{ width: `${Math.min(100, (xp / total) * 100)}%` }} />
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--f-hud)', color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>{xp.toLocaleString()}</div>
        <div style={{ fontFamily: 'var(--f-hud)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>XP · {badges} 🏅</div>
      </div>
    </div>
  );
}

function SkillRadar() {
  const subjects = [
    { l: 'MATH',  v: 78, c: 'var(--s-math)' },
    { l: 'SCI',   v: 65, c: 'var(--s-science)' },
    { l: 'ENG',   v: 82, c: 'var(--s-english)' },
    { l: 'HIST',  v: 41, c: 'var(--s-history)' },
    { l: 'GEO',   v: 58, c: 'var(--s-geo)' },
    { l: 'CODE',  v: 92, c: 'var(--s-coding)' },
  ];
  const cx = 110, cy = 110, R = 88;
  const pts = subjects.map((s, i) => {
    const a = (Math.PI * 2 * i / subjects.length) - Math.PI / 2;
    const r = R * (s.v / 100);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, lx: cx + Math.cos(a) * (R + 18), ly: cy + Math.sin(a) * (R + 18), rx: cx + Math.cos(a) * R, ry: cy + Math.sin(a) * R, ...s };
  });
  return (
    <svg viewBox="0 0 220 220" style={{ width: 220, height: 220 }}>
      {[0.25, 0.5, 0.75, 1].map((k, i) => (
        <polygon key={i}
          points={Array.from({ length: 6 }, (_, j) => {
            const a = (Math.PI * 2 * j / 6) - Math.PI / 2;
            return `${cx + Math.cos(a) * R * k},${cy + Math.sin(a) * R * k}`;
          }).join(' ')}
          fill="none" stroke={i === 3 ? '#444' : '#222'} strokeWidth="1" />
      ))}
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.rx} y2={p.ry} stroke="#222" strokeWidth="1" />
      ))}
      <polygon
        points={pts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(107,75,255,0.3)" stroke="var(--violet-bright)" strokeWidth="2" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={p.c} stroke="#000" strokeWidth="1.5" />
          <text x={p.lx} y={p.ly} fill="var(--ink-2)" fontSize="9"
            fontFamily="Oswald, sans-serif" fontWeight="700" textAnchor="middle" dominantBaseline="middle"
            letterSpacing="0.08em">{p.l}</text>
        </g>
      ))}
    </svg>
  );
}

function getLevelTitle(level: number): string {
  if (level >= 40) return 'Legend';
  if (level >= 30) return 'Champion';
  if (level >= 20) return 'Expert';
  if (level >= 15) return 'Veteran';
  if (level >= 10) return 'Apprentice Tactician';
  if (level >= 5)  return 'Apprentice';
  return 'Rookie';
}
