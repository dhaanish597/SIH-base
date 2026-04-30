'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Swords, Sparkles, BookOpen, Crown, Beaker, Users, Clock, Star, Zap, Lock, ArrowRight, Search } from 'lucide-react';

type GameInfo = {
  slug: string;
  title: string;
  blurb: string;
  icon: any;
  gradient: string;
  borderGlow: string;
  players: string;
  duration: string;
  subjects: string[];
  rating: number;
  grade: string;
  locked?: boolean;
  unlockLevel?: number;
};

const games: GameInfo[] = [
  {
    slug: 'quiz-battle',
    title: 'QUIZ BATTLE',
    blurb: 'Real-time PvP quiz across up to 30 students. 10 questions, 15 sec each. Power-ups included!',
    icon: Swords,
    gradient: 'from-rose-600 via-pink-600 to-fuchsia-700',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]',
    players: '2–30 players',
    duration: '5 min',
    subjects: ['All Subjects'],
    rating: 4.9,
    grade: 'Grade 6–12',
  },
  {
    slug: 'math-dungeon',
    title: 'MATH DUNGEON',
    blurb: 'Defeat enemies by solving math problems. Explore 5+ dungeon rooms with a final boss battle!',
    icon: Sparkles,
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    players: 'Solo / Race',
    duration: '10 min',
    subjects: ['Mathematics'],
    rating: 4.8,
    grade: 'Grade 6–12',
  },
  {
    slug: 'word-forge',
    title: 'WORD FORGE',
    blurb: 'Vocabulary, grammar & creative writing — AI grades your story in the Story Spark mode.',
    icon: BookOpen,
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]',
    players: 'Solo',
    duration: '8 min',
    subjects: ['English', 'Languages'],
    rating: 4.6,
    grade: 'Grade 6–12',
  },
  {
    slug: 'science-lab',
    title: 'SCIENCE LAB ESCAPE',
    blurb: 'Solo or co-op puzzle escape. Balance equations, label diagrams, solve circuit puzzles.',
    icon: Beaker,
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]',
    players: 'Solo / Co-op',
    duration: '12 min',
    subjects: ['Science', 'Chemistry'],
    rating: 4.7,
    grade: 'Grade 8–12',
  },
  {
    slug: 'history-conquest',
    title: 'HISTORY CONQUEST',
    blurb: 'Capture territories on the map by answering history questions. Claim the throne!',
    icon: Crown,
    gradient: 'from-blue-600 via-indigo-600 to-blue-800',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]',
    players: '2–4 players',
    duration: '15 min',
    subjects: ['History', 'Social Studies'],
    rating: 4.5,
    grade: 'Grade 6–12',
  },
  {
    slug: 'code-wars',
    title: 'CODE WARS',
    blurb: 'Solve coding puzzles and compete in algorithmic battles. Write real code to win!',
    icon: Zap,
    gradient: 'from-cyan-600 via-sky-600 to-blue-600',
    borderGlow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]',
    players: 'Solo / PvP',
    duration: '10 min',
    subjects: ['Coding'],
    rating: 4.9,
    grade: 'Grade 9–12',
    locked: true,
    unlockLevel: 20,
  },
];

const subjects = ['All', 'Math', 'Science', 'English', 'History', 'Coding'];

