'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Beaker, BookOpen, Clock, Crown, Gamepad2, Lock, Search, Sparkles, Swords, Users, Zap } from 'lucide-react';

type GameInfo = {
  slug: string;
  gameType: string;
  title: string;
  blurb: string;
  players: string;
  duration: string;
  subjects: string[];
  grade: string;
  modes: string[];
  accent: string;
  locked: boolean;
  unlockLevel: number;
  assigned: boolean;
  assignments: Array<{ id: string; className: string | null; dueDate: string | null; instructions: string | null }>;
  stats: { plays: number; bestScore: number; lastPlayedAt: string | null };
};

const iconBySlug: Record<string, any> = {
  'quiz-battle':      Swords,
  'math-dungeon':     Sparkles,
  'word-forge':       BookOpen,
  'science-lab':      Beaker,
  'history-conquest': Crown,
  'battle-zone':      Swords,
  'puzzle-arena':     Sparkles,
  'card-forge':       BookOpen,
};

const styleByAccent: Record<string, { gradient: string; glow: string }> = {
  rose:    { gradient: 'from-rose-600 via-pink-600 to-fuchsia-700',    glow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]' },
  amber:   { gradient: 'from-amber-500 via-orange-600 to-red-600',     glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]' },
  violet:  { gradient: 'from-violet-600 via-purple-600 to-indigo-700', glow: 'hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]' },
  emerald: { gradient: 'from-emerald-500 via-teal-600 to-cyan-700',    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]' },
  indigo:  { gradient: 'from-blue-600 via-indigo-600 to-blue-800',     glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]' },
  cyan:    { gradient: 'from-cyan-400 via-sky-500 to-blue-600',        glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]' },
};

