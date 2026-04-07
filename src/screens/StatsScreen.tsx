import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import TopBar from '../components/layout/TopBar'
import { useAppContext } from '../store/AppContext'
import { getAccuracy } from '../lib/scoring'

export default function StatsScreen() {
  const { state } = useAppContext()
  const navigate = useNavigate()
  const { drugs, progress, sessions, streak } = state

  const totalSessions = sessions.length
  const totalQuestions = sessions.reduce((s, r) => s + r.totalQuestions, 0)
  const totalCorrect = sessions.reduce((s, r) => s + r.correctAnswers, 0)
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null

  // Per-category accuracy
  const categoryStats = useMemo(() => {
    const cats = [...new Set(drugs.map((d) => d.category))].sort()
    return cats.map((cat) => {
      const catDrugs = drugs.filter((d) => d.category === cat)
      const attempts = catDrugs.reduce((s, d) => {
        const p = progress[d.id]
        return s + (p ? p.timesCorrect + p.timesWrong : 0)
      }, 0)
      const correct = catDrugs.reduce((s, d) => {
        const p = progress[d.id]
        return s + (p ? p.timesCorrect : 0)
      }, 0)
      const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : null
      return { cat, acc, attempts, count: catDrugs.length }
    })
  }, [drugs, progress])

  // Weak drugs (accuracy < 50%, at least 3 attempts)
  const weakDrugs = useMemo(
    () =>
      drugs
        .filter((d) => {
          const p = progress[d.id]
          return p && p.timesCorrect + p.timesWrong >= 3 && getAccuracy(p) < 0.5
        })
        .sort((a, b) => {
          const pa = progress[a.id]
          const pb = progress[b.id]
          return getAccuracy(pa) - getAccuracy(pb)
        })
        .slice(0, 10),
    [drugs, progress]
  )

  // Recent sessions (last 7)
  const recentSessions = sessions.slice(0, 7)

  // Study heatmap: last 28 days
  const heatmapDates = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (27 - i))
      const iso = d.toISOString().slice(0, 10)
      return { iso, studied: streak.studyDates.includes(iso) }
    })
  }, [streak.studyDates])

  const chartData = categoryStats
    .filter((c) => c.acc !== null)
    .map((c) => ({ name: c.cat, acc: c.acc ?? 0 }))

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="統計・進捗" />

      <div className="p-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center py-4">
            <p className="text-3xl font-black text-primary-600">
              {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">総合正答率</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-3xl font-black text-gray-900">
              {streak.currentStreak}
              <span className="text-lg ml-1">🔥</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">連続学習日数</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
            <p className="text-xs text-gray-500 mt-1">セッション数</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
            <p className="text-xs text-gray-500 mt-1">総解答数</p>
          </div>
        </div>

        {/* Study heatmap */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">直近28日の学習</h2>
            <span className="text-xs text-gray-400">最長: {streak.longestStreak}日</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {heatmapDates.map(({ iso, studied }) => (
              <div
                key={iso}
                title={iso}
                className={`aspect-square rounded-sm ${
                  studied ? 'bg-primary-500' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <div className="w-3 h-3 rounded-sm bg-gray-100" />
            <span className="text-xs text-gray-400">なし</span>
            <div className="w-3 h-3 rounded-sm bg-primary-500" />
            <span className="text-xs text-gray-400">学習あり</span>
          </div>
        </div>

        {/* Category accuracy chart */}
        {chartData.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">カテゴリ別正答率</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, '正答率']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="acc" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.acc >= 80
                            ? '#22c55e'
                            : entry.acc >= 60
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weak drugs */}
        {weakDrugs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">苦手な薬 TOP{weakDrugs.length}</h2>
            {weakDrugs.map((drug) => {
              const p = progress[drug.id]
              const acc = p ? Math.round(getAccuracy(p) * 100) : 0
              return (
                <div key={drug.id} className="card flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{drug.brandName}</p>
                    <p className="text-xs text-gray-500 truncate">{drug.genericName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {p?.timesCorrect}/{(p?.timesCorrect ?? 0) + (p?.timesWrong ?? 0)}問
                    </span>
                    <span className="text-sm font-bold text-red-600">{acc}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">最近のセッション</h2>
            {recentSessions.map((s) => {
              const date = new Date(s.startedAt).toLocaleDateString('ja-JP', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              const modeLabel: Record<string, string> = {
                test: 'テスト',
                retry: '再テスト',
                flashcard: '暗記',
                study: '学習',
              }
              const scoreColor =
                s.scorePercent >= 80
                  ? 'text-green-600'
                  : s.scorePercent >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
              return (
                <div key={s.id} className="card flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {modeLabel[s.mode] ?? s.mode}
                      </span>
                      {s.category && (
                        <span className="text-xs text-gray-500">{s.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${scoreColor}`}>{s.scorePercent}%</p>
                    <p className="text-xs text-gray-400">
                      {s.correctAnswers}/{s.totalQuestions}問
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalSessions === 0 && drugs.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm">テストを受けると統計が表示されます</p>
            <button onClick={() => navigate('/test')} className="btn-primary mt-4">
              テスト開始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
