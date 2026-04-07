import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import { useAppContext } from '../store/AppContext'
import type { Drug } from '../types'

function DrugCard({ drug }: { drug: Drug }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{drug.brandName}</p>
          <p className="text-sm text-gray-600">{drug.genericName}</p>
        </div>
        <Badge label={drug.category} className="flex-shrink-0 mt-0.5" />
      </div>

      <div className="bg-primary-50 rounded-xl p-3">
        <p className="text-xs font-medium text-primary-700 mb-1">用量</p>
        <p className="text-sm font-semibold text-primary-900">{drug.dosage}</p>
        {drug.dosageDetail && (
          <p className="text-xs text-primary-700 mt-1">{drug.dosageDetail}</p>
        )}
      </div>

      {drug.route && (
        <p className="text-xs text-gray-500">投与経路: <span className="font-medium text-gray-700">{drug.route}</span></p>
      )}

      {(drug.contraindications || drug.notes || drug.ageRestriction || drug.reference) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary-600 font-medium flex items-center gap-1"
        >
          {expanded ? '▲ 詳細を閉じる' : '▼ 詳細を見る'}
        </button>
      )}

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-gray-100">
          {drug.ageRestriction && (
            <div>
              <p className="text-xs font-medium text-gray-500">年齢制限</p>
              <p className="text-xs text-gray-700">{drug.ageRestriction}</p>
            </div>
          )}
          {drug.contraindications && (
            <div>
              <p className="text-xs font-medium text-red-500">禁忌</p>
              <p className="text-xs text-gray-700">{drug.contraindications}</p>
            </div>
          )}
          {drug.notes && (
            <div>
              <p className="text-xs font-medium text-orange-500">注意事項</p>
              <p className="text-xs text-gray-700">{drug.notes}</p>
            </div>
          )}
          {drug.reference && (
            <div>
              <p className="text-xs font-medium text-gray-500">参考文献</p>
              <p className="text-xs text-gray-500">{drug.reference}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudyModeScreen() {
  const { category } = useParams<{ category?: string }>()
  const navigate = useNavigate()
  const { state } = useAppContext()
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState(category ? decodeURIComponent(category) : 'すべて')

  const categories = useMemo(
    () => ['すべて', ...[...new Set(state.drugs.map((d) => d.category))].sort()],
    [state.drugs]
  )

  const filtered = useMemo(() => {
    let drugs = state.drugs
    if (selectedCat !== 'すべて') drugs = drugs.filter((d) => d.category === selectedCat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      drugs = drugs.filter(
        (d) =>
          d.brandName.toLowerCase().includes(q) ||
          d.genericName.toLowerCase().includes(q) ||
          d.dosage.toLowerCase().includes(q)
      )
    }
    return drugs
  }, [state.drugs, selectedCat, search])

  if (state.drugs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="学習モード" />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar
        title="学習モード"
        actions={
          <span className="text-xs text-gray-500 font-medium">{filtered.length}件</span>
        }
      />

      <div className="sticky top-14 bg-white border-b border-gray-100 z-30 px-4 py-2 space-y-2">
        {/* Search */}
        <input
          type="search"
          placeholder="薬品名・用量で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedCat === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            検索結果がありません
          </div>
        ) : (
          <>
            {filtered.map((drug) => (
              <DrugCard key={drug.id} drug={drug} />
            ))}

            {/* Test this category button */}
            <button
              onClick={() =>
                navigate(
                  selectedCat === 'すべて'
                    ? '/test'
                    : `/test/${encodeURIComponent(selectedCat)}`
                )
              }
              className="w-full btn-primary mt-2"
            >
              {selectedCat === 'すべて' ? '全問テスト開始' : `「${selectedCat}」をテスト`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
