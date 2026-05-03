'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  choices: string[];
  answerIndex: number;
  explanation: string | null;
}

interface QuizRunnerProps {
  questions: Question[];
  topicId: string;
  subjectId: string;
  onComplete: (score: number) => void;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizRunner({ questions, topicId, subjectId, onComplete }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const isAnswered = selectedIndex !== null;

  const correctCount = answers.filter((a, i) => a === questions[i]?.answerIndex).length;

  const handleSelect = useCallback(
    (idx: number) => {
      if (selectedIndex !== null) return;
      setSelectedIndex(idx);
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = idx;
        return next;
      });
    },
    [selectedIndex, currentIndex]
  );

  const handleNext = useCallback(() => {
    if (!isAnswered) return;
    if (isLast) {
      const finalScore = (correctCount / total) * 100;
      onComplete(finalScore);
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  }, [isAnswered, isLast, correctCount, total, onComplete]);

  if (showResults) {
    const pct = Math.round((correctCount / total) * 100);
    const scoreColor =
      pct >= 70 ? 'var(--green)' : pct >= 50 ? '#F59E0B' : 'var(--red, #EF4444)';

    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4 py-2">
        {/* Score hero */}
        <div
          className="rounded-2xl flex flex-col items-center gap-3 py-8 px-6"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
        >
          <span
            className="text-6xl font-black"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: scoreColor }}
          >
            {correctCount} / {total}
          </span>
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: scoreColor }}
          >
            {pct}%
          </span>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>
            {pct >= 70
              ? 'Great work — topic mastered!'
              : pct >= 50
              ? 'Good effort — review the red ones below.'
              : 'Keep practising — you will get there!'}
          </p>
        </div>

        {/* Per-question breakdown */}
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const userAns = answers[i];
            const isCorrect = userAns === q.answerIndex;
            return (
              <div
                key={q.id}
                className="rounded-xl px-4 py-3 flex flex-col gap-1"
                style={{
                  background: 'var(--bg-elev-2)',
                  border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--red, #EF4444)'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="text-base font-bold mt-0.5"
                    style={{ color: isCorrect ? 'var(--green)' : 'var(--red, #EF4444)', flexShrink: 0 }}
                  >
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-sm leading-snug" style={{ color: 'var(--ink-1)' }}>
                    <span
                      className="font-semibold mr-1"
                      style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-3)', fontSize: '0.7rem' }}
                    >
                      Q{i + 1}
                    </span>
                    {q.text}
                  </p>
                </div>
                {!isCorrect && (
                  <p className="text-xs pl-6" style={{ color: 'var(--green)' }}>
                    Correct answer: {CHOICE_LABELS[q.answerIndex]}. {q.choices[q.answerIndex]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
          style={{
            background: 'var(--violet)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 0 var(--violet-dark, #4c1d95)',
          }}
        >
          ← Back to Roadmap
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-4">
      {/* Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs" style={{ color: 'var(--ink-3)' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Question {currentIndex + 1} of {total}
          </span>
          <span style={{ color: 'var(--violet-bright, var(--violet))', fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(((currentIndex) / total) * 100)}%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '6px', background: 'var(--bg-elev-3)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(currentIndex / total) * 100}%`,
              background: 'linear-gradient(90deg, var(--violet) 0%, var(--cyan) 100%)',
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        className="rounded-2xl px-5 py-6 min-h-[120px] flex items-center"
        style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
      >
        <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--ink-1)' }}>
          {currentQuestion.text}
        </p>
      </div>

      {/* Choices */}
      <div className="flex flex-col gap-3">
        {currentQuestion.choices.map((choice, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectChoice = idx === currentQuestion.answerIndex;
          let bg = 'var(--bg-elev-2)';
          let borderColor = 'var(--line)';
          let textColor = 'var(--ink-1)';

          if (isAnswered) {
            if (isCorrectChoice) {
              bg = 'rgba(16,185,129,0.12)';
              borderColor = 'var(--green)';
              textColor = 'var(--green)';
            } else if (isSelected && !isCorrectChoice) {
              bg = 'rgba(239,68,68,0.12)';
              borderColor = 'var(--red, #EF4444)';
              textColor = 'var(--red, #EF4444)';
            }
          } else {
            if (isSelected) {
              bg = 'rgba(107,75,255,0.15)';
              borderColor = 'var(--violet)';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-left transition-all duration-200 active:scale-[0.98]"
              style={{
                background: bg,
                border: `1px solid ${borderColor}`,
                color: textColor,
                cursor: isAnswered ? 'default' : 'pointer',
              }}
            >
              <span
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  background: isAnswered && isCorrectChoice
                    ? 'var(--green)'
                    : isAnswered && isSelected && !isCorrectChoice
                    ? 'var(--red, #EF4444)'
                    : 'var(--bg-elev-3)',
                  color: isAnswered && (isCorrectChoice || (isSelected && !isCorrectChoice))
                    ? '#fff'
                    : 'var(--ink-2)',
                }}
              >
                {CHOICE_LABELS[idx]}
              </span>
              <span className="text-sm font-medium leading-snug">{choice}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {isAnswered && currentQuestion.explanation && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--cyan)' }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--cyan)' }}>
            Explanation
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Next / Results button */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
          style={{
            background: isLast ? 'var(--green)' : 'var(--violet)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: isLast
              ? '0 4px 0 #059669'
              : '0 4px 0 var(--violet-dark, #4c1d95)',
          }}
        >
          {isLast ? 'See Results →' : 'Next Question →'}
        </button>
      )}
    </div>
  );
}
