import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        loading: "Loading...",
        error: "Something went wrong",
        retry: "Try Again",
        save: "Save",
        cancel: "Cancel",
        continue: "Continue",
        back: "Back",
        next: "Next",
        complete: "Complete",
        points: "Points",
        level: "Level",
        streak: "Streak",
        offline: "Offline Mode",
        online: "Online",
        syncing: "Syncing...",
        synced: "Synced"
      },
      navigation: {
        dashboard: "Dashboard",
        lessons: "Lessons",
        quizzes: "Quizzes",
        badges: "Badges",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout"
      },
      student: {
        welcome: "Welcome back, {{name}}!",
        dailyQuiz: "Daily Quiz",
        contineLearning: "Continue Learning",
        achievements: "Achievements",
        progress: "Your Progress",
        totalPoints: "Total Points",
        currentStreak: "Current Streak",
        lessonsCompleted: "Lessons Completed",
        quizzesCompleted: "Quizzes Completed",
        newBadgeEarned: "New Badge Earned!",
        levelUp: "Level Up! You're now level {{level}}",
        dailyGoal: "Daily Goal",
        weeklyGoal: "Weekly Goal"
      },
      teacher: {
        dashboard: "Teacher Dashboard",
        students: "Students",
        analytics: "Analytics",
        reports: "Reports",
        assignments: "Assignments",
        classroom: "Classroom",
        studentProgress: "Student Progress",
        engagement: "Engagement Metrics",
        performance: "Performance Overview",
        downloadReport: "Download Report",
        syncData: "Sync Data"
      },
      lessons: {
        math: "Mathematics",
        science: "Science",
        technology: "Technology",
        engineering: "Engineering",
        difficulty: "Difficulty",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        downloadForOffline: "Download for Offline",
        downloaded: "Downloaded",
        startLesson: "Start Lesson"
      },
      badges: {
        firstLesson: "First Steps",
        firstLessonDesc: "Complete your first lesson",
        streakMaster: "Streak Master",
        streakMasterDesc: "Maintain a 7-day learning streak",
        quizAce: "Quiz Ace",
        quizAceDesc: "Score 100% on any quiz",
        mathWizard: "Math Wizard",
        mathWizardDesc: "Complete 10 math lessons",
        scienceExplorer: "Science Explorer",
        scienceExplorerDesc: "Complete 10 science lessons"
      },
      quiz: {
        question: "Question {{current}} of {{total}}",
        timeRemaining: "Time Remaining",
        submit: "Submit Answer",
        nextQuestion: "Next Question",
        viewResults: "View Results",
        score: "Your Score",
        correctAnswers: "Correct Answers",
        totalQuestions: "Total Questions",
        retakeQuiz: "Retake Quiz"
      }
    }
  },
  es: {
    translation: {
      common: {
        loading: "Cargando...",
        error: "Algo salió mal",
        retry: "Intentar de nuevo",
        save: "Guardar",
        cancel: "Cancelar",
        continue: "Continuar",
        back: "Atrás",
        next: "Siguiente",
        complete: "Completar",
        points: "Puntos",
        level: "Nivel",
        streak: "Racha",
        offline: "Modo sin conexión",
        online: "En línea",
        syncing: "Sincronizando...",
        synced: "Sincronizado"
      },
      navigation: {
        dashboard: "Panel",
        lessons: "Lecciones",
        quizzes: "Cuestionarios",
        badges: "Insignias",
        profile: "Perfil",
        settings: "Configuración",
        logout: "Cerrar sesión"
      },
      student: {
        welcome: "¡Bienvenido de vuelta, {{name}}!",
        dailyQuiz: "Cuestionario diario",
        contineLearning: "Continuar aprendiendo",
        achievements: "Logros",
        progress: "Tu progreso",
        totalPoints: "Puntos totales",
        currentStreak: "Racha actual",
        lessonsCompleted: "Lecciones completadas",
        quizzesCompleted: "Cuestionarios completados"
      }
    }
  },
  hi: {
    translation: {
      common: {
        loading: "लोड हो रहा है...",
        error: "कुछ गलत हुआ",
        retry: "फिर से कोशिश करें",
        save: "सेव करें",
        cancel: "रद्द करें",
        continue: "जारी रखें",
        back: "वापस",
        next: "अगला",
        complete: "पूर्ण",
        points: "अंक",
        level: "स्तर",
        streak: "लगातार",
        offline: "ऑफलाइन मोड",
        online: "ऑनलाइन",
        syncing: "सिंक हो रहा है...",
        synced: "सिंक हो गया"
      },
      navigation: {
        dashboard: "डैशबोर्ड",
        lessons: "पाठ",
        quizzes: "प्रश्नोत्तरी",
        badges: "बैज",
        profile: "प्रोफ़ाइल",
        settings: "सेटिंग्स",
        logout: "लॉगआउट"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;