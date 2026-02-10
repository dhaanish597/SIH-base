/**
 * Utility functions for mapping and analyzing questions
 * Used for learner model integration
 */

/**
 * Extract concept tags from a question
 * Analyzes question text, chapter, and subject to infer concepts
 * @param {Object} question - Question object
 * @returns {string[]} Array of concept tags
 */
function extractConceptsFromQuestion(question) {
  const concepts = [];
  
  if (!question) {
    return concepts;
  }

  // Normalize text for analysis
  const text = (question.text || '').toLowerCase();
  const chapter = (question.chapter || '').toLowerCase();
  const subject = (question.subject || '').toLowerCase();

  // Common concept patterns
  const conceptPatterns = {
    // Algebra
    'linear_equations': ['linear equation', 'linear', 'y = mx', 'slope', 'intercept'],
    'quadratic_equations': ['quadratic', 'x²', 'parabola', 'discriminant'],
    'algebra': ['algebra', 'variable', 'solve for', 'expression'],
    
    // Geometry
    'geometry': ['geometry', 'angle', 'triangle', 'circle', 'area', 'perimeter'],
    'fractions': ['fraction', 'numerator', 'denominator', 'divide'],
    'decimals': ['decimal', 'point', 'tenth', 'hundredth'],
    
    // Number Theory
    'number_theory': ['number theory', 'prime', 'composite', 'divisor', 'multiple'],
    'patterns': ['pattern', 'sequence', 'series', 'next number'],
    'fibonacci_sequence': ['fibonacci', 'virahanka', 'sum of two preceding'],
    'triangular_numbers': ['triangular number', 'triangular'],
    'square_numbers': ['square number', 'square', 'perfect square'],
    
    // Arithmetic
    'arithmetic': ['arithmetic', 'addition', 'subtraction', 'multiplication', 'division'],
    'odd_numbers': ['odd number', 'odd numbers', 'sum of odd'],
    'even_numbers': ['even number', 'even numbers'],
    
    // Measurement
    'measurement': ['measure', 'unit', 'meter', 'kilogram', 'liter'],
    
    // Data handling
    'data_handling': ['data', 'graph', 'chart', 'mean', 'median', 'mode'],
    
    // Probability
    'probability': ['probability', 'chance', 'likely', 'unlikely', 'outcome'],
  };

  // Check each concept pattern
  for (const [concept, keywords] of Object.entries(conceptPatterns)) {
    const matches = keywords.some(keyword => 
      text.includes(keyword) || chapter.includes(keyword)
    );
    
    if (matches) {
      concepts.push(concept);
    }
  }

  // Add subject-specific concepts
  if (subject.includes('mathematics') || subject.includes('math')) {
    if (!concepts.includes('mathematics')) {
      concepts.push('mathematics');
    }
  }
  
  if (subject.includes('science')) {
    concepts.push('science');
  }
  
  if (subject.includes('physics')) {
    concepts.push('physics');
  }
  
  if (subject.includes('chemistry')) {
    concepts.push('chemistry');
  }
  
  if (subject.includes('biology')) {
    concepts.push('biology');
  }

  // If question already has conceptTags, merge them
  if (question.conceptTags && Array.isArray(question.conceptTags)) {
    question.conceptTags.forEach(tag => {
      if (!concepts.includes(tag)) {
        concepts.push(tag);
      }
    });
  }

  // If no concepts found, add generic ones based on chapter
  if (concepts.length === 0) {
    if (chapter) {
      concepts.push(chapter.replace(/[^a-z0-9]/g, '_').toLowerCase());
    }
    if (subject) {
      concepts.push(subject.toLowerCase());
    }
  }

  return concepts;
}

/**
 * Get question difficulty level (0-1 scale)
 * Converts string difficulty or calculates from question properties
 * @param {Object} question - Question object
 * @returns {number} Difficulty level between 0 and 1
 */
function getQuestionDifficulty(question) {
  if (!question) {
    return 0.5; // Default medium difficulty
  }

  // If difficultyLevel is already set, use it
  if (typeof question.difficultyLevel === 'number') {
    return Math.max(0, Math.min(1, question.difficultyLevel));
  }

  // Convert string difficulty to numeric
  if (question.difficulty) {
    const difficultyMap = {
      'easy': 0.2,
      'beginner': 0.2,
      'medium': 0.5,
      'intermediate': 0.5,
      'hard': 0.8,
      'advanced': 0.8,
      'expert': 0.95,
    };

    const normalized = question.difficulty.toLowerCase().trim();
    if (difficultyMap[normalized] !== undefined) {
      return difficultyMap[normalized];
    }
  }

  // Calculate difficulty based on question properties
  let difficulty = 0.5; // Base medium difficulty

  // Adjust based on grade level (higher grade = higher difficulty)
  if (question.grade) {
    const gradeNum = parseInt(question.grade) || 6;
    // Normalize grade 6-12 to 0.2-0.8 range
    difficulty = 0.2 + ((gradeNum - 6) / 6) * 0.6;
  }

  // Adjust based on number of choices (more choices = harder)
  if (question.choices && Array.isArray(question.choices)) {
    const choiceCount = question.choices.length;
    if (choiceCount === 2) {
      difficulty -= 0.1; // True/false easier
    } else if (choiceCount >= 5) {
      difficulty += 0.1; // More choices harder
    }
  }

  // Adjust based on explanation length (longer explanation might indicate complexity)
  if (question.explanation && question.explanation.length > 200) {
    difficulty += 0.05;
  }

  // Ensure difficulty is within bounds
  return Math.max(0, Math.min(1, difficulty));
}

