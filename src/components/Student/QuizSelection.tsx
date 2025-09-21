import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const subjects = [
  { name: 'Mathematics', thumbnail: '/thumbnails/mathLogo.jpg' },
  { name: 'Chemistry', thumbnail: '/thumbnails/ChemistryLogo.png' },
  { name: 'Physics', thumbnail: '/thumbnails/PhysicsLogo.png' },
  { name: 'Biology', thumbnail: '/thumbnails/Biology logo.jpg' }
];

const games = [
  { id: 'cargame', name: 'Car Race Game', thumbnail: '/thumbnails/cargameLogo.jpeg' },
  { id: 'plantsgame', name: 'Plant Game', thumbnail: '/thumbnails/plantgamelogo.jpg' },
  { id: 'fightinggame', name: 'Fighting Game', thumbnail: '/thumbnails/fightgamelogo.jpg' }
];

export function QuizSelection() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<'cargame' | 'plantsgame' | 'fightinggame'>('cargame');

  const startGame = (subject: string) => {
    navigate(`/play-quiz/${selectedGame}?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Choose a Game</h1>
      <div className="mb-8 flex gap-4 flex-wrap justify-center">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id as 'cargame' | 'plantsgame' | 'fightinggame')}
            className={`px-4 py-3 rounded-lg border flex flex-col items-center space-y-2 transition-all duration-200 ${
              selectedGame === game.id 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-500 hover:shadow-md'
            }`}
          >
            <img 
              src={game.thumbnail} 
              alt={`${game.name} logo`}
              className="w-12 h-12 object-contain"
            />
            <span className="text-sm font-medium">{game.name}</span>
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-3">Select Subject</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {subjects.map((subject) => (
          <button
            key={subject.name}
            onClick={() => startGame(subject.name)}
            className="border border-gray-300 hover:border-indigo-500 hover:text-indigo-700 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all duration-200 hover:shadow-md"
          >
            <img 
              src={subject.thumbnail} 
              alt={`${subject.name} logo`}
              className="w-16 h-16 object-contain"
            />
            <span className="text-sm font-medium">{subject.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


