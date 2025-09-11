import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const subjects = ['Mathematics', 'Chemistry', 'Physics', 'Biology'];

export function QuizSelection() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<'cargame' | 'plantsgame' | 'fightinggame'>('cargame');

  const startGame = (subject: string) => {
    navigate(`/play-quiz/${selectedGame}?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Choose a Game</h1>
      <div className="mb-8 flex gap-3 flex-wrap">
        <button
          onClick={() => setSelectedGame('cargame')}
          className={`px-4 py-2 rounded-lg border ${selectedGame==='cargame' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300'}`}
        >
          Car Race Game
        </button>
        <button
          onClick={() => setSelectedGame('plantsgame')}
          className={`px-4 py-2 rounded-lg border ${selectedGame==='plantsgame' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300'}`}
        >
          Plant Game
        </button>
        <button
          onClick={() => setSelectedGame('fightinggame')}
          className={`px-4 py-2 rounded-lg border ${selectedGame==='fightinggame' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300'}`}
        >
          Fighting Game
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-3">Select Subject</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => startGame(s)}
            className="border border-gray-300 hover:border-indigo-500 hover:text-indigo-700 rounded-lg px-3 py-2"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}


