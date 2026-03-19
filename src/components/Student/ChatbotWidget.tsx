import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X, Trash2, AlertTriangle, Loader2, Clock, BookOpen } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  // Optional structured payload from API
  data?: {
    answer?: string;
    finalAnswer?: string | null;
    steps?: string[];
    example?: string;
    practiceQuestion?: string;
    followUpQuestion?: string | null;
    warnings?: string[];
    gradeUsed?: number | string;
    subjectUsed?: string;
  };
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatTimeAgo(ts: number) {
  const diffMs = Date.now() - ts;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState<'Mathematics' | 'Science' | 'English' | 'General'>('Mathematics');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const userInfo = useMemo(() => {
    const u = safeJsonParse<{ id?: string; class?: string; role?: string }>(localStorage.getItem('stem_user'));
    return {
      userId: u?.id || 'unknown',
      grade: u?.class || '9',
      role: u?.role || 'student',
    };
  }, []);

  const storageKey = useMemo(() => `chat_history_${userInfo.userId}`, [userInfo.userId]);

  // Restore persisted chat
  useEffect(() => {
    const saved = safeJsonParse<ChatMessage[]>(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved)) {
      setMessages(saved.slice(-30));
      if (saved.length > 0) setLastUpdated(saved[saved.length - 1].createdAt);
    }
  }, [storageKey]);

  // Persist chat
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore storage failures
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom when open/messages change
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages, sending]);

  const conversationForApi = useMemo(() => {
    // Only send last 10 messages as context
    return messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.data?.answer ? m.data.answer : m.content,
    }));
  }, [messages]);

  const addAssistantTypingMessage = () => {
    const typingMsg: ChatMessage = {
      id: `typing_${Date.now()}`,
      role: 'assistant',
      content: 'Typing…',
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, typingMsg]);
    return typingMsg.id;
  };

  const replaceMessageById = (id: string, next: ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? next : m)));
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setLastUpdated(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const ask = async (question: string) => {
    const token = localStorage.getItem('stem_token');
    if (!token) {
      setError('Login required. Please sign in again.');
      return;
    }

    setSending(true);
    setError(null);
    setLastQuestion(question);

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const typingId = addAssistantTypingMessage();

    try {
      const res = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          subject,
          grade: userInfo.grade || '9',
          conversation: conversationForApi,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Request failed (${res.status}): ${txt.slice(0, 200)}`);
      }

      const json = await res.json();
      const data = json?.data || {};
      const answerText = String(data.answer || '').trim() || 'I can help — can you rephrase your question?';

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: answerText,
        createdAt: Date.now(),
        data,
      };

      replaceMessageById(typingId, assistantMsg);
      setLastUpdated(Date.now());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not connect';
      setError('Couldn’t connect. Please try again.');
      const assistantMsg: ChatMessage = {
        id: `a_err_${Date.now()}`,
        role: 'assistant',
        content: 'I couldn’t connect right now. Tap “Retry” to try again.',
        createdAt: Date.now(),
        data: {
          answer: 'I couldn’t connect right now. Tap “Retry” to try again.',
          steps: [],
          example: '',
          practiceQuestion: '',
          warnings: ['network_error'],
        },
      };
      replaceMessageById(typingId, assistantMsg);
      console.error('[chatbot] ask failed:', msg);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || sending) return;
    setInput('');
    await ask(q);
  };

  const handleRetry = async () => {
    if (!lastQuestion || sending) return;
    await ask(lastQuestion);
  };

  if (userInfo.role !== 'student') return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
        aria-label="Open doubt chatbot"
      >
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        <span className="font-semibold">Ask Doubt</span>
      </button>

      {/* Overlay + panel */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Student chatbot">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute bottom-0 right-0 w-full sm:bottom-4 sm:right-4 sm:w-[420px]">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/15">
                      <Bot className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-bold text-lg leading-tight">STEM Buddy</div>
                      <div className="text-xs text-white/90 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3" aria-hidden="true" />
                          Grade {userInfo.grade || '9'}
                        </span>
                        {lastUpdated && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            Updated {formatTimeAgo(lastUpdated)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 text-sm"
                      title="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/20"
                      aria-label="Close chat"
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Subject selector */}
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-sm text-white/90" htmlFor="chatbot-subject">
                    Subject:
                  </label>
                  <select
                    id="chatbot-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as any)}
                    className="text-sm bg-white/15 text-white rounded-xl px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    <option className="text-gray-900" value="Mathematics">Mathematics</option>
                    <option className="text-gray-900" value="Science">Science</option>
                    <option className="text-gray-900" value="English">English</option>
                    <option className="text-gray-900" value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="h-[55vh] sm:h-[520px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-indigo-50/30"
                role="log"
                aria-label="Chat messages"
              >
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-indigo-100 text-indigo-700 mb-3">
                      <Bot className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-gray-900">Ask me anything from your class.</p>
                    <p className="text-sm text-gray-600 mt-1">I’ll explain step-by-step and give a practice question.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isUser = m.role === 'user';
                    const bubbleBase =
                      'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border';
                    const bubbleClass = isUser
                      ? `${bubbleBase} ml-auto bg-indigo-600 text-white border-indigo-600`
                      : `${bubbleBase} mr-auto bg-white text-gray-900 border-gray-200`;

                    return (
                      <div key={m.id} className="flex">
                        <div className={bubbleClass}>
                          {m.role === 'assistant' && m.data ? (
                            <div className="space-y-2">
                              <div className="text-sm leading-relaxed whitespace-pre-line">
                                {m.data.answer || m.content}
                              </div>

                              {m.data.finalAnswer && (
                                <div className="text-sm font-semibold">
                                  Final answer: <span className="text-indigo-700">{m.data.finalAnswer}</span>
                                </div>
                              )}

                              {Array.isArray(m.data.steps) && m.data.steps.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 mb-1">Steps</div>
                                  <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                                    {m.data.steps.slice(0, 10).map((s, idx) => (
                                      <li key={idx} className="leading-relaxed">{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {m.data.example && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 mb-1">Example</div>
                                  <div className="text-sm text-gray-800 whitespace-pre-line">{m.data.example}</div>
                                </div>
                              )}

                              {m.data.practiceQuestion && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                                  <div className="text-xs font-semibold text-indigo-700 mb-1">Practice</div>
                                  <div className="text-sm text-indigo-900">{m.data.practiceQuestion}</div>
                                </div>
                              )}

                              {m.data.followUpQuestion && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                  <div className="text-xs font-semibold text-amber-700 mb-1">Quick question</div>
                                  <div className="text-sm text-amber-900">{m.data.followUpQuestion}</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm leading-relaxed whitespace-pre-line">
                              {m.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

              </div>

              {/* Error bar */}
              {error && (
                <div className="px-4 py-3 border-t border-gray-100 bg-rose-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-rose-800 text-sm">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-sm hover:bg-rose-700"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Composer */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSend();
                    }}
                    placeholder="Type your question…"
                    className="flex-1 min-h-[44px] rounded-2xl border-2 border-gray-200 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    aria-label="Chat input"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !input.trim()}
                    className="min-h-[44px] px-4 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    aria-label="Send"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span className="hidden sm:inline">Sending…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Tip: Ask like “Solve 2/3 + 1/6” or “Explain photosynthesis”.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

