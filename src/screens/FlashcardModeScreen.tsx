import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/common/Badge'
import TipsModal from '../components/drug/TipsModal'
import { useAppContext } from '../store/AppContext'
import { shuffle, applySelfAssessment, getInitialProgress, updateStreak } from '../lib/scoring'
import type { Drug, SelfAssessmentScore } from '../types'

function FlipCard({
  drug,
  showContraindications,
  onAssess,
  current,
  total,
}: {
  drug: Drug
  showContraindications: boolean
  onAssess: (score: SelfAssessmentScore) => void
  current: number
  total: number
}) {
  const [flipped, setFlipped] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)

  const handleFlip = () => setFlipped(!flipped)

  const handleAssess = (score: SelfAssessmentScore) => {
    setFlipped(false)
    // Small delay to allow flip animation to reset before next card
    setTimeout(() => onAssess(score), 50)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm text-gray-500 font-medium">
          {current} / {total}
        </span>
        <div className="flex-1 mx-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
        <Badge label={drug.category} />
      </div>

      {/* Flip card */}
      <div className="flip-card flex-1 min-h-0" onClick={handleFlip}>
        <div className={`flip-card-inner w-full h-full min-h-52 ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front w-full h-full">
            <div className="card h-full flex flex-col items-center justify-center text-center gap-4 cursor-pointer select-none">
              <div className="text-4xl">💊</div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{drug.brandName}</p>
                <p className="text-base text-gray-500">{drug.genericName}</p>
              </div>
              {drug.route && (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {drug.route}
                </span>
              )}
              <p className="text-xs text-primary-500 font-medium mt-2">タップして答えを確認</p>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back w-full h-full">
            <div className="card h-full flex flex-col justify-between cursor-pointer select-none overflow-y-auto">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{drug.brandName}</p>
                  <p className="text-sm text-gray-500">{drug.genericName}</p>
                </div>

                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-primary-600 mb-1">用量</p>
                  <p className="text-xl font-bold text-primary-900">{drug.dosage}</p>
                  {drug.dosageDetail && (
                    <p className="text-xs text-primary-700 mt-1">{drug.dosageDetail}</p>
                  )}
                </div>

                {showContraindications && drug.contraindications && (
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-red-600 mb-1">禁忌</p>
                    <p className="text-xs text-gray-700">{drug.contraindications}</p>
                  </div>
                )}

                {drug.notes && (
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-orange-600 mb-1">注意</p>
                    <p className="text-xs text-gray-700">{drug.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Self-assessment buttons (shown when flipped) */}
      {flipped && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => handleAssess(0)}
            className="flex flex-col items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl py-3 px-2 transition-colors"
          >
            <span className="text-xl">😓</span>
            <span className="text-xs font-medium text-red-700">知らなかった</span>
          </button>
          <button
            onClick={() => handleAssess(1)}
            className="flex flex-col items-center gap-1 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl py-3 px-2 transition-colors"
          >
            <span className="text-xl">🤔</span>
            <span className="text-xs font-medium text-yellow-700">微妙</span>
          </button>
          <button
            onClick={() => handleAssess(2)}
            className="flex flex-col items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl py-3 px-2 transition-colors"
          >
            <span className="text-xl">✅</span>
            <span className="text-xs font-medium text-green-700">知ってた</span>
          </button>
        </div>
      )}

      {flipped && (
        <button
          onClick={() => setTipsOpen(true)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          みんなの豆知識・ゴロを見る
        </button>
      )}

      {!flipped && (
        <button
          onClick={handleFlip}
          className="mt-4 w-full btn-secondary"
        >
          答えを見る
        </button>
      )}

      <TipsModal
        drugId={drug.id}
        drugName={drug.brandName}
        open={tipsOpen}
        onClose={() => setTipsOpen(false)}
      />
    </div>
  )
}

export default function FlashcardModeScreen() {
  const { category } = useParams<{ category?: string }>()
  const navigate = useNavigate()
  const { state, dispatch } = useAppContext()

  const catDecoded = category ? decodeURIComponent(category) : null

  const deck = useMemo(() => {
    let drugs = state.drugs
    if (catDecoded) drugs = drugs.filter((d) => d.category === catDecoded)
    return shuffle(drugs)
  }, [state.drugs, catDecoded])

  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [counts, setCounts] = useState({ knew: 0, unsure: 0, didnt: 0 })

  const handleAssess = useCallback(
    (score: SelfAssessmentScore) => {
      const drug = deck[index]
      const existing = state.progress[drug.id] ?? getInitialProgress(drug.id)
      const updated = applySelfAssessment(existing, score)
      dispatch({ type: 'UPDATE_PROGRESS', payload: updated })

      setCounts((prev) => ({
        knew: prev.knew + (score === 2 ? 1 : 0),
        unsure: prev.unsure + (score === 1 ? 1 : 0),
        didnt: prev.didnt + (score === 0 ? 1 : 0),
      }))

      if (index + 1 >= deck.length) {
        // Session complete
        const newStreak = updateStreak()
        dispatch({ type: 'UPDATE_STREAK', payload: newStreak })
        setDone(true)
      } else {
        setIndex(index + 1)
      }
    },
    [deck, index, state.progress, dispatch]
  )

  if (state.drugs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="暗記モード" showBack />
        <EmptyState />
      </div>
    )
  }

  if (deck.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="暗記モード" showBack />
        <div className="p-4 text-center py-20 text-gray-500">このカテゴリにデータがありません</div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="暗記モード 完了" showBack />
        <div className="p-6 space-y-6">
          <div className="card text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">完了！</h2>
            <p className="text-sm text-gray-500">{deck.length}枚すべて完了しました</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center py-4">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-xl font-bold text-green-600">{counts.knew}</p>
              <p className="text-xs text-gray-500">知ってた</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl mb-1">🤔</p>
              <p className="text-xl font-bold text-yellow-600">{counts.unsure}</p>
              <p className="text-xs text-gray-500">微妙</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl mb-1">😓</p>
              <p className="text-xl font-bold text-red-600">{counts.didnt}</p>
              <p className="text-xs text-gray-500">知らなかった</p>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={() => navigate('/test')} className="w-full btn-primary">
              テストモードへ
            </button>
            <button onClick={() => navigate('/')} className="w-full btn-secondary">
              ホームへ戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto h-dvh flex flex-col">
      <TopBar
        title={catDecoded ? `暗記: ${catDecoded}` : '暗記モード'}
        showBack
      />
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <FlipCard
          key={deck[index].id + index}
          drug={deck[index]}
          showContraindications={state.settings.showContraindications}
          onAssess={handleAssess}
          current={index + 1}
          total={deck.length}
        />
      </div>
    </div>
  )
}
