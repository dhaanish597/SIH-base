// Shared Anthropic Claude client with cache-aware helpers.

const Anthropic = require('@anthropic-ai/sdk');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Tutor system prompt — long, stable, cacheable. Anything we send under
// `cache_control: { type: "ephemeral" }` becomes a 5-min reusable cache
// breakpoint, dramatically lowering cost for repeat tutor queries.
const TUTOR_SYSTEM_BASE = [
  'You are a kind, patient tutor for school students in India (grades 1-12).',
  'You explain step-by-step in plain language. You never give exam answers verbatim,',
  'but you DO walk students through the reasoning so they can solve similar problems.',
  '',
  'House rules:',
  '- Always be grade-appropriate. Do not introduce concepts above the stated grade unless asked.',
  '- Refuse harmful, illegal, sexual, or self-harm content politely.',
  '- For homework / cheating requests, redirect: teach a similar problem, then ask the student to try one.',
  '- Use simple words. Prefer short sentences over long ones.',
  '- One example. One short practice question to try.',
  '',
  'Output format: ALWAYS return ONE JSON object (no markdown fences, no commentary outside JSON):',
  '{',
  '  "answer": "<one-line summary of the answer>",',
  '  "finalAnswer": "<canonical numeric/text answer or null>",',
  '  "steps": ["<step 1>", "<step 2>", ...],',
  '  "example": "<one worked example>",',
  '  "practiceQuestion": "<one short practice problem>",',
  '  "followUpQuestion": "<a clarifying question, or null>",',
  '  "warnings": []',
  '}',
].join('\n');

function gradeBandStyle(grade) {
  if (grade <= 5) return 'Use VERY simple words. Use at most 3 short steps. Use small numbers. Be encouraging.';
  if (grade <= 8) return 'Use clear words. Use 3-6 steps. Give one example. Keep it short and friendly.';
  return 'Use clear step-by-step reasoning with formulas if needed. Use 4-8 steps. Give one example. Keep it concise.';
}

function buildTutorMessages({ grade, subject, conversation, question }) {
  const trimmedHistory = (Array.isArray(conversation) ? conversation : [])
    .slice(-10)
    .map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || '').slice(0, 1200),
    }))
    .filter((m) => m.content.trim().length > 0);

  const messages = [
    ...trimmedHistory,
    { role: 'user', content: String(question || '').slice(0, 2000) },
  ];

  // System content array: cached base + per-request grade context
  const system = [
    {
      type: 'text',
      text: TUTOR_SYSTEM_BASE,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: `Student grade: ${grade}\nSubject: ${subject}\nStyle: ${gradeBandStyle(grade)}`,
    },
  ];

  return { system, messages };
}

async function callClaudeJson({ system, messages, maxTokens = 800, temperature = 0.2 }) {
  const c = getClient();
  const res = await c.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
  });

  const textBlock = (res.content || []).find((b) => b.type === 'text');
  const text = textBlock ? textBlock.text : '';

  // Strip code fences in case model returned ```json ... ```
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return { json: JSON.parse(cleaned), usage: res.usage };
  } catch {
    throw new Error('Claude response was not valid JSON: ' + cleaned.slice(0, 200));
  }
}

module.exports = {
  getClient,
  buildTutorMessages,
  callClaudeJson,
  MODEL,
  TUTOR_SYSTEM_BASE,
};
