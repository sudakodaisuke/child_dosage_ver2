import { useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../store/AppContext'
import TopBar from '../components/layout/TopBar'
import type { SessionRecord } from '../types'

export default function ResultsScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useAppContext()

  const session: SessionRecord | undefined = location.state?.session

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="結果" showBack />
        <div className="p-4 text-center py-20 text-gray-500">
          結果データがありません
        </div>
      </div>
    )
  }

  const wrongDrugs = session.wrongDrugIds
    .map((id) => state.drugs.find((d) => d.id === id))
    .filter(Boolean)

  const score = session.scorePercent
  const scoreColor =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg =
    score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
  const emoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪'

  const elapsed = Math.round((session.completedAt - session.startedAt) / 1000)
  const elapsedStr =
    elapsed >= 60
      ? `${Math.floor(elapsed / 60)}分${elapsed % 60}秒`
      : `${elapsed}秒`

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="テスト結果" showBack />

      <div className="p-4 space-y-4">
        {/* Score card */}
        <div className={`card border-2 ${scoreBg} text-center py-8`}>
          <div className="text-5xl mb-3">{emoji}</div>
          <div className={`text-6xl font-black ${scoreColor}`}>{score}%</div>
          <p className="text-gray-600 mt-2 font-medium">
            {session.correctAnswers} / {session.totalQuestions} 問正解
          </p>
          <p className="text-xs text-gray-400 mt-1">所要時間: {elapsedStr}</p>
        </div>

        {/* Retry wrong answers */}
        {wrongDrugs.length > 0 && (
          <button
            onClick={() => navigate('/test?mode=retry')}
            className="w-full card flex items-center justify-between hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer py-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">間違えた問題だけ再テスト</p>
                <p className="text-xs text-gray-500">{wrongDrugs.length}件</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Wrong answers list */}
        {wrongDrugs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">間違えた問題 ({wrongDrugs.length}件)</h2>
            {wrongDrugs.map((drug) => (
              drug && (
                <div key={drug.id} className="card border-l-4 border-red-400 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{drug.brandName}</p>
                      <p className="text-xs text-gray-500">{drug.genericName}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                      {drug.category}
                    </span>
                  </div>
                  <div className="bg-primary-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-primary-600 mb-0.5">正解</p>
                    <p className="text-sm font-bold text-primary-900">{drug.dosage}</p>
                  </div>
                  {drug.contraindications && (
                    <p className="text-xs text-red-600">
                      <span className="font-medium">禁忌: </span>{drug.contraindications}
                    </p>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* All correct celebration */}
        {wrongDrugs.length === 0 && (
          <div className="card text-center py-6 bg-green-50 border-green-200">
            <p className="text-3xl mb-2">🏆</p>
            <p className="font-bold text-green-700">全問正解！完璧です！</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() =>
              navigate(
                session.category ? `/test/${encodeURIComponent(session.category)}` : '/test'
              )
            }
            className="w-full btn-secondary"
          >
            もう一度テスト
          </button>
          <button onClick={() => navigate('/')} className="w-full btn-primary">
            ホームへ戻る
          </button>
        </div>
      </div>
    </div>
  )
}
