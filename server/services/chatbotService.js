const https = require('https');

// Basic safety filters (lightweight; expand as needed)
const DISALLOWED_PATTERNS = [
  /\b(suicide|self[-\s]?harm|kill myself)\b/i,
  /\b(weapon|bomb|explosive|gun)\b/i,
  /\b(porn|sexual|nude)\b/i,
  /\b(drug[s]?|cocaine|heroin|meth)\b/i,
];

const CHEATING_PATTERNS = [
  /\b(exam paper|question paper|leak|answers to the test|write the exam|do my homework)\b/i,
  /\b(give me the answers|just the answer key|solve the whole assignment)\b/i,
];

function clampGrade(rawGrade) {
  const n = Number(String(rawGrade || '').trim());
  if (!Number.isFinite(n)) return 9;
  return Math.min(12, Math.max(1, Math.round(n)));
}

function gradeBand(grade) {
  if (grade <= 5) return 'primary';
  if (grade <= 8) return 'middle';
  return 'secondary';
}

function subjectNormalize(subject) {
  const s = (subject || '').toString().trim();
  if (!s) return 'General';
  const lc = s.toLowerCase();
  if (lc.includes('math')) return 'Mathematics';
  if (lc.includes('sci')) return 'Science';
  if (lc.includes('eng')) return 'English';
  return s;
}

function isDisallowed(question) {
  return DISALLOWED_PATTERNS.some((re) => re.test(question || ''));
}

function isCheating(question) {
  return CHEATING_PATTERNS.some((re) => re.test(question || ''));
}

function safeTruncateConversation(conversation, maxMessages = 10) {
  if (!Array.isArray(conversation)) return [];
  const trimmed = conversation.slice(-maxMessages);
  return trimmed
    .map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || '').slice(0, 1200),
    }))
    .filter((m) => m.content.trim().length > 0);
}

function makeStructuredResponse({ answer, steps, finalAnswer, example, practiceQuestion, warnings, followUpQuestion, gradeUsed, subjectUsed }) {
  return {
    answer: answer || '',
    finalAnswer: finalAnswer ?? null,
    steps: Array.isArray(steps) ? steps : [],
    example: example || '',
    practiceQuestion: practiceQuestion || '',
    followUpQuestion: followUpQuestion ?? null,
    warnings: Array.isArray(warnings) ? warnings : [],
    gradeUsed,
    subjectUsed,
  };
}

// ---------------------------
// Fallback tutor (no AI keys)
// ---------------------------

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

function simplifyFraction(n, d) {
  if (d === 0) return { n, d };
  const g = gcd(n, d);
  n /= g; d /= g;
  if (d < 0) { n = -n; d = -d; }
  return { n, d };
}

function parseFractionAddSub(q) {
  // Supports: a/b + c/d or a/b - c/d (with optional spaces)
  const m = String(q).match(/(-?\d+)\s*\/\s*(\d+)\s*([+\-])\s*(-?\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]), op = m[3], c = Number(m[4]), d = Number(m[5]);
  if (![a, b, c, d].every(Number.isFinite) || b === 0 || d === 0) return null;
  return { a, b, c, d, op };
}

function fallbackMathFraction(q, grade) {
  const parsed = parseFractionAddSub(q);
  if (!parsed) return null;
  const { a, b, c, d, op } = parsed;
  const common = b * d;
  const left = a * d;
  const right = c * b;
  const num = op === '+' ? (left + right) : (left - right);
  const simp = simplifyFraction(num, common);
  const final = `${simp.n}/${simp.d}`;
  const band = gradeBand(grade);

  const steps = band === 'primary'
    ? [
        `Make the bottoms (denominators) the same: ${b} × ${d} = ${common}.`,
        `Add/subtract the tops (numerators), then keep the same bottom (denominator).`,
      ]
    : [
        `Find a common denominator: ${b} × ${d} = ${common}.`,
        `Convert: ${a}/${b} = ${left}/${common} and ${c}/${d} = ${right}/${common}.`,
        `Compute: ${left} ${op} ${right} = ${num} so result is ${num}/${common}.`,
        `Simplify: ${num}/${common} = ${final}.`,
      ];

  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed: 'Mathematics',
    finalAnswer: final,
    answer: `The answer is **${final}**.`,
    steps,
    example: `Example: 1/2 + 1/4 = 2/4 + 1/4 = 3/4.`,
    practiceQuestion: grade <= 5 ? 'Try: 1/3 + 1/3 = ?' : 'Try: 3/5 - 1/10 = ? (show steps)',
    warnings: [],
  });
}

