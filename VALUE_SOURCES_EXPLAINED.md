# Where the Test Results Come From - Value Sources Explained

## ✅ These are **REAL VALUES** stored in your database!

All values are calculated and stored in the SQLite database at `./data/local_analytics.db`. Here's where each value comes from:

---

## 1. **Mastery Level: 0.3** ✅ REAL

**Source:** Calculated using exponential moving average formula

**Calculation:**
```javascript
// First attempt for "linear_equations" concept
// Formula: mastery = (mastery * 0.7) + (isCorrect ? 0.3 : 0)
// Since it's a new concept (no existing mastery):
mastery = (0 * 0.7) + (true ? 0.3 : 0) = 0.3
```

**Stored in:** `concept_mastery` table, `mastery_level` column

**Test input:** `isCorrect: true` → Result: `0.3`

---

## 2. **Confidence: 0.1** ✅ REAL

**Source:** Initial confidence score for new concepts

**Code location:** `server/services/learnerModel.js` line 67
```javascript
const initialConfidence = 0.1;  // Minimum confidence for new concepts
```

**Stored in:** `concept_mastery` table, `confidence_score` column

**Why 0.1?** Low confidence because it's the first attempt - we need more data to be confident about mastery level.

---

## 3. **Attempts: 1** ✅ REAL

**Source:** Counter incremented each time concept is practiced

**Calculation:**
```javascript
attempts_count = 1  // First attempt
```

**Stored in:** `concept_mastery` table, `attempts_count` column

**Test input:** First time calling the API for this concept → Result: `1`

---

## 4. **Overall Mastery Score: 0.3** ✅ REAL

**Source:** Average of all concept mastery levels for the student

**Calculation:**
```javascript
// Only 1 concept exists: "linear_equations" with mastery 0.3
overallMasteryScore = 0.3 / 1 = 0.3
```

**Stored in:** Calculated on-the-fly from `concept_mastery` table

**Code location:** `server/services/learnerModel.js` line 150

---

## 5. **Learning Concepts: 1** ✅ REAL

**Source:** Concepts with mastery level between 0.3 and 0.8

**Categorization:**
- **Mastered:** mastery > 0.8
- **Learning:** 0.3 ≤ mastery ≤ 0.8  ← "linear_equations" falls here
- **Weak:** mastery < 0.3

**Test result:** `linear_equations` has mastery `0.3`, which is exactly at the threshold, so it's categorized as "Learning"

**Stored in:** Calculated from `concept_mastery` table

---

## 6. **Recommended Difficulty: 0.5** ✅ REAL (Default)

**Source:** Default value when no learning profile exists yet

**Code location:** `server/services/learnerModel.js` line 357
```javascript
// No profile exists, return default difficulty
resolve({
  difficulty: 0.5,  // Default middle difficulty
  source: 'default',
  confidence: 0.3
});
```

**Why default?** The learning profile was created AFTER this call, so it used the default value.

**Stored in:** Returned value (not stored, calculated on request)

---

## 7. **Learning Velocity: 2 questions/min** ✅ REAL

**Source:** Calculated from test input data

**Calculation:**
```javascript
// From test script:
timeSpent = 300 seconds
questionsAnswered = 10

// Formula: questionsAnswered / (timeSpent / 60)
velocity = 10 / (300 / 60) = 10 / 5 = 2 questions per minute
```

**Stored in:** `student_learning_profile` table, `average_learning_velocity` column

**Test input:** 
- `timeSpent: 300` (5 minutes)
- `questionsAnswered: 10`
- Result: `2 questions/min`

---

## 8. **Optimal Difficulty: 0.5** ✅ REAL (Initial)

**Source:** Initial default value for new learning profile

**Code location:** `server/services/learnerModel.js` line 257
```javascript
const initialDifficulty = 0.5;  // Middle difficulty to start
```

**Stored in:** `student_learning_profile` table, `optimal_difficulty_level` column

**Why 0.5?** Safe starting point - will adjust based on future performance.

---

## 9. **Engagement Score: 0.5** ✅ REAL (Initial)

**Source:** Initial default value for new learning profile

**Code location:** `server/services/learnerModel.js` line 258
```javascript
const initialEngagement = 0.5;  // Neutral engagement to start
```

**Stored in:** `student_learning_profile` table, `engagement_score` column

**Why 0.5?** Neutral starting point - will increase with activity.

---

## 10. **Preferred Style: visual** ✅ REAL

**Source:** Mapped from test input `modality: "visual"`

**Code location:** `server/services/learnerModel.js` line 260-268
```javascript
const styleMap = {
  'visual': 'visual',
  'video': 'visual',
  'interactive': 'kinesthetic',
  'text': 'reading',
  'reading': 'reading',
  'kinesthetic': 'kinesthetic'
};
const initialStyle = modality ? (styleMap[modality.toLowerCase()] || 'mixed') : 'mixed';
```

**Test input:** `modality: "visual"` → Result: `"visual"`

**Stored in:** `student_learning_profile` table, `preferred_learning_style` column

---

## 📊 Database Tables Used

All data is stored in these SQLite tables:

1. **`concept_mastery`** - Stores concept mastery data
   - `mastery_level`: 0.3
   - `confidence_score`: 0.1
   - `attempts_count`: 1
   - `correct_count`: 1
   - `concept_name`: "linear_equations"
   - `student_id`: (your logged-in user ID)

2. **`student_learning_profile`** - Stores learning profile
   - `average_learning_velocity`: 2.0
   - `optimal_difficulty_level`: 0.5
   - `engagement_score`: 0.5
   - `preferred_learning_style`: "visual"
   - `student_id`: (your logged-in user ID)

---

## 🔍 How to Verify

You can check the database directly:

```powershell
# Open SQLite database
sqlite3 .\data\local_analytics.db

# View concept mastery
SELECT * FROM concept_mastery;

# View learning profile
SELECT * FROM student_learning_profile;
```

---

## 📈 What Happens on Next Test?

If you run the test again:

1. **Mastery Level** will update: `(0.3 * 0.7) + (0.3) = 0.51` (if correct)
2. **Confidence** will increase (more attempts = higher confidence)
3. **Attempts** will increment: `1 → 2`
4. **Learning Velocity** will be recalculated using exponential moving average
5. **Optimal Difficulty** may adjust based on performance

All values are **real, calculated, and stored in your database**! 🎯