export default function GamesIndex() {
  const [recentGame, setRecentGame] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/games/history?limit=1', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const sessions = data?.sessions || (Array.isArray(data) ? data : []);
        if (sessions.length > 0) {
          const type = sessions[0].gameType?.toLowerCase().replace(/_/g, '-');
          setRecentGame(type);
        }
      })
      .catch(() => {});
  }, []);

  const filteredGames = games.filter((g) => {
    const matchesFilter = filter === 'All' || g.subjects.some((s) => s.toLowerCase().includes(filter.toLowerCase()));
    const matchesSearch = !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.blurb.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <header className="relative">
        <div className="absolute -top-10 -left-10 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-brand-primary" />
            GAME VAULT
          </h1>
          <p className="text-sm text-text-secondary mt-2 tracking-wide">&quot;Choose your battlefield&quot;</p>
        </div>
      </header>

      {/* Search Bar */}
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

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border
              ${filter === s
                ? 'bg-brand-primary text-white border-brand-primary shadow-glow-sm'
                : 'bg-bg-elevated text-text-secondary border-white/5 hover:text-text-primary hover:border-white/20'
              }`}
          >
            {s}
          </button>
        ))}
        <div className="h-px" />
        <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border bg-bg-elevated text-text-secondary border-white/5 hover:text-text-primary hover:border-white/20`}>
          Solo
        </button>
        <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border bg-bg-elevated text-text-secondary border-white/5 hover:text-text-primary hover:border-white/20`}>
          Multiplayer
        </button>
      </div>

      {/* Continue Playing */}
      {recentGame && (
        <Link
          href={`/student/games/${recentGame}`}
          className="card flex items-center gap-4 p-5 border-brand-primary/30 hover:border-brand-primary group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center relative z-10">
            <Zap className="w-6 h-6 text-brand-primaryGlow" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-sm font-bold text-brand-primaryGlow uppercase tracking-wider">Continue Playing</p>
            <p className="text-xs text-text-secondary mt-0.5">Jump back into your last game</p>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-primary group-hover:translate-x-1 transition-transform relative z-10" />
        </Link>
      )}

      {/* Featured Game (large hero card) */}
      <div className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-[200px] md:h-[260px] bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-end overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCI+PHBhdGggZD0iTTM2IDE1Yy0xLjY1NjMgMC0zIDEuMzQzNy0zIDNzMS4zNDM3IDMgMyAzIDMtMS4zNDM3IDMtMy0xLjM0MzctMy0zLTN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-24 h-24 text-white/20 group-hover:scale-110 transition-transform duration-500" />
          
          <div className="relative z-10 p-6 md:p-8 w-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge text-[10px] bg-white/20 text-white backdrop-blur-sm border border-white/10">⭐ FEATURED</span>
              <span className="badge text-[10px] bg-white/20 text-white backdrop-blur-sm border border-white/10">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.8
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-widest uppercase drop-shadow-lg">MATH DUNGEON</h2>
            <p className="text-white/80 text-sm mt-1">Solve equations, defeat monsters</p>
          </div>
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-primary text-[10px]">Algebra</span>
            <span className="badge badge-primary text-[10px]">Geometry</span>
            <span className="badge badge-primary text-[10px]">Arithmetic</span>
            <span className="badge badge-info text-[10px]">👤 Solo</span>
            <span className="badge badge-info text-[10px]">👥 Multiplayer</span>
            <span className="text-[10px] text-text-secondary font-bold ml-2">Grade 6–12</span>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1 font-mono">Your Progress: Chapter 3/10</p>
            <div className="progress-track h-2">
              <div className="progress-fill" style={{ width: '30%' }} />
            </div>
            <p className="text-xs text-text-muted mt-1 font-mono">Best Score: 2,840 pts</p>
          </div>
          <div className="flex gap-3">
            <Link href="/student/games/math-dungeon" className="btn-primary flex-1 py-3 text-center">
              PLAY SOLO
            </Link>
            <button className="btn-secondary flex-1 py-3">
              FIND OPPONENT
            </button>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {filteredGames.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.slug}
              href={g.locked ? '#' : `/student/games/${g.slug}`}
              className={`card overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${g.borderGlow} ${g.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-disabled={g.locked}
              onClick={g.locked ? (e) => e.preventDefault() : undefined}
            >
              {/* Gradient header */}
              <div className={`relative h-40 bg-gradient-to-br ${g.gradient} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCI+PHBhdGggZD0iTTM2IDE1Yy0xLjY1NjMgMC0zIDEuMzQzNy0zIDNzMS4zNDM3IDMgMyAzIDMtMS4zNDM3IDMtMy0xLjM0MzctMy0zLTN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <Icon className="w-16 h-16 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10" />

                {/* Locked overlay */}
                {g.locked && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-20">
                    <Lock className="w-10 h-10 text-white/80" />
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Unlocks at Level {g.unlockLevel}</p>
                  </div>
                )}

                {/* Rating badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-black/40 text-white backdrop-blur-sm border border-white/10 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {g.rating}
                  </span>
                </div>

                {/* Metadata tags */}
                <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 z-10">
                  <span className="badge text-[10px] bg-black/30 text-white backdrop-blur-sm border border-white/10">
                    <Users className="w-3 h-3" /> {g.players}
                  </span>
                  <span className="badge text-[10px] bg-black/30 text-white backdrop-blur-sm border border-white/10">
                    <Clock className="w-3 h-3" /> {g.duration}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="font-display font-bold text-text-primary group-hover:text-brand-primaryGlow transition-colors tracking-wider uppercase text-sm">{g.title}</p>
                <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{g.blurb}</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {g.subjects.map((s) => (
                    <span key={s} className="badge badge-primary text-[10px]">{s}</span>
                  ))}
                  <span className="text-[10px] text-text-muted font-bold ml-auto">{g.grade}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
