import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

export function LessonViewer() {
  const params = useParams();
  const chapterFile = params.chapterFile || '';
  const src = useMemo(() => `/lessons/science/${encodeURIComponent(chapterFile)}`, [chapterFile]);

  return (
    <div className="w-full h-[calc(100vh-120px)] p-4">
      <div className="mb-3">
        <Link to="/lessons/science" className="text-indigo-600 hover:underline">← Back to Science Chapters</Link>
      </div>
      <iframe
        title={chapterFile}
        src={src}
        className="w-full h-full rounded-lg border"
      />
    </div>
  );
}

export default LessonViewer;


