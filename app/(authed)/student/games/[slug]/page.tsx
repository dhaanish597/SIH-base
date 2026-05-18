'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Gamepad2, Swords, Sparkles, BookOpen, Crown, Beaker } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../../providers';
import dynamic from 'next/dynamic';
import FeedbackDisplay, { type FeedbackData } from '../../../../components/quiz/FeedbackDisplay';

const MathDungeonGame    = dynamic(() => import('../../../../components/games/MathDungeonGame'),    { ssr: false });
const WordForgeGame      = dynamic(() => import('../../../../components/games/WordForgeGame'),      { ssr: false });
const ScienceLabGame     = dynamic(() => import('../../../../components/games/ScienceLabGame'),     { ssr: false });
const HistoryConquestGame = dynamic(() => import('../../../../components/games/HistoryConquestGame'), { ssr: false });
const BattleZoneGame     = dynamic(() => import('../../../../components/games/BattleZoneGame'),     { ssr: false });
const PuzzleArenaGame    = dynamic(() => import('../../../../components/games/PuzzleArenaGame'),    { ssr: false });
const CardForgeGame      = dynamic(() => import('../../../../components/games/CardForgeGame'),      { ssr: false });

const GAME_META: Record<string, { title: string; blurb: string; icon: any; tint: string; type: 'phaser' | 'socket' | 'iframe' | 'react' }> = {
  'quiz-battle': {
    title: 'Quiz Battle',
    blurb: 'Real-time PvP quiz across 30 students. 10 questions, 15 sec each.',
    icon: Swords,
    tint: 'from-rose-400 to-rose-600',
    type: 'socket',
  },
  'math-dungeon': {
    title: 'Math Dungeon',
    blurb: 'Solve math problems to defeat enemies and bosses across 5+ rooms.',
    icon: Sparkles,
    tint: 'from-amber-400 to-amber-600',
    type: 'phaser',
  },
  'word-forge': {
    title: 'Word Forge',
    blurb: 'Vocabulary, grammar and creative writing — AI grades your story.',
    icon: BookOpen,
    tint: 'from-violet-400 to-violet-600',
    type: 'phaser',
  },
  'science-lab': {
    title: 'Science Lab Escape',
    blurb: 'Solo or co-op puzzle escape. Balance equations, label diagrams.',
    icon: Beaker,
    tint: 'from-emerald-400 to-emerald-600',
    type: 'phaser',
  },
  'history-conquest': {
    title: 'History Conquest',
    blurb: 'Capture territories on the map by answering history questions.',
    icon: Crown,
    tint: 'from-indigo-400 to-indigo-600',
    type: 'react',
  },
  'battle-zone': {
    title: 'Battle Zone',
    blurb: 'Defeat 3 monster bosses by solving math problems under a 10s timer.',
    icon: Swords,
    tint: 'from-rose-500 to-red-600',
    type: 'react',
  },
  'puzzle-arena': {
    title: 'Puzzle Arena',
    blurb: 'Memory-match formulas with their names before the timer runs out.',
    icon: Sparkles,
    tint: 'from-cyan-400 to-blue-600',
    type: 'react',
  },
  'card-forge': {
    title: 'Card Forge',
    blurb: 'Build a hand of formula cards and defeat the Fog of Forgetting.',
    icon: BookOpen,
    tint: 'from-violet-500 to-purple-700',
    type: 'react',
  },
};

export default function GamePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug ?? '';
  const meta = GAME_META[slug];
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  if (!meta) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Game not found.</p>
        <Link href="/student/games" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
          Back to games
        </Link>
      </div>
    );
  }

  const grade = Number(user?.class) || 9;

  if (slug === 'quiz-battle') return <QuizBattleLobby />;

  if (slug === 'math-dungeon') {
    return (
      <div className="flex flex-col h-screen relative">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-[#12122a] text-white z-10 relative">
          <Link href="/student/games" className="text-gray-400 hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm">Math Dungeon</span>
          <span className="ml-auto text-xs text-gray-500">Grade {grade}</span>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <MathDungeonGame grade={grade} onExit={() => router.push('/student/games')} />
        </div>
      </div>
    );
  }

  if (slug === 'word-forge') {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-violet-950 text-white z-10 relative">
          <Link href="/student/games" className="text-gray-400 hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BookOpen className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-sm">Word Forge</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <WordForgeGame grade={grade} onExit={() => router.push('/student/games')} />
        </div>
      </div>
    );
  }

  if (slug === 'science-lab') {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-emerald-950 text-white z-10 relative">
          <Link href="/student/games" className="text-gray-400 hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Beaker className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-sm">Science Lab Escape</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ScienceLabGame grade={grade} onExit={() => router.push('/student/games')} />
        </div>
      </div>
    );
  }

  if (slug === 'history-conquest') {
    return <HistoryConquestGame grade={grade} onExit={() => router.push('/student/games')} />;
  }

  if (slug === 'battle-zone') {
    return <BattleZoneGame grade={grade} onExit={() => router.push('/student/games')} />;
  }

  if (slug === 'puzzle-arena') {
    return <PuzzleArenaGame grade={grade} onExit={() => router.push('/student/games')} />;
  }

  if (slug === 'card-forge') {
    return <CardForgeGame grade={grade} onExit={() => router.push('/student/games')} />;
  }

  return (
    <>
      <PhaserPlaceholder meta={meta} slug={slug} />
      {feedback && <FeedbackDisplay data={feedback} onClose={() => { setFeedback(null); router.push('/student/games'); }} />}
    </>
  );
}

function PhaserPlaceholder({ meta, slug }: { meta: (typeof GAME_META)[string]; slug: string }) {
  const Icon = meta.icon;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <Link href="/student/games" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-gray-900">{meta.title}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${meta.tint} flex items-center justify-center mx-auto`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{meta.title}</h2>
          <p className="text-sm text-gray-500">{meta.blurb}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Gamepad2 className="w-5 h-5 mx-auto mb-2 text-amber-600" />
            Phaser 3 game engine loading for this game is coming in the next sprint.
            The backend (XP, quests, leaderboard) is already wired up and ready.
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizBattleLobby() {
  const [phase, setPhase] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');

  const join = () => {
    if (!classCode.trim()) { setError('Enter a class code'); return; }
    setError('');
    setPhase('waiting');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <Link href="/student/games" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Swords className="w-5 h-5 text-rose-500" />
        <h1 className="font-bold text-gray-900">Quiz Battle</h1>
      </div>

      {phase === 'lobby' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full space-y-4">
            <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white text-center">
              <Swords className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-xl font-bold">Real-time Quiz Battle</h2>
              <p className="text-rose-100 text-sm mt-1">10 questions · 15 sec each · Up to 30 players</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">Class Code</label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="e.g. MATH9A"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
              />
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                onClick={join}
                className="w-full bg-rose-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-rose-600"
              >
                Join Battle
              </button>
            </div>
            <p className="text-xs text-center text-gray-400">
              Your teacher or host will provide the class code to join a live session.
            </p>
          </div>
        </div>
      )}

      {phase === 'waiting' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto animate-pulse">
              <Swords className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Waiting for host to start…</h2>
            <p className="text-sm text-gray-500">Lobby code: <span className="font-mono font-bold text-gray-900">{classCode}</span></p>
            <button
              onClick={() => setPhase('lobby')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Leave lobby
            </button>
            <p className="text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              Real-time Socket.io multiplayer backend is ready. Frontend game UI coming next sprint.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
