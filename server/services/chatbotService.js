// Tutor chatbot — Claude-powered.
// Same external API as before (askChatbot) so existing routes keep working.

const { buildTutorMessages, callClaudeJson } = require('./aiClient');

// ---------------------------
// Safety filters (preserved from previous OpenAI version)
// ---------------------------

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

function makeStructuredResponse({
  answer,
  steps,
  finalAnswer,
  example,
  practiceQuestion,
  warnings,
  followUpQuestion,
  gradeUsed,
  subjectUsed,
}) {
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

// Minimal heuristic fallback for when ANTHROPIC_API_KEY is missing.
function fallbackTutor({ grade, subject, question }) {
  const subj = subjectNormalize(subject);
  const band = gradeBand(grade);
  const steps =
    band === 'primary'
      ? ['Tell me what topic this is (Math/Science/English) and the exact question.']
      : ['Tell me the exact question and the chapter/topic name, and I will solve it step-by-step.'];
  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed: subj,
    answer: 'I can help! Please share the full question, and tell me the subject or chapter.',
    finalAnswer: null,
    steps,
    example:
      subj === 'Mathematics' ? 'Example question: "Solve 2x + 3 = 11"' : 'Example question: "Explain photosynthesis"',
    practiceQuestion:
      subj === 'Mathematics'
        ? grade <= 5
          ? 'Practice: 1/2 + 1/2 = ?'
          : 'Practice: Solve 4x + 5 = 21'
        : 'Practice: Write 2 lines about what plants need to grow.',
    followUpQuestion: null,
    warnings: ['ai_unavailable'],
  });
}

async function askClaude({ grade, subject, question, conversation }) {
  const { system, messages } = buildTutorMessages({ grade, subject, question, conversation });
  const { json } = await callClaudeJson({ system, messages, maxTokens: 800, temperature: 0.2 });
  return makeStructuredResponse({
    gradeUsed: grade,
    subjectUsed: subject,
    answer: json.answer,
    finalAnswer: json.finalAnswer ?? null,
    steps: json.steps,
    example: json.example,
    practiceQuestion: json.practiceQuestion,
    followUpQuestion: json.followUpQuestion ?? null,
    warnings: json.warnings || [],
  });
}

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
      answer: "Sorry, I can't help with that. I can help with school subjects like Math and Science.",
      finalAnswer: null,
      steps: ['Ask me a school question, and I will explain step-by-step.'],
      example: 'Example: "What is 2/3 + 1/6?"',
      practiceQuestion: 'Practice: What is 1/2 + 1/4?',
      followUpQuestion: null,
      warnings: ['blocked_content'],
    });
  }

  if (isCheating(q)) {
    return makeStructuredResponse({
      gradeUsed,
      subjectUsed,
      answer: "I can't give an answer key, but I can definitely teach you how to solve it.",
      finalAnswer: null,
      steps: ['Tell me one question from the paper, and I will guide you step-by-step.'],
      example: 'Example: "Solve 2x + 3 = 11"',
      practiceQuestion: 'Practice: Solve 3x + 2 = 14',
      followUpQuestion: 'Paste ONE question you want to learn (not the whole paper).',
      warnings: ['academic_integrity'],
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackTutor({ grade: gradeUsed, subject: subjectUsed, question: q });
  }

  try {
    return await askClaude({ grade: gradeUsed, subject: subjectUsed, question: q, conversation });
  } catch (e) {
    console.error('[chatbot] Claude failed, using fallback:', e.message);
    return fallbackTutor({ grade: gradeUsed, subject: subjectUsed, question: q });
  }
}

module.exports = {
  askChatbot,
  // Exposed for tests/other services
  clampGrade,
  gradeBand,
  subjectNormalize,
  makeStructuredResponse,
};
