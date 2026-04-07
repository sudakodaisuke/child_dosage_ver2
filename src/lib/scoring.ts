import type { Drug, DrugProgress, StreakData } from '../types'
import { getStreak, setStreak } from './storage'

// Leitner box → next review interval in days
const LEITNER_INTERVALS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14,
}

export function getInitialProgress(drugId: string): DrugProgress {
  return {
    drugId,
    timesCorrect: 0,
    timesWrong: 0,
    leitnerBox: 1,
    nextReviewDate: null,
    lastSeenAt: null,
    selfAssessmentHistory: [],
  }
}

// Update after self-assessment in flashcard mode
// score: 2 = "知ってた", 1 = "微妙", 0 = "知らなかった"
export function applySelfAssessment(
  progress: DrugProgress,
  score: 0 | 1 | 2
): DrugProgress {
  const now = Date.now()
  const newHistory = [
    ...progress.selfAssessmentHistory.slice(-49),
    { date: now, score },
  ]

  let newBox = progress.leitnerBox
  if (score === 2) {
    newBox = Math.min(5, progress.leitnerBox + 1)
  } else if (score === 0) {
    newBox = 1
  }

  const intervalDays = LEITNER_INTERVALS[newBox] ?? 0
  const nextReview = intervalDays === 0 ? null : now + intervalDays * 86400000

  const newCorrect = score >= 1 ? progress.timesCorrect + 1 : progress.timesCorrect
  const newWrong = score === 0 ? progress.timesWrong + 1 : progress.timesWrong

  return {
    ...progress,
    timesCorrect: newCorrect,
    timesWrong: newWrong,
    leitnerBox: newBox,
    nextReviewDate: nextReview,
    lastSeenAt: now,
    selfAssessmentHistory: newHistory,
  }
}

// Update after test mode answer
export function applyTestAnswer(
  progress: DrugProgress,
  correct: boolean
): DrugProgress {
  return {
    ...progress,
    timesCorrect: correct ? progress.timesCorrect + 1 : progress.timesCorrect,
    timesWrong: correct ? progress.timesWrong : progress.timesWrong + 1,
    lastSeenAt: Date.now(),
  }
}

export function getAccuracy(p: DrugProgress): number {
  const total = p.timesCorrect + p.timesWrong
  if (total === 0) return 0
  return p.timesCorrect / total
}

// Filter drugs due for review in flashcard mode
export function getDueForReview(drugs: Drug[], progress: Record<string, DrugProgress>): Drug[] {
  const now = Date.now()
  return drugs.filter((d) => {
    const p = progress[d.id]
    if (!p) return true // never seen
    if (p.nextReviewDate === null) return true
    return p.nextReviewDate <= now
  })
}

// Shuffle array in-place (Fisher-Yates)
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Today's ISO date string
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Update streak after completing a session
export function updateStreak(): StreakData {
  const streak = getStreak()
  const today = todayISO()

  if (streak.lastStudyDate === today) {
    return streak // Already counted today
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayISO = yesterday.toISOString().slice(0, 10)

  const newCurrent =
    streak.lastStudyDate === yesterdayISO ? streak.currentStreak + 1 : 1

  const updated: StreakData = {
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastStudyDate: today,
    studyDates: [...new Set([...streak.studyDates, today])],
  }

  setStreak(updated)
  return updated
}

export function calcSessionScore(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}
