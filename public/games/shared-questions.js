// Shared loader for quiz questions across games
// Exposes window.GameQuizLoader with helpers to fetch and map questions
(function(){
  const FILE_PATH = '/games/Questions.json'; // keep case consistent to work on case-sensitive hosts

  function parseParams() {
    const params = new URLSearchParams(location.search);
    return {
      grade: params.get('grade'),
      subject: params.get('subject'),
      chapter: params.get('chapter')
    };
  }

  function normalizeSubject(subject) {
    return (subject || '').toString().trim().toLowerCase();
  }

  async function fetchAllQuestions() {
    try {
      const res = await fetch(FILE_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load questions.json');
      const json = await res.json();
      try { localStorage.setItem('cached_questions_json', JSON.stringify(json)); } catch {}
      return json;
    } catch (e) {
      // Offline fallback: use cached copy if present
      try {
        const cached = localStorage.getItem('cached_questions_json');
        if (cached) return JSON.parse(cached);
      } catch {}
      // Minimal hardcoded fallback
      return {
        questions_by_grade: {
          '6': {
            Mathematics: { Basics: [ { text: '2 + 2 = ?', choices: ['3','4','5','6'], answerIndex: 1 } ] }
          }
        }
      };
    }
  }

  function unwrapQuestions(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.questions)) return data.questions;
    if (data.questions_by_grade && typeof data.questions_by_grade === 'object') {
      const all = [];
      Object.keys(data.questions_by_grade).forEach((k) => {
        const arr = data.questions_by_grade[k];
        if (Array.isArray(arr)) all.push(...arr);
      });
      return all;
    }
    return [];
  }

  function parseGrade(grade) {
    if (typeof grade === 'number' && Number.isFinite(grade)) return grade;
    const m = String(grade || '').match(/\d+/);
    return m ? Number(m[0]) : NaN;
  }

  function filterQuestions(data, grade, subject, chapter) {
    const g = parseGrade(grade);
    const s = normalizeSubject(subject);
    if (!Number.isFinite(g) || !s) return [];
    
    // Try new chapter-based structure first
    if (data.questions_by_grade && 
        data.questions_by_grade[String(g)] && 
        data.questions_by_grade[String(g)][subject]) {
      
      if (chapter && data.questions_by_grade[String(g)][subject][chapter]) {
        // Return questions for specific chapter
        return data.questions_by_grade[String(g)][subject][chapter];
      } else {
        // Return all questions for the subject (all chapters combined)
        const subjectData = data.questions_by_grade[String(g)][subject];
        const allQuestions = [];
        Object.keys(subjectData).forEach(chapterKey => {
          if (Array.isArray(subjectData[chapterKey])) {
            allQuestions.push(...subjectData[chapterKey]);
          }
        });
        return allQuestions;
      }
    }
    
    // Fallback to old structure
    const list = unwrapQuestions(data);
    return list.filter((q) => {
      const qGrade = typeof q.grade === 'number' ? q.grade : Number(q.grade);
      const qSubject = normalizeSubject(q.subject);
      return qGrade === g && qSubject === s;
    });
  }

  function toNormalized(rawList) {
    return (Array.isArray(rawList) ? rawList : []).map((q) => ({
      id: q.id,
      grade: q.grade,
      subject: q.subject,
      text: q.text,
      choices: q.choices,
      answerIndex: q.answerIndex,
      difficulty: q.difficulty,
      ncert: q.ncert,
      explanation: q.explanation || ''
    }));
  }

  function toCarFormat(normalized) {
    return normalized.map((q) => ({
      question: q.text,
      options: q.choices,
      answer: q.answerIndex,
      explanation: q.explanation || ''
    }));
  }

  function toFightingFormat(normalized) {
    return normalized.map((q) => ({
      q: q.text,
      options: q.choices,
      answer: q.choices && typeof q.answerIndex === 'number' ? q.choices[q.answerIndex] : '',
      explanation: q.explanation || ''
    }));
  }

  async function fetchRecommendedDifficulty(subject) {
    try {
      const token = localStorage.getItem('stem_token');
      if (!token || token === 'demo_token') {
        return null; // No difficulty recommendation for demo/offline
      }
      
      const response = await fetch(`/api/learner/recommended-difficulty?subject=${encodeURIComponent(subject || '')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.recommendedDifficulty || data.optimal_difficulty_level || null;
      }
    } catch (e) {
      console.warn('Failed to fetch recommended difficulty:', e);
    }
    return null;
  }

  function getDifficultyLevel(question) {
    // Check for difficultyLevel (0-1 scale) first
    if (typeof question.difficultyLevel === 'number') {
      return question.difficultyLevel;
    }
    // Fallback to difficulty string (easy/medium/hard)
    if (question.difficulty) {
      const d = String(question.difficulty).toLowerCase();
      if (d === 'easy') return 0.3;
      if (d === 'medium') return 0.5;
      if (d === 'hard') return 0.7;
    }
    // Default to medium
    return 0.5;
  }

  function filterByDifficulty(questions, targetDifficulty, tolerance = 0.2) {
    if (targetDifficulty === null || targetDifficulty === undefined) {
      return questions; // No filtering if no difficulty specified
    }
    
    const minDifficulty = Math.max(0, targetDifficulty - tolerance);
    const maxDifficulty = Math.min(1, targetDifficulty + tolerance);
    
    return questions.filter(q => {
      const qDifficulty = getDifficultyLevel(q);
      return qDifficulty >= minDifficulty && qDifficulty <= maxDifficulty;
    });
  }

  async function loadQuestions(params, targetDifficulty = null) {
    const { grade, subject, chapter } = params || parseParams();
    const all = await fetchAllQuestions();
    let filtered = filterQuestions(all, grade, subject, chapter);
    
    // If targetDifficulty not provided, fetch recommended difficulty
    if (targetDifficulty === null && subject) {
      targetDifficulty = await fetchRecommendedDifficulty(subject);
    }
    
    // Filter by difficulty if we have a target
    if (targetDifficulty !== null) {
      filtered = filterByDifficulty(filtered, targetDifficulty, 0.2);
    }
    
    return toNormalized(filtered);
  }

  window.GameQuizLoader = {
    parseParams,
    loadQuestions,
    toCarFormat,
    toFightingFormat,
    fetchRecommendedDifficulty,
    filterByDifficulty,
    getDifficultyLevel,
  };
})();


