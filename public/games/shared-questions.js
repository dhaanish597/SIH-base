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
    const res = await fetch(FILE_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load questions.json');
    return res.json();
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

  async function loadQuestions(params) {
    const { grade, subject, chapter } = params || parseParams();
    const all = await fetchAllQuestions();
    const filtered = filterQuestions(all, grade, subject, chapter);
    return toNormalized(filtered);
  }

  window.GameQuizLoader = {
    parseParams,
    loadQuestions,
    toCarFormat,
    toFightingFormat,
  };
})();