export default function GamesIndex() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/games/catalog', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load games (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setGames(Array.isArray(data.games) ? data.games : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load game catalog.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const subjects = useMemo(() => ['All', ...Array.from(new Set(games.flatMap((g) => g.subjects)))], [games]);
  const recentGame = games.find((g) => g.stats.lastPlayedAt);
  const assignedGames = games.filter((g) => g.assigned);
  const featuredGame = assignedGames[0] || games.find((g) => g.slug === 'math-dungeon') || games[0];

  const filteredGames = games.filter((g) => {
    const matchesFilter = filter === 'All' || g.subjects.some((s) => s.toLowerCase().includes(filter.toLowerCase()));
    const matchesSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.blurb.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="relative">
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-brand-primary" />
            Game Vault
          </h1>
          <p className="text-sm text-text-secondary mt-2 tracking-wide">Live game catalog and class assignments</p>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-11 bg-bg-overlay/50"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border
              ${filter === s ? 'bg-brand-primary text-white border-brand-primary shadow-glow-sm' : 'bg-bg-elevated text-text-secondary border-white/5 hover:text-text-primary hover:border-white/20'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-64" />)}
        </div>
      )}

      {!loading && error && <div className="card p-5 border-red-500/30 text-red-300 text-sm">{error}</div>}

      {!loading && !error && games.length === 0 && (
        <div className="card p-8 text-center text-text-secondary">No games are enabled yet.</div>
      )}

      {!loading && !error && recentGame && (
        <Link href={`/student/games/${recentGame.slug}`} className="card flex items-center gap-4 p-5 border-brand-primary/30 hover:border-brand-primary group relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center relative z-10">
            <Zap className="w-6 h-6 text-brand-primaryGlow" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-sm font-bold text-brand-primaryGlow uppercase tracking-wider">Continue Playing</p>
            <p className="text-xs text-text-secondary mt-0.5">{recentGame.title} - best score {recentGame.stats.bestScore}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-primary group-hover:translate-x-1 transition-transform relative z-10" />
        </Link>
      )}

      {!loading && !error && featuredGame && (
        <GameHero game={featuredGame} />
      )}

      {!loading && !error && assignedGames.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-text-primary uppercase tracking-widest">Assigned by Teacher</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedGames.map((g) => <GameCard key={`assigned-${g.slug}`} game={g} assigned />)}
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-text-primary uppercase tracking-widest">Library</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {filteredGames.map((g) => <GameCard key={g.slug} game={g} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function GameHero({ game }: { game: GameInfo }) {
  const style = styleByAccent[game.accent] || styleByAccent.violet;
  const Icon = iconBySlug[game.slug] || Gamepad2;
  return (
    <div className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className={`relative h-[200px] md:h-[260px] bg-gradient-to-br ${style.gradient} flex items-end overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-24 h-24 text-white/20 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10 p-6 md:p-8 w-full">
          <div className="flex items-center gap-2 mb-2">
            {game.assigned && <span className="badge text-[10px] bg-white/20 text-white backdrop-blur-sm border border-white/10">ASSIGNED</span>}
            <span className="badge text-[10px] bg-white/20 text-white backdrop-blur-sm border border-white/10">{game.stats.plays} plays</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-widest uppercase drop-shadow-lg">{game.title}</h2>
          <p className="text-white/80 text-sm mt-1">{game.blurb}</p>
        </div>
      </div>
      <div className="p-6 md:p-8 space-y-4">
        <GameMeta game={game} />
        <div>
          <p className="text-xs text-text-secondary mb-1 font-mono">Best Score: {game.stats.bestScore}</p>
          {game.assignments[0]?.dueDate && <p className="text-xs text-accent-gold font-mono">Due {new Date(game.assignments[0].dueDate).toLocaleDateString()}</p>}
        </div>
        <Link href={game.locked ? '#' : `/student/games/${game.slug}`} className={`btn-primary block py-3 text-center ${game.locked ? 'pointer-events-none opacity-50' : ''}`}>
          {game.locked ? `Unlocks at Level ${game.unlockLevel}` : 'Play'}
        </Link>
      </div>
    </div>
  );
}

function GameCard({ game, assigned = false }: { game: GameInfo; assigned?: boolean }) {
  const style = styleByAccent[game.accent] || styleByAccent.violet;
  const Icon = iconBySlug[game.slug] || Gamepad2;
  return (
    <Link
      href={game.locked ? '#' : `/student/games/${game.slug}`}
      className={`card overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${style.glow} ${game.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-disabled={game.locked}
      onClick={game.locked ? (e) => e.preventDefault() : undefined}
    >
      <div className={`relative h-40 bg-gradient-to-br ${style.gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <Icon className="w-16 h-16 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10" />
        {game.locked && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-20">
            <Lock className="w-10 h-10 text-white/80" />
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Unlocks at Level {game.unlockLevel}</p>
          </div>
        )}
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          {assigned && <span className="px-2 py-1 rounded-lg text-[10px] bg-black/40 text-white border border-white/10 font-bold">ASSIGNED</span>}
          <span className="px-2 py-1 rounded-lg text-[10px] bg-black/40 text-white border border-white/10 font-bold">{game.stats.plays} plays</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 z-10">
          <span className="badge text-[10px] bg-black/30 text-white backdrop-blur-sm border border-white/10">
            <Users className="w-3 h-3" /> {game.players}
          </span>
          <span className="badge text-[10px] bg-black/30 text-white backdrop-blur-sm border border-white/10">
            <Clock className="w-3 h-3" /> {game.duration}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="font-display font-bold text-text-primary group-hover:text-brand-primaryGlow transition-colors tracking-wider uppercase text-sm">{game.title}</p>
        <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{game.blurb}</p>
        <GameMeta game={game} compact />
      </div>
    </Link>
  );
}

function GameMeta({ game, compact = false }: { game: GameInfo; compact?: boolean }) {
  return (
    <div className={`flex gap-1.5 flex-wrap ${compact ? 'mt-3' : ''}`}>
      {game.subjects.map((s) => <span key={s} className="badge badge-primary text-[10px]">{s}</span>)}
      {game.modes.map((m) => <span key={m} className="badge badge-info text-[10px]">{m}</span>)}
      <span className="text-[10px] text-text-muted font-bold ml-auto">{game.grade}</span>
    </div>
  );
}
