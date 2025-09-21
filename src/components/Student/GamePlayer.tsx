import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function GamePlayer() {
  const { gameName } = useParams();
  const query = useQuery();
  const subject = query.get('subject') || 'Mathematics';
  const chapter = query.get('chapter') || '';
  const grade = query.get('grade') || '6';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Support nested folder for FightingGame
  const src = gameName === 'fightinggame'
    ? `/games/FightingGame/index.html?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`
    : `/games/${gameName}.html?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;

  // Ensure cleanup if parent unmounts; adding visibility handling for pausing if needed
  useEffect(() => {
    const onVisibility = () => {
      // Optionally postMessage to iframe to pause game if supported
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Ensure the iframe is scrolled into view at the very top when mounted/changed
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    // Scroll the element into view at the top of the container and window as a fallback
    try {
      el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    } catch {}
    // Fallback for some browsers
    const rect = el.getBoundingClientRect();
    if (typeof window !== 'undefined' && rect.top > 0) {
      window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'instant' as ScrollBehavior });
    }
  }, [src]);

  return (
    <div className="w-full h-[calc(100vh-120px)] p-4">
      <iframe
        ref={iframeRef}
        title="Quiz Game"
        src={src}
        className="w-full h-full rounded-lg border"
      />
    </div>
  );
}


