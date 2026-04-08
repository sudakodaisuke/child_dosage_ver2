import { useState, useMemo } from 'react'
import TopBar from '../components/layout/TopBar'
import TipsModal from '../components/drug/TipsModal'
import { useAppContext } from '../store/AppContext'
import type { Drug } from '../types'

function DrugRow({ drug }: { drug: Drug }) {
  const { state, dispatch } = useAppContext()
  const isFav = state.favorites.includes(drug.id)
  const [tipsOpen, setTipsOpen] = useState(false)

  return (
    <>
      <div className="flex items-stretch border-b border-gray-100 last:border-0">
        {/* 左: 薬剤名 */}
        <div className="flex-1 min-w-0 px-3 py-2.5">
          <div className="flex items-center gap-1 flex-wrap">
            {drug.isImportant && (
              <span className="text-yellow-500 text-sm leading-none">★</span>
            )}
            <span className="font-semibold text-gray-900 text-sm leading-snug">{drug.brandName}</span>
          </div>
          {state.settings.showGenericName && (
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{drug.genericName}</p>
          )}
        </div>

        {/* 中: 用量 + 注意 */}
        <div className="w-[42%] px-2 py-2.5 border-l border-gray-100">
          <p className="text-xs font-semibold text-gray-800 leading-snug">{drug.dosage}</p>
          {drug.notes && (
            <p className="text-xs text-orange-600 mt-1 leading-tight">⚠ {drug.notes}</p>
          )}
          {drug.contraindications && (
            <p className="text-xs text-red-600 mt-0.5 leading-tight">✕ {drug.contraindications}</p>
          )}
          {drug.memo && (
            <p className="text-xs text-gray-400 mt-0.5 italic leading-tight">{drug.memo}</p>
          )}
        </div>

        {/* 右: アイコン */}
        <div className="flex flex-col items-center justify-center gap-2 px-2 border-l border-gray-100 w-10">
          <button
            onClick={() => setTipsOpen(true)}
            className="text-primary-400 hover:text-primary-600 transition-colors"
            aria-label="豆知識"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: drug.id })}
            className={`text-base leading-none transition-colors ${isFav ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400'}`}
            aria-label={isFav ? 'お気に入り解除' : 'お気に入り登録'}
          >
            {isFav ? '♥' : '♡'}
          </button>
        </div>
      </div>

      <TipsModal
        drugId={drug.id}
        drugName={drug.brandName}
        open={tipsOpen}
        onClose={() => setTipsOpen(false)}
      />
    </>
  )
}

export default function MatrixScreen() {
  const { state } = useAppContext()
  const { drugs, favorites } = state

  const [favOnly, setFavOnly] = useState(false)
  const [search, setSearch] = useState('')

  // CSVのid列（数値）順でソート
  const sortedDrugs = useMemo(() => {
    return [...drugs].sort((a, b) => {
      const na = Number(a.id)
      const nb = Number(b.id)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return 0 // 数値でなければ元の順序を維持
    })
  }, [drugs])

  // カテゴリを初出順（= CSVの順序）で抽出
  const categories = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const d of sortedDrugs) {
      if (!seen.has(d.category)) {
        seen.add(d.category)
        result.push(d.category)
      }
    }
    return result
  }, [sortedDrugs])

  const filtered = useMemo(() => {
    let list = sortedDrugs
    if (favOnly) list = list.filter((d) => favorites.includes(d.id))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (d) =>
          d.brandName.toLowerCase().includes(q) ||
          d.genericName.toLowerCase().includes(q) ||
          d.dosage.toLowerCase().includes(q)
      )
    }
    return list
  }, [sortedDrugs, favOnly, search, favorites])

  const grouped = useMemo(() => {
    const map: Record<string, Drug[]> = {}
    for (const drug of filtered) {
      if (!map[drug.category]) map[drug.category] = []
      map[drug.category].push(drug)
    }
    return map
  }, [filtered])

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="薬剤一覧" />

      {/* Sticky filters */}
      <div className="sticky top-14 bg-white border-b border-gray-100 z-30 px-4 py-2 space-y-2">
        <input
          type="search"
          placeholder="薬品名・用量で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">全 {filtered.length} 品目</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-medium text-gray-600">♡ お気に入りのみ</span>
            <button
              onClick={() => setFavOnly(!favOnly)}
              className={`relative w-10 h-5 rounded-full transition-colors ${favOnly ? 'bg-pink-500' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${favOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </label>
        </div>
      </div>

      <div className="pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {favOnly ? 'お気に入りがありません' : '検索結果がありません'}
          </div>
        ) : (
          categories.map((cat) => {
            const catDrugs = grouped[cat]
            if (!catDrugs || catDrugs.length === 0) return null
            return (
              <div key={cat}>
                {/* Sticky category header */}
                <div className="sticky top-[104px] z-20 bg-gray-800 text-white px-4 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">{cat}</span>
                  <span className="text-xs text-gray-400">{catDrugs.length}</span>
                </div>

                {/* Table header */}
                <div className="flex items-center bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium">
                  <div className="flex-1 px-3 py-1">薬剤名</div>
                  <div className="w-[42%] px-2 py-1 border-l border-gray-200">用量 / 注意</div>
                  <div className="w-10 border-l border-gray-200" />
                </div>

                {catDrugs.map((drug) => (
                  <DrugRow key={drug.id} drug={drug} />
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
