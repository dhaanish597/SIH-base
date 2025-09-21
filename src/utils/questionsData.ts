// Utility functions for handling questions data

export interface Question {
  id: string;
  grade: number;
  subject: string;
  chapter: string;
  text: string;
  choices: string[];
  answerIndex: number;
  difficulty: string;
  ncert: boolean;
  explanation: string;
}

export interface QuestionsData {
  questions_by_grade: {
    [grade: string]: {
      [subject: string]: {
        [chapter: string]: Question[];
      };
    };
  };
}

// Cache for questions data
let questionsCache: QuestionsData | null = null;

// Fetch questions data from the JSON file
export async function fetchQuestionsData(): Promise<QuestionsData> {
  if (questionsCache) {
    return questionsCache;
  }

  try {
    const response = await fetch('/games/Questions.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch questions data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    questionsCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching questions data:', error);
    throw error;
  }
}

// Get available subjects for a specific grade
export async function getSubjectsForGrade(grade: string): Promise<string[]> {
  const data = await fetchQuestionsData();
  const gradeData = data.questions_by_grade[grade];
  if (!gradeData) {
    return [];
  }
  return Object.keys(gradeData);
}

// Get available chapters for a specific grade and subject
export async function getChaptersForSubject(grade: string, subject: string): Promise<string[]> {
  const data = await fetchQuestionsData();
  const gradeData = data.questions_by_grade[grade];
  if (!gradeData || !gradeData[subject]) {
    return [];
  }
  return Object.keys(gradeData[subject]);
}

// Get questions for a specific grade, subject, and chapter
export async function getQuestionsForChapter(grade: string, subject: string, chapter: string): Promise<Question[]> {
  const data = await fetchQuestionsData();
  const gradeData = data.questions_by_grade[grade];
  if (!gradeData || !gradeData[subject] || !gradeData[subject][chapter]) {
    return [];
  }
  return gradeData[subject][chapter];
}

// Get total question count for a chapter
export async function getQuestionCountForChapter(grade: string, subject: string, chapter: string): Promise<number> {
  const questions = await getQuestionsForChapter(grade, subject, chapter);
  return questions.length;
}

// Get available grades from the questions data
export async function getAvailableGrades(): Promise<string[]> {
  const data = await fetchQuestionsData();
  return Object.keys(data.questions_by_grade);
}

// Get completion status for a chapter (placeholder for now)
export function getChapterCompletion(grade: string, subject: string, chapter: string): { completed: number; total: number } {
  // TODO: Implement progress tracking from localStorage
  // For now, return 0 completed questions
  return { completed: 0, total: 0 };
}
