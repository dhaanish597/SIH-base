// Utility functions for handling questions data

export interface Question {
  id: string;
  grade: number;
  subject: string;
  chapter: string;
  text: string;
  choices: string[];
  answerIndex: number;
  difficulty: string; // Legacy: "easy", "medium", "hard" - kept for backward compatibility
  difficultyLevel?: number; // New: 0-1 scale (0 = easiest, 1 = hardest)
  conceptTags?: string[]; // New: e.g., ["linear_equations", "algebra"]
  errorType?: string; // New: "calculation", "concept", "application", "careless" (only set when wrong)
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

// Convert string difficulty to numeric difficultyLevel (0-1)
export function convertDifficultyToLevel(difficulty: string): number {
  const difficultyMap: { [key: string]: number } = {
    'easy': 0.2,
    'beginner': 0.2,
    'medium': 0.5,
    'intermediate': 0.5,
    'hard': 0.8,
    'advanced': 0.8,
    'expert': 0.95,
  };
  
  const normalized = difficulty?.toLowerCase().trim() || 'medium';
  return difficultyMap[normalized] ?? 0.5;
}

// Ensure question has required fields, adding defaults if missing
export function enrichQuestion(question: Question): Question {
  const enriched = { ...question };
  
  // Add difficultyLevel if missing
  if (typeof enriched.difficultyLevel !== 'number') {
    enriched.difficultyLevel = convertDifficultyToLevel(enriched.difficulty);
  }
  
  // Add conceptTags if missing (empty array)
  if (!enriched.conceptTags || !Array.isArray(enriched.conceptTags)) {
    enriched.conceptTags = [];
  }
  
  return enriched;
}
