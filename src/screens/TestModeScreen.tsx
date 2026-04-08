import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import EmptyState from '../components/common/EmptyState'
import { useAppContext } from '../store/AppContext'
import { buildQuestions, isFreeTextCorrect } from '../lib/testEngine'
import { applyTestAnswer, getInitialProgress, updateStreak, calcSessionScore } from '../lib/scoring'
import type { QuizQuestion, QuizResult, SessionRecord } from '../types'

export default function TestModeScreen() {
  const { category } = useParams<{ category?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { state, dispatch } = useAppContext()

  const testMode = searchParams.get('mode') // 'retry' | 'important' | 'favorites' | null
  const isRetry = testMode === 'retry'
  const catDecoded = category ? decodeURIComponent(category) : null

  const questions = useMemo<QuizQuestion[]>(() => {
    let pool = state.drugs
    if (isRetry && state.retryQueue.length > 0) {
      const retrySet = new Set(state.retryQueue)
      pool = state.drugs.filter((d) => retrySet.has(d.id))
    } else if (testMode === 'important') {
      pool = state.drugs.filter((d) => d.isImportant)
    } else if (testMode === 'favorites') {
      const favSet = new Set(state.favorites)
      pool = state.drugs.filter((d) => favSet.has(d.id))
    } else if (catDecoded) {
      pool = state.drugs.filter((d) => d.category === catDecoded)
    }
    return buildQuestions(pool, state.drugs, state.settings)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [qIndex, setQIndex] = useState(0)
  const [freeTextInput, setFreeTextInput] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [startTime] = useState(Date.now())
  const [timer, setTimer] = useState(state.settings.timerSeconds)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = questions[qIndex]
  const mode = state.settings.testMode

  // Timer
  useEffect(() => {
    if (!state.settings.timerEnabled || answered) return
    setTimer(state.settings.timerSeconds)

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleAnswer('') // Force wrong answer on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current!)
  }, [qIndex, answered]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state.drugs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="テストモード" showBack />
        <EmptyState />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="テストモード" showBack />
        <div className="p-4 text-center py-20 text-gray-500">
          {isRetry ? '再テストキューが空です' : 'このカテゴリにデータがありません'}
        </div>
      </div>
    )
  }

  function handleAnswer(answer: string) {
    if (answered) return
    clearInterval(timerRef.current!)

    const correct = q.drug.dosage
    const isRight = mode === 'multiple-choice'
      ? answer === correct
      : isFreeTextCorrect(answer, correct)

    setAnswered(true)
    setIsCorrect(isRight)
    if (mode === 'multiple-choice') setSelectedChoice(answer)

    // Update progress
    const existing = state.progress[q.drug.id] ?? getInitialProgress(q.drug.id)
    dispatch({ type: 'UPDATE_PROGRESS', payload: applyTestAnswer(existing, isRight) })

    const result: QuizResult = {
      drugId: q.drug.id,
      correct: isRight,
      score: isRight ? 1 : 0,
    }
    setResults((prev) => [...prev, result])
  }

  function nextQuestion() {
    setAnswered(false)
    setSelectedChoice(null)
    setFreeTextInput('')

    if (qIndex + 1 >= questions.length) {
      // results state may not include the last answer yet (React batching),
      // so compute final totals using isCorrect directly.
      const prevWrong = results.filter((r) => !r.correct).map((r) => r.drugId)
      const wrongIds = isCorrect ? prevWrong : [...prevWrong, q.drug.id]
      const finalCorrect = results.filter((r) => r.correct).length + (isCorrect ? 1 : 0)

      const session: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt: startTime,
        completedAt: Date.now(),
        mode: isRetry ? 'retry' : 'test',
        category: catDecoded,
        totalQuestions: questions.length,
        correctAnswers: finalCorrect,
        scorePercent: calcSessionScore(finalCorrect, questions.length),
        wrongDrugIds: wrongIds,
      }

      dispatch({ type: 'ADD_SESSION', payload: session })
      dispatch({ type: 'SET_RETRY_QUEUE', payload: wrongIds })
      if (isRetry) dispatch({ type: 'CLEAR_RETRY_QUEUE' })

      const newStreak = updateStreak()
      dispatch({ type: 'UPDATE_STREAK', payload: newStreak })

      navigate('/results', { state: { session } })
    } else {
      setQIndex(qIndex + 1)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const timerPercent = (timer / state.settings.timerSeconds) * 100
  const timerColor = timer <= 5 ? 'bg-red-500' : timer <= 10 ? 'bg-yellow-500' : 'bg-primary-500'

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar
        title={
          isRetry ? '要復習テスト' :
          testMode === 'important' ? '★ 重要問題テスト' :
          testMode === 'favorites' ? '♡ お気に入りテスト' :
          catDecoded ? `テスト: ${catDecoded}` : 'テストモード'
        }
        showBack
        actions={
          <span className="text-sm font-medium text-gray-500">
            {qIndex + 1}/{questions.length}
          </span>
        }
      />

      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((qIndex) / questions.length) * 100}%` }}
          />
        </div>

        {/* Timer */}
        {state.settings.timerEnabled && !answered && (
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
            <p className="text-xs text-right text-gray-500">{timer}秒</p>
          </div>
        )}

        {/* Question card */}
        <div className="card space-y-4">
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">用量を答えてください</div>
            <div className="flex items-center justify-center gap-2">
              {q.drug.isImportant && (
                <span className="text-yellow-500 text-lg leading-none">★</span>
              )}
              <p className="text-2xl font-bold text-gray-900">{q.drug.brandName}</p>
            </div>
            {state.settings.showGenericName && (
              <p className="text-base text-gray-500">{q.drug.genericName}</p>
            )}
            {q.drug.route && (
              <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {q.drug.route}
              </span>
            )}
          </div>

          {/* Multiple choice */}
          {mode === 'multiple-choice' && (
            <div className="space-y-2">
              {q.choices.map((choice, i) => {
                let cls = 'w-full text-left p-3 rounded-xl border text-sm transition-colors '
                if (!answered) {
                  cls += 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 active:bg-primary-100'
                } else if (choice === q.correctAnswer) {
                  cls += 'border-green-400 bg-green-50 text-green-800 font-semibold'
                } else if (choice === selectedChoice && choice !== q.correctAnswer) {
                  cls += 'border-red-400 bg-red-50 text-red-800'
                } else {
                  cls += 'border-gray-200 text-gray-400'
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(choice)}
                    disabled={answered}
                    className={cls}
                  >
                    <span className="font-medium text-gray-400 mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                    {choice}
                  </button>
                )
              })}
            </div>
          )}

          {/* Free text */}
          {mode === 'free-text' && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={freeTextInput}
                onChange={(e) => setFreeTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !answered && freeTextInput.trim()) {
                    handleAnswer(freeTextInput.trim())
                  }
                }}
                disabled={answered}
                placeholder="用量を入力してください..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!answered && (
                <button
                  onClick={() => handleAnswer(freeTextInput.trim())}
                  disabled={!freeTextInput.trim()}
                  className="w-full btn-primary disabled:opacity-40"
                >
                  回答する
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback */}
        {answered && (
          <div className={`card border-2 space-y-3 ${isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
              <span className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '正解！' : '不正解'}
              </span>
            </div>
            {!isCorrect && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">正解</p>
                <p className="text-sm font-semibold text-gray-900">{q.drug.dosage}</p>
              </div>
            )}
            {q.drug.contraindications && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1">禁忌</p>
                <p className="text-xs text-gray-700">{q.drug.contraindications}</p>
              </div>
            )}
            {q.drug.notes && (
              <div>
                <p className="text-xs font-medium text-orange-500 mb-1">注意事項</p>
                <p className="text-xs text-gray-700">{q.drug.notes}</p>
              </div>
            )}
            <button onClick={nextQuestion} className="w-full btn-primary">
              {qIndex + 1 >= questions.length ? '結果を見る' : '次の問題'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
