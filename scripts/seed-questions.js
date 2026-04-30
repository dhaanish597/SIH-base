/* eslint-disable no-console */
// Seeds the normalized question bank from public/games/Questions.json.
// Creates Subject + Chapter rows and inserts Question rows with legacyId
// preserved so we can cross-reference old quiz data.

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const prisma = require('../server/lib/prisma');

const QUESTIONS_PATH = path.resolve(__dirname, '..', 'public', 'games', 'Questions.json');

function mapDifficulty(d, dl) {
  const num = typeof dl === 'number' ? dl : null;
  if (num != null) {
    if (num < 0.25) return 'EASY';
    if (num < 0.5) return 'MEDIUM';
    if (num < 0.75) return 'HARD';
    if (num < 0.9) return 'EXPERT';
    return 'MASTER';
  }
  const s = String(d || '').toLowerCase();
  if (s.startsWith('eas')) return 'EASY';
  if (s.startsWith('med')) return 'MEDIUM';
  if (s.startsWith('har')) return 'HARD';
  if (s.startsWith('exp')) return 'EXPERT';
  if (s.startsWith('mas')) return 'MASTER';
  return 'MEDIUM';
}

async function ensureSubject(name) {
  return prisma.subject.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function ensureChapter(subjectId, gradeLevel, name) {
  return prisma.chapter.upsert({
    where: { subjectId_gradeLevel_name: { subjectId, gradeLevel, name } },
    update: {},
    create: { subjectId, gradeLevel, name },
  });
}

async function main() {
  if (!fs.existsSync(QUESTIONS_PATH)) {
    console.error('Questions.json not found at', QUESTIONS_PATH);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
  const byGrade = raw.questions_by_grade || {};

  let subjectsCreated = 0;
  let chaptersCreated = 0;
  let questionsCreated = 0;

  for (const gradeKey of Object.keys(byGrade)) {
    const gradeLevel = Number(gradeKey);
    if (!Number.isFinite(gradeLevel)) continue;
    const subjects = byGrade[gradeKey] || {};
    for (const subjectName of Object.keys(subjects)) {
      const subject = await ensureSubject(subjectName);
      subjectsCreated++;

      const chapters = subjects[subjectName] || {};
      for (const chapterName of Object.keys(chapters)) {
        const chapter = await ensureChapter(subject.id, gradeLevel, chapterName);
        chaptersCreated++;

        const questions = chapters[chapterName] || [];
        for (const q of questions) {
          if (!q || !q.text) continue;
          const legacyId = q.id || null;
          const data = {
            subjectId: subject.id,
            chapterId: chapter.id,
            gradeLevel,
            type: 'MCQ',
            text: q.text,
            choices: Array.isArray(q.choices) ? q.choices : null,
            answerIndex: typeof q.answerIndex === 'number' ? q.answerIndex : null,
            difficulty: mapDifficulty(q.difficulty, q.difficultyLevel),
            difficultyLevel: typeof q.difficultyLevel === 'number' ? q.difficultyLevel : 0.5,
            conceptTags: Array.isArray(q.conceptTags) ? q.conceptTags : [],
            ncert: !!q.ncert,
            explanation: q.explanation || null,
            status: 'APPROVED',
          };
          if (legacyId) {
            await prisma.question.upsert({
              where: { legacyId },
              update: data,
              create: { legacyId, ...data },
            });
          } else {
            await prisma.question.create({ data });
          }
          questionsCreated++;
        }
      }
    }
  }

  console.log(`Subjects touched: ${subjectsCreated}`);
  console.log(`Chapters touched: ${chaptersCreated}`);
  console.log(`Questions inserted/updated: ${questionsCreated}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
