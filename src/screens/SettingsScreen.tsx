import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Modal from '../components/common/Modal'
import { useAppContext } from '../store/AppContext'
import { exportAllData, importAllData } from '../lib/storage'
import type { AppSettings } from '../types'

export default function SettingsScreen() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()
  const { settings, drugs, progress } = state

  const [showResetModal, setShowResetModal] = useState(false)
  const [showDataResetModal, setShowDataResetModal] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  function update(patch: Partial<AppSettings>) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: patch })
  }

  // ---- バックアップ出力 ----
  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pediatric_dosage_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---- バックアップ読み込み ----
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        importAllData(data)
        setImportMsg('バックアップの読み込みが完了しました。ページを再読み込みしてください。')
        // Reload state
        if (data.drugs) dispatch({ type: 'LOAD_DRUGS', payload: data.drugs })
        if (data.settings) dispatch({ type: 'UPDATE_SETTINGS', payload: data.settings })
        if (data.streak) dispatch({ type: 'UPDATE_STREAK', payload: data.streak })
      } catch {
        setImportMsg('ファイルの読み込みに失敗しました。正しいバックアップファイルを選択してください。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ---- Print ----
  function handlePrint() {
    window.print()
  }

  // ---- CSV で全薬剤をエクスポート ----
  function handleExportCSV() {
    const header = '商品名,一般名,疾患カテゴリ,用量,投与経路,禁忌,注意事項,年齢制限,参考文献\n'
    const rows = drugs
      .map((d) =>
        [
          d.brandName, d.genericName, d.category, d.dosage,
          d.route ?? '', d.contraindications ?? '', d.notes ?? '',
          d.ageRestriction ?? '', d.reference ?? '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'drugs_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const progressCount = Object.values(progress).filter(
    (p) => p.timesCorrect + p.timesWrong > 0
  ).length

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="設定" />

      <div className="p-4 space-y-5">

        {/* ===== テストモード ===== */}
        <section className="card space-y-3">
          <h2 className="text-sm font-bold text-gray-700">テストモード</h2>

          <div className="space-y-2">
            {(
              [
                { value: 'multiple-choice', label: '4択', desc: '選択肢から正解を選ぶ' },
                { value: 'free-text', label: '記述式', desc: '用量を自分で入力する' },
              ] as const
            ).map(({ value, label, desc }) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="testMode"
                  value={value}
                  checked={settings.testMode === value}
                  onChange={() => update({ testMode: value })}
                  className="accent-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* ===== 問題数 ===== */}
        <section className="card space-y-3">
          <h2 className="text-sm font-bold text-gray-700">1セッションの問題数</h2>
          <div className="grid grid-cols-4 gap-2">
            {([10, 20, 30, 'all'] as const).map((n) => (
              <button
                key={n}
                onClick={() => update({ questionsPerSession: n })}
                className={`py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  settings.questionsPerSession === n
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                }`}
              >
                {n === 'all' ? '全問' : `${n}問`}
              </button>
            ))}
          </div>
        </section>

        {/* ===== タイマー ===== */}
        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-700">タイマー</h2>
              <p className="text-xs text-gray-500">制限時間を設けてテストする</p>
            </div>
            <button
              onClick={() => update({ timerEnabled: !settings.timerEnabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.timerEnabled ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.timerEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.timerEnabled && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">制限時間: {settings.timerSeconds}秒</p>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={settings.timerSeconds}
                onChange={(e) => update({ timerSeconds: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>10秒</span>
                <span>120秒</span>
              </div>
            </div>
          )}
        </section>

        {/* ===== 表示設定 ===== */}
        <section className="card space-y-3">
          <h2 className="text-sm font-bold text-gray-700">表示設定</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">一般名を表示</p>
              <p className="text-xs text-gray-500">商品名の下に一般名を表示する</p>
            </div>
            <button
              onClick={() => update({ showGenericName: !settings.showGenericName })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.showGenericName ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.showGenericName ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">裏面に禁忌を表示</p>
              <p className="text-xs text-gray-500">暗記カードの裏面に禁忌情報を表示する</p>
            </div>
            <button
              onClick={() => update({ showContraindications: !settings.showContraindications })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.showContraindications ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings.showContraindications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ===== フィードバック ===== */}
        <section className="card space-y-3">
          <h2 className="text-sm font-bold text-gray-700">フィードバック</h2>
          <p className="text-xs text-gray-500">バグ報告・機能要望はこちらからどうぞ</p>
          <a
            href="https://forms.gle/YOUR_FORM_ID"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            ご要望・バグ報告を送る
          </a>
          <button
            onClick={() => navigate('/stats')}
            className="w-full btn-secondary text-sm"
          >
            学習統計を見る
          </button>
        </section>

        {/* ===== データ管理 ===== */}
        <section className="card space-y-3">
          <h2 className="text-sm font-bold text-gray-700">データ管理</h2>
          <p className="text-xs text-gray-500">
            薬剤データ: {drugs.length}件 ／ 学習済み: {progressCount}件
          </p>

          <div className="space-y-2">
            <button onClick={handleExport} className="w-full btn-secondary text-sm">
              バックアップをダウンロード (.json)
            </button>

            <label className="w-full btn-secondary text-sm flex items-center justify-center cursor-pointer">
              バックアップから復元
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            {drugs.length > 0 && (
              <button onClick={handleExportCSV} className="w-full btn-secondary text-sm">
                薬剤データをCSV出力
              </button>
            )}

            <button onClick={handlePrint} className="w-full btn-secondary text-sm">
              印刷用シートを表示
            </button>

            <button onClick={() => navigate('/import')} className="w-full btn-secondary text-sm">
              薬剤データをインポート
            </button>
          </div>

          {importMsg && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700">{importMsg}</p>
            </div>
          )}
        </section>

        {/* ===== 危険ゾーン ===== */}
        <section className="card space-y-3 border-red-100">
          <h2 className="text-sm font-bold text-red-600">データのリセット</h2>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-3 px-4 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            学習進捗のみリセット
          </button>

          <button
            onClick={() => setShowDataResetModal(true)}
            className="w-full py-3 px-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-300 rounded-xl hover:bg-red-100 transition-colors"
          >
            すべてのデータを削除
          </button>
        </section>
      </div>

      {/* 印刷用テーブル（画面非表示、印刷時のみ表示） */}
      <div className="hidden print:block p-4">
        <h1 className="text-xl font-bold mb-4">小児薬剤用量一覧</h1>
        <table className="print-table w-full text-sm">
          <thead>
            <tr>
              <th>商品名</th>
              <th>一般名</th>
              <th>疾患カテゴリ</th>
              <th>用量</th>
              <th>投与経路</th>
              <th>禁忌</th>
              <th>注意事項</th>
            </tr>
          </thead>
          <tbody>
            {drugs.map((d) => (
              <tr key={d.id}>
                <td>{d.brandName}</td>
                <td>{d.genericName}</td>
                <td>{d.category}</td>
                <td>{d.dosage}</td>
                <td>{d.route ?? ''}</td>
                <td>{d.contraindications ?? ''}</td>
                <td>{d.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset progress modal */}
      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="学習進捗のリセット"
      >
        <p className="text-sm text-gray-600 mb-6">
          正答率・ライトナーボックス・セッション履歴がすべてリセットされます。
          薬剤データは残ります。この操作は取り消せません。
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              dispatch({ type: 'RESET_ALL_PROGRESS' })
              setShowResetModal(false)
            }}
            className="w-full btn-danger"
          >
            リセットする
          </button>
          <button onClick={() => setShowResetModal(false)} className="w-full btn-secondary">
            キャンセル
          </button>
        </div>
      </Modal>

      {/* Reset all data modal */}
      <Modal
        open={showDataResetModal}
        onClose={() => setShowDataResetModal(false)}
        title="全データ削除"
      >
        <p className="text-sm text-gray-600 mb-6">
          薬剤データ・学習進捗・すべての設定が削除されます。
          バックアップを取ってから実行することを強く推奨します。
          この操作は取り消せません。
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              ;['pdda_drugs','pdda_progress','pdda_sessions','pdda_retry_queue',
                'pdda_settings','pdda_streak','pdda_favorites','pdda_tips'].forEach((k) => localStorage.removeItem(k))
              window.location.href = '#/'
              window.location.reload()
            }}
            className="w-full btn-danger"
          >
            すべて削除する
          </button>
          <button onClick={() => setShowDataResetModal(false)} className="w-full btn-secondary">
            キャンセル
          </button>
        </div>
      </Modal>
    </div>
  )
}
