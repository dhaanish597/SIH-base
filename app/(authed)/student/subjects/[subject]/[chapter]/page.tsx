'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function LessonViewerPage() {
  const params = useParams<{ subject: string; chapter: string }>();
  const subject = decodeURIComponent(params.subject ?? '');
  const chapter = decodeURIComponent(params.chapter ?? '');
  const src = `/lessons/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}`;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-bg-overlay/80 backdrop-blur-md flex-shrink-0">
        <Link
          href="/student/subjects"
          className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <span className="text-white/20 select-none">|</span>
        <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider truncate">
          {subject}{chapter ? ` — ${chapter}` : ''}
        </span>
      </div>

      {/* Lesson content iframe */}
      <iframe
        title={`${subject} — ${chapter}`}
        src={src}
        className="flex-1 w-full border-0 bg-bg-deep"
        allow="fullscreen"
      />
    </div>
  );
}
