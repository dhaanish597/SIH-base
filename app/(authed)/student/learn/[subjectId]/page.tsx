'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopicNode from '@/app/components/roadmap/TopicNode';
import RoadmapPath from '@/app/components/roadmap/RoadmapPath';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface TopicProgress {
  masteryScore: number;
  learnScore: number | null;
  playScore: number | null;
  practiceScore: number | null;
  quizScore: number | null;
  nextReviewAt: string | null;
}

interface Topic {
  id: string;
  name: string;
  orderIndex: number;
  progress: TopicProgress | null;
  locked: boolean;
}

interface Chapter {
  id: string;
  name: string;
  orderIndex: number;
  topics: Topic[];
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                             */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="w-full rounded-xl border border-[#2D3260] bg-[#0F1128] p-4 animate-pulse">
      <div className="h-2.5 w-1/3 rounded bg-[#2D3260] mb-2" />
      <div className="h-4 w-2/3 rounded bg-[#2D3260]" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map((c) => (
        <section key={c}>
          <div className="h-5 w-40 rounded bg-[#2D3260] mb-4 animate-pulse" />
          <div className="space-y-2">
            {[0, 1, 2].map((t) => (
              <SkeletonCard key={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats bar                                                            */
/* ------------------------------------------------------------------ */

function StatsBar({ chapters }: { chapters: Chapter[] }) {
  const allTopics = chapters.flatMap((c) => c.topics);
  const total    = allTopics.length;
  const mastered = allTopics.filter(
    (t) => t.progress && t.progress.masteryScore >= 0.8
  ).length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#0F1128] border border-[#2D3260]">
      <span
        className="text-sm font-semibold text-[#F5F7FF]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <span className="text-[#10B981]">{mastered}</span>
        <span className="text-[#6F77A6]"> / {total}</span>
        <span className="text-[#6F77A6] ml-2">topics mastered</span>
      </span>

      {/* progress bar */}
      <div className="flex-1 h-2 rounded-full bg-[#1A1D3A] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#10B981] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <span
        className="text-xs text-[#6F77A6] shrink-0"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {pct}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function TopicRoadmapPage() {
  const params   = useParams<{ subjectId: string }>();
  const router   = useRouter();
  const subjectId = params.subjectId;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/learn/topics/${subjectId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data: Chapter[] = await res.json();
        setChapters(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subjectId]);

  function handleTopicSelect(topicId: string) {
    router.push(`/student/learn/${subjectId}/${topicId}/learn`);
  }

  return (
    <main className="min-h-screen bg-[#07070F] text-[#F5F7FF]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Back link */}
        <Link
          href="/student/learn"
          className="inline-flex items-center gap-2 text-sm text-[#6F77A6] hover:text-[#18D6FF] transition-colors"
        >
          <svg
            width="16" height="16" viewBox="0 0 16 16"
            fill="none" aria-hidden="true"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Learning
        </Link>

        {/* Page title */}
        <h1
          className="text-2xl font-bold text-[#F5F7FF]"
          style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif" }}
        >
          Learning Roadmap
        </h1>

        {/* Stats bar */}
        {!loading && !error && chapters.length > 0 && (
          <StatsBar chapters={chapters} />
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-6 text-center space-y-2">
            <p className="text-[#EF4444] font-semibold">Failed to load roadmap</p>
            <p className="text-sm text-[#6F77A6]">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetch(`/api/learn/topics/${subjectId}`, { credentials: 'include' })
                  .then(async (res) => {
                    if (!res.ok) throw new Error(`Server error ${res.status}`);
                    return res.json() as Promise<Chapter[]>;
                  })
                  .then(setChapters)
                  .catch((err: Error) => setError(err.message))
                  .finally(() => setLoading(false));
              }}
              className="mt-1 text-sm font-semibold text-[#18D6FF] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Chapters */}
        {!loading && !error && chapters.length === 0 && (
          <p className="text-center text-[#6F77A6] py-12">
            No topics found for this subject.
          </p>
        )}

        {!loading && !error && chapters.length > 0 && (
          <div className="space-y-10">
            {chapters
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((chapter) => {
                const sortedTopics = chapter.topics
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex);

                return (
                  <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
                    {/* Chapter header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="inline-block w-2 h-6 rounded-full bg-gradient-to-b from-[#6B4BFF] to-[#18D6FF]"
                        aria-hidden="true"
                      />
                      <h2
                        id={`chapter-${chapter.id}`}
                        className="text-base font-bold tracking-wide text-[#B0B7D8] uppercase"
                        style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif" }}
                      >
                        {chapter.name}
                      </h2>
                    </div>

                    {/* Topic list with connectors */}
                    <div className="space-y-0">
                      {sortedTopics.map((topic, idx) => (
                        <div key={topic.id}>
                          <TopicNode
                            id={topic.id}
                            name={topic.name}
                            chapterName={chapter.name}
                            locked={topic.locked}
                            progress={topic.progress}
                            onSelect={handleTopicSelect}
                          />
                          {idx < sortedTopics.length - 1 && (
                            <RoadmapPath height={32} />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        )}
      </div>
    </main>
  );
}
