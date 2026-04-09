import { useState, useEffect, useRef } from 'react'
import { isFirebaseConfigured, ensureAuth, getDeviceId } from '../../lib/firebase'
import {
  fetchTips,
  addTip,
  deleteTip,
  toggleLike,
  type FirestoreTip,
} from '../../lib/tipsService'

interface Props {
  drugId: string
  drugName: string
  open: boolean
  onClose: () => void
}

export default function TipsModal({ drugId, drugName, open, onClose }: Props) {
  const [tips, setTips] = useState<FirestoreTip[]>([])
  const [loading, setLoading] = useState(false)
  const [myId, setMyId] = useState<string>('')
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 開いたときにサインイン＋チップス取得
  useEffect(() => {
    if (!open) return

    // Anonymous Auth → 自分のIDを確定
    ensureAuth().then((uid) => setMyId(uid ?? getDeviceId()))

    setLoading(true)
    fetchTips(drugId).then((data) => {
      setTips(data)
      setLoading(false)
    })

    setTimeout(() => inputRef.current?.focus(), 200)
  }, [open, drugId])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSubmit() {
    const text = input.trim()
    if (!text || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const newTip = await addTip(drugId, text)
      if (newTip) {
        setTips((prev) => [newTip, ...prev])
        setInput('')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSubmitError('投稿に失敗しました: ' + msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLike(tip: FirestoreTip) {
    const updated = await toggleLike(tip)
    setTips((prev) => prev.map((t) => (t.id === tip.id ? updated : t)))
  }

  async function handleDelete(tipId: string) {
    await deleteTip(tipId)
    setTips((prev) => prev.filter((t) => t.id !== tipId))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg shadow-xl flex flex-col"
        style={{ maxHeight: '85vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">みんなの豆知識・ゴロ</h2>
            <p className="text-xs text-gray-500 mt-0.5">{drugName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {!isFirebaseConfigured && (
          <div className="mx-4 my-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-800 flex-shrink-0">
            Firebaseが未設定のため共有機能は無効です。<br />
            <code className="font-mono">src/lib/firebase.ts</code> を設定してください。
          </div>
        )}

        {/* Tips list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
          ) : tips.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">💡</p>
              <p className="text-sm">まだ共有された知識はありません。</p>
              <p className="text-xs mt-1">最初の投稿者になりましょう！</p>
            </div>
          ) : (
            tips.map((tip) => {
              const isOwn = tip.authorId === myId
              const hasLiked = tip.likedBy.includes(myId)
              return (
                <div key={tip.id} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <p className="flex-1 text-sm text-gray-800 leading-relaxed">{tip.text}</p>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleLike(tip)}
                      disabled={!isFirebaseConfigured}
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                        hasLiked
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-white text-gray-400 border border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      👍 {tip.likes}
                    </button>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(tip.id)}
                        className="text-xs text-gray-300 hover:text-red-400"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="flex-shrink-0 mx-4 mb-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
            {submitError}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="コメント..."
            disabled={!isFirebaseConfigured}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || submitting || !isFirebaseConfigured}
            className="px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex-shrink-0"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  )
}