function fallbackPhotosynthesis(grade) {
  const band = gradeBand(grade);
  const simple = band === 'primary';
  const steps = simple
    ? [
        'Plants use sunlight to make food.',
        'They take in carbon dioxide from air and water from soil.',
        'They make sugar (food) and release oxygen.',
      ]
    : [
        'Plants take in **carbon dioxide (CO₂)** through leaves and **water (H₂O)** through roots.',
        'Using **sunlight** and **chlorophyll**, they make **glucose (food)**.',
        'They release **oxygen (O₂)** as a by-product.',
      ];

  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed: 'Science',
    finalAnswer: null,
    answer: simple
      ? 'Photosynthesis is how plants make their food using sunlight.'
      : 'Photosynthesis is the process where plants make glucose (food) using sunlight, water, and carbon dioxide.',
    steps,
    example: simple
      ? 'Example: A plant kept in sunlight grows better than one kept in a dark room.'
      : 'Example: In sunlight, leaves make more glucose; that’s why plants grow faster with enough light and water.',
    practiceQuestion: simple
      ? 'Practice: What 2 things do plants need to make food?'
      : 'Practice: Name the inputs and outputs of photosynthesis.',
    warnings: [],
  });
}

function fallbackLinearEquations(grade) {
  const band = gradeBand(grade);
  const steps = band === 'primary'
    ? ['Tell me the exact equation (like 2x + 3 = 11), and I will help step-by-step.']
    : [
        'To solve ax + b = c: subtract b from both sides.',
        'Then divide by a to get x.',
      ];
  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed: 'Mathematics',
    answer: 'Linear equations are solved by doing the same operation on both sides to isolate x.',
    finalAnswer: null,
    steps,
    example: 'Example: Solve 2x + 3 = 11. Subtract 3 → 2x = 8. Divide by 2 → x = 4.',
    practiceQuestion: grade <= 5 ? 'Practice: Solve x + 5 = 9.' : 'Practice: Solve 3x - 7 = 11.',
    warnings: [],
  });
}

function fallbackTutor({ grade, subject, question }) {
  const q = String(question || '').trim();
  const subj = subjectNormalize(subject);

  // Heuristics
  if (/photo\s*synthe/i.test(q) || /photosynthesis/i.test(q)) {
    return fallbackPhotosynthesis(grade);
  }

  // Fractions add/sub
  const frac = fallbackMathFraction(q, grade);
  if (frac) return frac;

  if (/\b(linear equation|solve for x|equation)\b/i.test(q) && subj === 'Mathematics') {
    return fallbackLinearEquations(grade);
  }

  // Default generic response
  const band = gradeBand(grade);
  const followUpQuestion =
    q.length < 6
      ? 'Can you tell me the full question (and the subject)?'
      : null;

  const steps =
    band === 'primary'
      ? ['Tell me what topic this is (Math/Science/English) and the exact question.']
      : ['Tell me the exact question and the chapter/topic name, and I will solve it step-by-step.'];

  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed: subj,
    answer:
      'I can help! Please share the full question, and if you know it, tell me the subject or chapter.',
    finalAnswer: null,
    steps,
    example: subj === 'Mathematics'
      ? 'Example question: “Solve 2x + 3 = 11”'
      : 'Example question: “Explain photosynthesis”',
    practiceQuestion: subj === 'Mathematics'
      ? (grade <= 5 ? 'Practice: 1/2 + 1/2 = ?' : 'Practice: Solve 4x + 5 = 21')
      : 'Practice: Write 2 lines about what plants need to grow.',
    followUpQuestion,
    warnings: [],
  });
}

// ---------------------------
// OpenAI (optional) via HTTPS
// ---------------------------

