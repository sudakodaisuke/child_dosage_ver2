import type { Drug, QuizQuestion, AppSettings } from '../types'
import { shuffle } from './scoring'

// Build a list of quiz questions from a pool of drugs
export function buildQuestions(
  drugs: Drug[],
  allDrugs: Drug[],
  settings: AppSettings
): QuizQuestion[] {
  let pool = [...drugs]

  // Limit questions per session
  if (settings.questionsPerSession !== 'all') {
    pool = shuffle(pool).slice(0, settings.questionsPerSession)
  } else {
    pool = shuffle(pool)
  }

  return pool.map((drug) => createQuestion(drug, allDrugs))
}

function createQuestion(drug: Drug, allDrugs: Drug[]): QuizQuestion {
  const correctAnswer = drug.dosage

  // Build distractors from same category first, then random
  const sameCat = allDrugs.filter(
    (d) => d.id !== drug.id && d.category === drug.category && d.dosage !== correctAnswer
  )
  const otherCat = allDrugs.filter(
    (d) => d.id !== drug.id && d.category !== drug.category && d.dosage !== correctAnswer
  )

  const candidatePool = shuffle([...sameCat, ...otherCat])
  const distractors = candidatePool
    .slice(0, 3)
    .map((d) => d.dosage)

  // Pad if not enough distractors (rare edge case)
  while (distractors.length < 3) {
    distractors.push('該当なし')
  }

  const choices = shuffle([correctAnswer, ...distractors])

  return { drug, choices, correctAnswer }
}

// Normalize answer for free-text comparison
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    // Normalize full-width to half-width
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    // Normalize spaces
    .replace(/\s+/g, ' ')
    // Normalize mg/kg variations
    .replace(/mg\s*\/\s*kg/gi, 'mg/kg')
    .replace(/μg/gi, 'mcg')
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

// Check if free-text answer is acceptable
export function isFreeTextCorrect(userAnswer: string, correctAnswer: string): boolean {
  const norm1 = normalizeAnswer(userAnswer)
  const norm2 = normalizeAnswer(correctAnswer)

  if (norm1 === norm2) return true

  // Extract key numeric tokens (e.g. "2mg/kg" "1日2回")
  const nums1 = extractKeyTokens(norm1)
  const nums2 = extractKeyTokens(norm2)
  if (nums1.length > 0 && nums1.length === nums2.length) {
    return nums1.every((t, i) => t === nums2[i])
  }

  // Fallback: Levenshtein threshold
  const threshold = Math.max(2, Math.floor(norm2.length * 0.15))
  return levenshtein(norm1, norm2) <= threshold
}

function extractKeyTokens(s: string): string[] {
  return s.match(/[\d.]+\s*(?:mg|mcg|μg|g|ml|l|iu|単位)?(?:\/(?:kg|回|日|dose))?/gi) ?? []
}
