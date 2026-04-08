// ============================================================
// Core Data Types
// ============================================================

export interface Drug {
  id: string
  brandName: string
  genericName: string
  category: string
  dosage: string
  dosageDetail?: string
  route?: string
  contraindications?: string
  notes?: string
  ageRestriction?: string
  tags?: string[]
  reference?: string
  isImportant?: boolean
  memo?: string
  importedAt: number
}

export interface DrugProgress {
  drugId: string
  timesCorrect: number
  timesWrong: number
  leitnerBox: number // 1-5
  nextReviewDate: number | null // Unix ms; null = due now
  lastSeenAt: number | null
  selfAssessmentHistory: Array<{ date: number; score: 0 | 1 | 2 }>
}

export interface SessionRecord {
  id: string
  startedAt: number
  completedAt: number
  mode: 'study' | 'flashcard' | 'test' | 'retry'
  category: string | null
  totalQuestions: number
  correctAnswers: number
  scorePercent: number
  wrongDrugIds: string[]
}

export interface AppSettings {
  testMode: 'multiple-choice' | 'free-text'
  questionsPerSession: 10 | 20 | 30 | 'all'
  timerEnabled: boolean
  timerSeconds: number
  showContraindications: boolean
  flashcardOrder: 'sequential' | 'shuffled' | 'wrong-first'
  showGenericName: boolean
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastStudyDate: string // ISO date "YYYY-MM-DD"
  studyDates: string[]
}

// Per-drug local tip (UGC local)
export interface DrugTip {
  id: string
  drugId: string
  text: string
  createdAt: number
  likes: number
}

// ============================================================
// App State
// ============================================================

export interface AppState {
  drugs: Drug[]
  progress: Record<string, DrugProgress>
  sessions: SessionRecord[]
  retryQueue: string[]
  settings: AppSettings
  streak: StreakData
  favorites: string[]
  tips: Record<string, DrugTip[]> // drugId -> tips[]
}

export type AppAction =
  | { type: 'INIT'; payload: Partial<AppState> }
  | { type: 'LOAD_DRUGS'; payload: Drug[] }
  | { type: 'MERGE_DRUGS'; payload: Drug[] }
  | { type: 'UPDATE_PROGRESS'; payload: DrugProgress }
  | { type: 'ADD_SESSION'; payload: SessionRecord }
  | { type: 'SET_RETRY_QUEUE'; payload: string[] }
  | { type: 'CLEAR_RETRY_QUEUE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'UPDATE_STREAK'; payload: StreakData }
  | { type: 'RESET_ALL_PROGRESS' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'ADD_TIP'; payload: DrugTip }
  | { type: 'DELETE_TIP'; payload: { drugId: string; tipId: string } }
  | { type: 'LIKE_TIP'; payload: { drugId: string; tipId: string } }

// ============================================================
// Quiz Types
// ============================================================

export interface QuizQuestion {
  drug: Drug
  choices: string[] // For multiple-choice mode (4 items)
  correctAnswer: string
}

export type SelfAssessmentScore = 0 | 1 | 2

export interface QuizResult {
  drugId: string
  correct: boolean
  score: number // 0 | 0.5 | 1
}