function httpsJsonRequest({ hostname, path, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const status = res.statusCode || 0;
          if (status < 200 || status >= 300) {
            return reject(new Error(`HTTP ${status}: ${data.slice(0, 500)}`));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function buildOpenAiMessages({ grade, subject, question, conversation }) {
  const band = gradeBand(grade);
  const subjectUsed = subjectNormalize(subject);
  const styleGuide =
    band === 'primary'
      ? 'Use very simple words. Use at most 3 short steps. Use small numbers. Be encouraging.'
      : band === 'middle'
      ? 'Use clear words. Use 3-6 steps. Give one example. Keep it short and friendly.'
      : 'Use step-by-step reasoning with formulas if needed. Use 4-8 steps. Give one example. Keep it concise.';

  const outputSchema = `Return ONLY valid JSON with this shape:\n{\n  \"answer\": string,\n  \"finalAnswer\": string|null,\n  \"steps\": string[],\n  \"example\": string,\n  \"practiceQuestion\": string,\n  \"followUpQuestion\": string|null,\n  \"warnings\": string[]\n}\nNo markdown fences. No extra keys.`;

  const system = [
    'You are a helpful, kind tutor for rural school students.',
    `Student grade: ${grade}. Subject: ${subjectUsed}.`,
    'Be grade-appropriate. Do not go beyond grade level unless explicitly asked.',
    'If the question is unclear, ask at most ONE follow-up question in followUpQuestion.',
    'Always provide: answer, steps, one example, and one practice question.',
    'Safety: refuse harmful/explicit/illegal requests. For cheating requests, guide learning instead.',
    styleGuide,
    outputSchema,
  ].join('\n');

  const msgs = [{ role: 'system', content: system }];
  const ctx = safeTruncateConversation(conversation, 10);
  for (const m of ctx) msgs.push(m);
  msgs.push({ role: 'user', content: String(question || '').slice(0, 1200) });
  return { msgs, subjectUsed };
}

async function askOpenAi({ grade, subject, question, conversation }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const { msgs, subjectUsed } = buildOpenAiMessages({ grade, subject, question, conversation });

  const payload = JSON.stringify({
    model,
    messages: msgs,
    temperature: 0.2,
  });

  const json = await httpsJsonRequest({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    body: payload,
  });

  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty OpenAI response');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // If the model returns non-JSON, fall back
    throw new Error('OpenAI response was not valid JSON');
  }

  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed,
    answer: parsed.answer,
    finalAnswer: parsed.finalAnswer ?? null,
    steps: parsed.steps,
    example: parsed.example,
    practiceQuestion: parsed.practiceQuestion,
    followUpQuestion: parsed.followUpQuestion ?? null,
    warnings: parsed.warnings || [],
  });
}

// Main entry
async function askChatbot({ studentId, grade, subject, question, conversation }) {
  const gradeUsed = clampGrade(grade);
  const subjectUsed = subjectNormalize(subject);
  const q = String(question || '').trim();

  if (!q) {
    return makeStructuredResponse({
      gradeUsed,
      subjectUsed,
      answer: 'Please type your question first.',
      finalAnswer: null,
      steps: [],
      example: '',
      practiceQuestion: '',
      followUpQuestion: 'What question do you want to ask?',
      warnings: [],
    });
  }

  if (isDisallowed(q)) {
    return makeStructuredResponse({
      gradeUsed,
      subjectUsed,
      answer: 'Sorry, I can’t help with that. I can help with school subjects like Math and Science.',
      finalAnswer: null,
      steps: ['Ask me a school question, and I will explain step-by-step.'],
      example: 'Example: “What is 2/3 + 1/6?”',
      practiceQuestion: 'Practice: What is 1/2 + 1/4?',
      followUpQuestion: null,
      warnings: ['blocked_content'],
    });
  }

  if (isCheating(q)) {
    return makeStructuredResponse({
      gradeUsed,
      subjectUsed,
      answer: 'I can’t give an answer key, but I can definitely teach you how to solve it.',
      finalAnswer: null,
      steps: ['Tell me one question from the paper, and I will guide you step-by-step.'],
      example: 'Example: “Solve 2x + 3 = 11”',
      practiceQuestion: 'Practice: Solve 3x + 2 = 14',
      followUpQuestion: 'Paste ONE question you want to learn (not the whole paper).',
      warnings: ['academic_integrity'],
    });
  }

  const provider = (process.env.CHATBOT_PROVIDER || '').toLowerCase();
  const hasOpenAiKey = !!process.env.OPENAI_API_KEY;

  // Prefer OpenAI if configured; otherwise fallback.
  if ((provider === 'openai' || provider === '') && hasOpenAiKey) {
    try {
      return await askOpenAi({ grade: gradeUsed, subject: subjectUsed, question: q, conversation });
    } catch (e) {
      console.error('[chatbot] OpenAI failed, using fallback:', e.message);
      return fallbackTutor({ grade: gradeUsed, subject: subjectUsed, question: q });
    }
  }

  return fallbackTutor({ grade: gradeUsed, subject: subjectUsed, question: q });
}

module.exports = { askChatbot };