/**
 * Infer error type from student's incorrect answer
 * Analyzes the difference between student answer and correct answer
 * @param {Object} question - Question object
 * @param {number|string} studentAnswer - Student's answer (index or value)
 * @param {number|string} correctAnswer - Correct answer (index or value)
 * @returns {string} Error type: "calculation", "concept", "application", or "careless"
 */
function inferErrorType(question, studentAnswer, correctAnswer) {
  if (!question || studentAnswer === correctAnswer) {
    return null; // No error if answer is correct
  }

  // If question already has errorType set, use it
  if (question.errorType) {
    return question.errorType;
  }

  const text = (question.text || '').toLowerCase();
  const explanation = (question.explanation || '').toLowerCase();
  const choices = question.choices || [];

  // Get actual answer values for comparison
  let studentValue = studentAnswer;
  let correctValue = correctAnswer;

  // If answers are indices, get the actual choice values
  if (typeof studentAnswer === 'number' && choices[studentAnswer]) {
    studentValue = choices[studentAnswer].toLowerCase();
  }
  if (typeof correctAnswer === 'number' && choices[correctAnswer]) {
    correctValue = choices[correctAnswer].toLowerCase();
  }

  // Convert to strings for comparison
  const studentStr = String(studentValue).toLowerCase().trim();
  const correctStr = String(correctValue).toLowerCase().trim();

  // Check for careless errors (close but wrong)
  // Same length, similar characters, or off-by-one errors
  if (studentStr.length === correctStr.length) {
    let diffCount = 0;
    for (let i = 0; i < studentStr.length; i++) {
      if (studentStr[i] !== correctStr[i]) {
        diffCount++;
      }
    }
    // If only 1-2 characters differ, likely careless
    if (diffCount <= 2 && studentStr.length > 3) {
      return 'careless';
    }
  }

  // Check for calculation errors (numeric answers that are close)
  const studentNum = parseFloat(studentStr);
  const correctNum = parseFloat(correctStr);
  
  if (!isNaN(studentNum) && !isNaN(correctNum)) {
    const diff = Math.abs(studentNum - correctNum);
    const percentDiff = diff / Math.abs(correctNum);
    
    // If answer is within 20% of correct, likely calculation error
    if (percentDiff < 0.2 && percentDiff > 0) {
      return 'calculation';
    }
    
    // If answer is exactly half or double, likely calculation error
    if (studentNum === correctNum / 2 || studentNum === correctNum * 2) {
      return 'calculation';
    }
  }

  // Check question type to infer error
  const isConceptual = text.includes('what is') || 
                       text.includes('which') || 
                       text.includes('define') ||
                       text.includes('name for') ||
                       text.includes('represents');
  
  const isApplication = text.includes('solve') || 
                        text.includes('calculate') || 
                        text.includes('find') ||
                        text.includes('result of') ||
                        text.includes('sum of') ||
                        text.includes('product of');

  // If question asks for a concept/definition and answer is wrong
  if (isConceptual) {
    // Check if student chose a distractor that's conceptually related
    const distractors = ['geometry', 'algebra', 'arithmetic', 'number theory'];
    const studentChoice = choices[studentAnswer]?.toLowerCase() || '';
    if (distractors.some(d => studentChoice.includes(d))) {
      return 'concept'; // Wrong concept selected
    }
    return 'concept';
  }

  // If question requires application/calculation
  if (isApplication) {
    // Check if explanation mentions calculation steps
    if (explanation.includes('calculate') || 
        explanation.includes('add') || 
        explanation.includes('multiply') ||
        explanation.includes('formula')) {
      return 'calculation';
    }
    return 'application';
  }

  // Default: if it's a math question with numbers, likely calculation
  if (question.subject && question.subject.toLowerCase().includes('math')) {
    if (!isNaN(studentNum) && !isNaN(correctNum)) {
      return 'calculation';
    }
  }

  // Default fallback
  return 'concept';
}

/**
 * Process a question to add missing fields
 * Adds conceptTags and difficultyLevel if not present
 * @param {Object} question - Question object
 * @returns {Object} Question with added fields
 */
function enrichQuestion(question) {
  if (!question) {
    return question;
  }

  const enriched = { ...question };

  // Add conceptTags if missing
  if (!enriched.conceptTags || enriched.conceptTags.length === 0) {
    enriched.conceptTags = extractConceptsFromQuestion(question);
  }

  // Add difficultyLevel if missing
  if (typeof enriched.difficultyLevel !== 'number') {
    enriched.difficultyLevel = getQuestionDifficulty(question);
  }

  return enriched;
}

module.exports = {
  extractConceptsFromQuestion,
  getQuestionDifficulty,
  inferErrorType,
  enrichQuestion
};
