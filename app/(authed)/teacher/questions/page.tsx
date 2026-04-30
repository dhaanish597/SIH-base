'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Plus, Filter, Check, X } from 'lucide-react';

type Question = {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  gradeLevel: number;
  choices: string[] | null;
  answerIndex: number | null;
  correctAnswer: string | null;
  status: string;
  conceptTags: string[];
};

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
const GRADES = [6, 7, 8, 9, 10, 11, 12];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState(9);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/questions?subject=${encodeURIComponent(subject)}&grade=${grade}&limit=50`, {
      credentials: 'include',
    });
    if (r.ok) setQuestions(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [subject, grade]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add question
        </button>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm text-gray-700 focus:outline-none"
          >
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-400">Grade</span>
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="text-sm text-gray-700 focus:outline-none"
          >
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <p className="self-center text-sm text-gray-500">{questions.length} questions</p>
      </div>

      {showForm && <AddQuestionForm subject={subject} grade={grade} onDone={() => { setShowForm(false); load(); }} />}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No questions found. Add some!</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{q.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                      q.difficulty === 'HARD' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{q.difficulty}</span>
                  </div>
                  <p className="text-sm text-gray-900">{q.text}</p>
                  {q.choices && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {q.choices.map((c, ci) => (
                        <div key={ci} className={`text-xs px-2 py-1 rounded-lg ${ci === q.answerIndex ? 'bg-emerald-50 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                          {ci === q.answerIndex && <Check className="inline w-3 h-3 mr-0.5" />}
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddQuestionForm({ subject, grade, onDone }: { subject: string; grade: number; onDone: () => void }) {
  const [form, setForm] = useState({
    text: '',
    type: 'MCQ',
    difficulty: 'MEDIUM',
    choices: ['', '', '', ''],
    answerIndex: 0,
    correctAnswer: '',
    explanation: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const setChoice = (i: number, v: string) => {
    const next = [...form.choices];
    next[i] = v;
    set('choices', next);
  };

  const submit = async () => {
    if (!form.text.trim()) { setError('Question text is required'); return; }
    setSaving(true);
    setError('');
    const body: any = {
      subject, gradeLevel: grade,
      text: form.text, type: form.type, difficulty: form.difficulty,
      explanation: form.explanation || null,
    };
    if (form.type === 'MCQ') {
      body.choices = form.choices.filter(Boolean);
      body.answerIndex = form.answerIndex;
    } else {
      body.correctAnswer = form.correctAnswer;
    }
    const r = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (r.ok) {
      onDone();
    } else {
      const err = await r.json().catch(() => ({}));
      setError(err.error || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New Question</h2>
        <button onClick={onDone} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select value={form.type} onChange={(e) => set('type', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="MCQ">Multiple Choice (MCQ)</option>
          <option value="TRUE_FALSE">True / False</option>
          <option value="SHORT_ANSWER">Short Answer</option>
        </select>
        <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <textarea
        value={form.text}
        onChange={(e) => set('text', e.target.value)}
        placeholder="Question text…"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {form.type === 'MCQ' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Choices (mark correct with radio)</p>
          {form.choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="ans" checked={form.answerIndex === i} onChange={() => set('answerIndex', i)}
                className="accent-indigo-600" />
              <input
                value={c}
                onChange={(e) => setChoice(i, e.target.value)}
                placeholder={`Choice ${i + 1}`}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      )}

      {form.type !== 'MCQ' && (
        <input
          value={form.correctAnswer}
          onChange={(e) => set('correctAnswer', e.target.value)}
          placeholder="Correct answer"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      <input
        value={form.explanation}
        onChange={(e) => set('explanation', e.target.value)}
        placeholder="Explanation (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {error && <p className="text-xs text-rose-500">{error}</p>}
      <p className="text-xs text-gray-400">New questions will be submitted for approval before appearing in games.</p>

      <button
        onClick={submit}
        disabled={saving}
        className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Submit Question'}
      </button>
    </div>
  );
}
