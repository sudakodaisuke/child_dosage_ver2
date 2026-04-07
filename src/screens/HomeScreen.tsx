import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../store/AppContext'
import { getAccuracy } from '../lib/scoring'
import Badge from '../components/common/Badge'

export default function HomeScreen() {
  const { state } = useAppContext()
  const navigate = useNavigate()
  const { drugs, progress, streak, retryQueue } = state

  const categories = [...new Set(drugs.map((d) => d.category))].sort()

  const weakDrugs = drugs.filter((d) => {
    const p = progress[d.id]
    return p && p.timesCorrect + p.timesWrong >= 3 && getAccuracy(p) < 0.5
  })

  const totalAttempted = Object.values(progress).filter(
    (p) => p.timesCorrect + p.timesWrong > 0
  ).length

  const overallAccuracy =
    totalAttempted === 0
      ? null
      : Math.round(
          (Object.values(progress).reduce((s, p) => s + p.timesCorrect, 0) /
            Object.values(progress).reduce(
              (s, p) => s + p.timesCorrect + p.timesWrong,
              0
            )) *
            100
        )

  if (drugs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <header className="px-4 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">小児用量暗記アプリ</h1>
          <p className="text-sm text-gray-500 mt-1">薬剤用量の暗記をサポートします</p>
        </header>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">まずデータをインポート</h2>
          <p className="text-sm text-gray-500 mb-6">
            CSVまたはExcelファイルに薬剤情報を入力して<br />インポートすると学習を開始できます
          </p>
          <button onClick={() => navigate('/import')} className="btn-primary">
            データをインポートする
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="px-4 pt-6 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">小児用量暗記</h1>
            <p className="text-sm text-gray-500">{drugs.length}件の薬剤</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="設定"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="card text-center py-3">
            <p className="text-2xl">🔥</p>
            <p className="text-xl font-bold text-gray-900">{streak.currentStreak}</p>
            <p className="text-xs text-gray-500">連続日数</p>
          </div>
          {/* Accuracy */}
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-primary-600">
              {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">正答率</p>
          </div>
          {/* Attempted */}
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-gray-900">{totalAttempted}</p>
            <p className="text-xs text-gray-500">学習済み</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/test')}
            className="card flex flex-col items-center gap-2 py-5 hover:border-primary-200 hover:bg-primary-50 active:bg-primary-100 transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-semibold text-gray-800">テスト開始</span>
          </button>
          <button
            onClick={() => navigate('/flashcard')}
            className="card flex flex-col items-center gap-2 py-5 hover:border-primary-200 hover:bg-primary-50 active:bg-primary-100 transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-semibold text-gray-800">暗記モード</span>
          </button>
        </div>

        {/* Retry queue */}
        {retryQueue.length > 0 && (
          <button
            onClick={() => navigate('/test?mode=retry')}
            className="w-full card flex items-center justify-between hover:border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">間違えた問題を再テスト</p>
                <p className="text-xs text-gray-500">{retryQueue.length}件</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Weak drugs */}
        {weakDrugs.length > 0 && (
          <button
            onClick={() => navigate('/study')}
            className="w-full card flex items-center justify-between hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">苦手な薬</p>
                <p className="text-xs text-gray-500">正答率50%未満: {weakDrugs.length}件</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Categories */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">疾患カテゴリ</h2>
          <div className="space-y-2">
            {categories.map((cat) => {
              const count = drugs.filter((d) => d.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => navigate(`/study/${encodeURIComponent(cat)}`)}
                  className="w-full card flex items-center justify-between hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer py-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge label={cat} />
                    <span className="text-sm text-gray-700">{count}件</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => navigate('/import')}
          className="w-full btn-secondary text-sm"
        >
          データを追加・更新
        </button>
      </div>
    </div>
  )
}
