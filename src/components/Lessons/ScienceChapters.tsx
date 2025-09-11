import React from 'react';
import { Link } from 'react-router-dom';

export function ScienceChapters() {
  const chapters = [
    { file: 'chapter1.html', title: 'Chapter 1: Enhanced Learning Slides' },
    { file: 'chapter2.html', title: 'Chapter 2: Diversity in the Living World' },
    { file: 'chapter3.html', title: 'Chapter 3: Mindful Eating' },
    { file: 'chapter4.html', title: 'Chapter 4: Exploring Magnets' },
    { file: 'chapter5.html', title: 'Chapter 5: Measurement of Length and Motion' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Science Chapters</h2>
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <ul className="space-y-3">
          {chapters.map((c) => (
            <li key={c.file}>
              <Link
                to={`/lessons/science/${encodeURIComponent(c.file)}`}
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ScienceChapters;


