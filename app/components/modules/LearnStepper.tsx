'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SlideRenderer from '@/app/components/modules/SlideRenderer';

interface Slide {
  type: string;
  title: string;
  body: string;
  animationData?: { type: string };
}

interface LearnStepperProps {
  slides: Slide[];
  topicId: string;
  subjectId: string;
  onComplete: () => void;
}

export default function LearnStepper({ slides, topicId, subjectId, onComplete }: LearnStepperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = slides.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progress = total > 1 ? currentIndex / (total - 1) : 1;

  const handlePrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const currentSlide = slides[currentIndex] as {
    type: 'text' | 'diagram' | 'interactive';
    title: string;
    body: string;
    animationData?: { type: string };
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-4">
      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs" style={{ color: 'var(--ink-3)' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Step {currentIndex + 1} of {total}
          </span>
          <span style={{ color: 'var(--violet-bright)', fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '6px', background: 'var(--bg-elev-3)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, var(--violet) 0%, var(--cyan) 100%)',
            }}
          />
        </div>
      </div>

      {/* Slide area */}
      <div className="relative min-h-[320px] md:min-h-[380px] flex items-stretch">
        <AnimatePresence mode="wait">
          <div key={currentIndex} className="w-full">
            <SlideRenderer slide={currentSlide} />
          </div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center gap-3 mt-2">
        <button
          onClick={handlePrev}
          disabled={isFirst}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: isFirst ? 'var(--bg-elev-2)' : 'var(--bg-elev-3)',
            color: isFirst ? 'var(--ink-dim)' : 'var(--ink-2)',
            border: '1px solid var(--line)',
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.5 : 1,
          }}
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
          style={{
            background: isLast
              ? 'var(--green)'
              : 'var(--violet)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: isLast
              ? '0 4px 0 #1a7a40'
              : '0 4px 0 var(--violet-deep)',
          }}
        >
          {isLast ? 'Complete ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
