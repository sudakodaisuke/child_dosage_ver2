import { useState, useMemo } from 'react'
import TopBar from '../components/layout/TopBar'
import { useAppContext } from '../store/AppContext'
import type { Drug } from '../types'

function FavoriteButton({ drugId }: { drugId: string }) {
  const { state, dispatch } = useAppContext()
  const isFav = state.favorites.includes(drugId)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        dispatch({ type: 'TOGGLE_FAVORITE', payload: drugId })
      }}
      className={`text-xl leading-none transition-colors ${isFav ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400'}`}
      aria-label={isFav ? 'お気に入り解除' : 'お気に入り登録'}
    >
      {isFav ? '♥' : '♡'}
    </button>
  )
}

function TipsSection({ drug }: { drug: Drug }) {
  const { state, dispatch } = useAppContext()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const tips = (state.tips[drug.id] ?? []).slice().sort((a, b) => b.likes - a.likes)

  function addTip() {
    const text = input.trim()
    if (!text) return
    dispatch({
      type: 'ADD_TIP',
      payload: {
        id: crypto.randomUUID(),
        drugId: drug.id,
        text,
        createdAt: Date.now(),
        likes: 0,
      },
    })
    setInput('')
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-primary-600 font-medium flex items-center gap-1"
      >
        <span>{open ? '▲' : '▼'}</span>
        <span>豆知識・ゴロ ({tips.length})</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {tips.map((tip) => (
            <div key={tip.id} className="bg-yellow-50 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
              <p className="text-xs text-gray-700 flex-1">{tip.text}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => dispatch({ type: 'LIKE_TIP', payload: { drugId: drug.id, tipId: tip.id } })}
                  className="text-xs text-gray-500 hover:text-pink-500 flex items-center gap-0.5"
                >
                  👍 {tip.likes}
                </button>
                <button
                  onClick={() => dispatch({ type: 'DELETE_TIP', payload: { drugId: drug.id, tipId: tip.id } })}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTip() }}
              placeholder="覚え方・ゴロを追加..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button
              onClick={addTip}
              disabled={!input.trim()}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg disabled:opacity-40"
            >
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MatrixScreen() {
  const { state } = useAppContext()
  const { drugs, favorites, settings } = state

  const [favOnly, setFavOnly] = useState(false)
  const [search, setSearch] = useState('')

  const categories = useMemo(
    () => [...new Set(drugs.map((d) => d.category))].sort(),
    [drugs]
  )

  const filtered = useMemo(() => {
    let list = drugs
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
  }, [drugs, favOnly, search, favorites])

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
          <span className="text-xs text-gray-500">{filtered.length}件</span>
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
                <div className="sticky top-[104px] z-20 bg-gray-50 border-y border-gray-200 px-4 py-1.5 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{cat}</span>
                  <span className="text-xs text-gray-400">{catDrugs.length}件</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {catDrugs.map((drug) => {
                    return (
                      <div key={drug.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Star + Name */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {drug.isImportant && (
                                <span className="text-yellow-500 text-sm leading-none flex-shrink-0">★</span>
                              )}
                              <span className="font-semibold text-gray-900 text-sm">{drug.brandName}</span>
                            </div>
                            {settings.showGenericName && (
                              <p className="text-xs text-gray-500 mt-0.5">{drug.genericName}</p>
                            )}
                            <div className="mt-1.5 bg-primary-50 rounded-lg px-2.5 py-1.5">
                              <p className="text-xs font-semibold text-primary-900">{drug.dosage}</p>
                            </div>
                            {drug.notes && (
                              <p className="text-xs text-orange-600 mt-1">⚠ {drug.notes}</p>
                            )}
                            {drug.contraindications && (
                              <p className="text-xs text-red-600 mt-0.5">✕ {drug.contraindications}</p>
                            )}
                            {drug.memo && (
                              <p className="text-xs text-gray-500 mt-1 italic">{drug.memo}</p>
                            )}
                            <TipsSection drug={drug} />
                          </div>
                          {/* Favorite toggle */}
                          <div className="flex-shrink-0 mt-0.5">
                            <FavoriteButton drugId={drug.id} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
