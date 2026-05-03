'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubjectNode from '../../../components/roadmap/SubjectNode';

// ── Types ────────────────────────────────────────────────────────────────────

type Subject = {
  id: string;
  name: string;
  iconKey: string;
  avgMastery: number;
};

type ReviewItem = {
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectName: string;
  masteryScore: number;
  nextReviewAt: string;
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SubjectSkeleton() {
  return (
    <div className="rounded-xl bg-[#161930] border border-[#2D3260] p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-[#2A2F55]" />
        <div className="w-14 h-14 rounded-full bg-[#2A2F55]" />
      </div>
      <div className="w-2/3 h-4 rounded bg-[#2A2F55]" />
      <div className="w-1/3 h-3 rounded bg-[#1F2342]" />
    </div>
  );
}

// ── Review chip ───────────────────────────────────────────────────────────────

function ReviewChip({ item }: { item: ReviewItem }) {
  return (
    <a
      href="/student/learn"
      className="
        flex-shrink-0 flex flex-col gap-0.5 px-3 py-2 rounded-lg
        border border-[#FFC93C] bg-[#1A1500]
        hover:bg-[#2A2000] transition-colors
      "
    >
      <span className="text-xs font-semibold text-[#FFC93C] truncate max-w-[140px]">
        {item.topicName}
      </span>
      <span className="text-[10px] text-[#6F77A6] truncate max-w-[140px]">
        {item.subjectName} · {item.chapterName}
      </span>
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const router = useRouter();

  const [subjects, setSubjects]       = useState<Subject[]>([]);
  const [loadingS, setLoadingS]       = useState(true);
  const [errorS, setErrorS]           = useState<string | null>(null);

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  // review section is hidden until load completes and items exist
  const [reviewReady, setReviewReady] = useState(false);

  // Fetch subjects
  useEffect(() => {
    let cancelled = false;
    setLoadingS(true);
    setErrorS(null);

    fetch('/api/learn/subjects', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Subject[]>;
      })
      .then(data => {
        if (!cancelled) setSubjects(data);
      })
      .catch(err => {
        if (!cancelled) setErrorS(err.message ?? 'Failed to load subjects');
      })
      .finally(() => {
        if (!cancelled) setLoadingS(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Fetch review-due topics
  useEffect(() => {
    let cancelled = false;

    fetch('/api/learn/review-due', { credentials: 'include' })
      .then(res => {
        if (!res.ok) return [] as ReviewItem[];
        return res.json() as Promise<ReviewItem[]>;
      })
      .then(data => {
        if (!cancelled) {
          setReviewItems(Array.isArray(data) ? data : []);
          setReviewReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReviewReady(true); // hide silently on error
      });

    return () => { cancelled = true; };
  }, []);

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/student/learn/${subjectId}`);
  };

  return (
    <main className="min-h-screen bg-[#07070F] px-4 pb-12 pt-6 md:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-2xl md:text-3xl font-black text-[#F5F7FF] mb-1"
          style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif" }}
        >
          📚 Learning Roadmap
        </h1>
        <p className="text-sm text-[#6F77A6]">
          Choose a subject to start
        </p>
      </div>

      {/* Due-for-Review row — only shown when items exist */}
      {reviewReady && reviewItems.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-xs font-bold uppercase tracking-widest text-[#FFC93C] mb-3"
          >
            Due for Review
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {reviewItems.map(item => (
              <ReviewChip key={item.topicId} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Error state */}
      {errorS && (
        <div className="rounded-xl border border-[#FF5A4D] bg-[#1A0800] p-4 text-sm text-[#FF5A4D] mb-6">
          Could not load subjects: {errorS}
        </div>
      )}

      {/* Subject grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingS
          ? Array.from({ length: 3 }).map((_, i) => <SubjectSkeleton key={i} />)
          : subjects.map(subject => (
              <SubjectNode
                key={subject.id}
                id={subject.id}
                name={subject.name}
                iconKey={subject.iconKey}
                avgMastery={subject.avgMastery}
                onClick={() => handleSubjectClick(subject.id)}
              />
            ))}
      </div>

      {/* Empty state (loaded but no subjects) */}
      {!loadingS && !errorS && subjects.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-[#6F77A6]">
          <span className="text-4xl">📚</span>
          <p className="text-sm">No subjects assigned yet.</p>
        </div>
      )}
    </main>
  );
}
