'use client';

import { useState } from 'react';

interface Example {
  problem: string;
  steps: string[];
  answer: string;
}

interface PracticeExamplesProps {
  examples: Example[];
  topicId: string;
  subjectId: string;
  onComplete: (score: number) => void;
}

const RATINGS = {
  got_it: 1.0,
  mostly: 0.6,
  not_really: 0.2,
} as const;

export default function PracticeExamples({
  examples,
  onComplete,
}: PracticeExamplesProps) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const [rated, setRated] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);

  const total = examples.length;
  const current = examples[exampleIndex];
  const allStepsShown = stepsRevealed >= current.steps.length;

  function handleShowStep() {
    setStepsRevealed((n) => Math.min(n + 1, current.steps.length));
  }

  function handleRate(value: number) {
    if (rated) return;
    setRated(true);
    const newRatings = [...ratings, value];
    setRatings(newRatings);

    const isLast = exampleIndex === total - 1;

    if (isLast) {
      const sum = newRatings.reduce((a, b) => a + b, 0);
      const score = Math.round((sum / total) * 100);
      // Brief delay so user sees the rating selection before transition
      setTimeout(() => onComplete(score), 600);
    } else {
      setTimeout(() => {
        setExampleIndex((i) => i + 1);
        setStepsRevealed(0);
        setRated(false);
      }, 600);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-[var(--cyan)] tracking-wide">
          Example {exampleIndex + 1} of {total}
        </span>
        <div className="flex gap-1">
          {examples.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i < exampleIndex
                  ? 'bg-[var(--cyan)]'
                  : i === exampleIndex
                  ? 'bg-[var(--violet)]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Problem statement */}
      <div className="border-l-4 border-[var(--cyan)] bg-white/5 rounded-r-lg px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-[var(--cyan)] mb-2 font-semibold">
          Problem
        </p>
        <p className="text-white/90 leading-relaxed">{current.problem}</p>
      </div>

      {/* Steps */}
      {stepsRevealed > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Solution Steps
          </p>
          <ol className="flex flex-col gap-2">
            {current.steps.slice(0, stepsRevealed).map((step, i) => (
              <li
                key={i}
                className="flex gap-3 items-start bg-white/5 rounded-lg px-4 py-3 animate-fade-in"
              >
                <span className="font-mono text-[var(--violet)] text-sm mt-0.5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-white/80 text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Show next step button */}
      {!allStepsShown && (
        <button
          onClick={handleShowStep}
          className="self-start px-5 py-2.5 rounded-lg border border-[var(--violet)] text-[var(--violet)] text-sm font-semibold hover:bg-[var(--violet)]/10 transition-colors"
        >
          {stepsRevealed === 0 ? 'Show first step' : 'Show next step'}
        </button>
      )}

      {/* Answer — shown after all steps revealed */}
      {allStepsShown && (
        <div className="border border-[var(--gold)]/40 bg-[var(--gold)]/5 rounded-lg px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-[var(--gold)] mb-2 font-semibold">
            Answer
          </p>
          <p className="text-[var(--gold)] font-mono text-sm leading-relaxed">
            {current.answer}
          </p>
        </div>
      )}

      {/* Understanding rating — shown after all steps + answer */}
      {allStepsShown && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/50 text-center">How well did you follow this?</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate(RATINGS.got_it)}
              disabled={rated}
              className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                rated
                  ? 'opacity-40 cursor-not-allowed border-white/10 text-white/30'
                  : 'border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)]/10'
              }`}
            >
              ✓ Got it!
            </button>
            <button
              onClick={() => handleRate(RATINGS.mostly)}
              disabled={rated}
              className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                rated
                  ? 'opacity-40 cursor-not-allowed border-white/10 text-white/30'
                  : 'border-amber-400 text-amber-400 hover:bg-amber-400/10'
              }`}
            >
              ~ Mostly
            </button>
            <button
              onClick={() => handleRate(RATINGS.not_really)}
              disabled={rated}
              className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                rated
                  ? 'opacity-40 cursor-not-allowed border-white/10 text-white/30'
                  : 'border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)]/10'
              }`}
            >
              ✗ Not really
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
