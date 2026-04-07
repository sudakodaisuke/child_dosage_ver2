import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import { useAppContext } from '../store/AppContext'
import { parseCSV } from '../lib/csvParser'
import { parseExcel } from '../lib/excelParser'
import { setDrugs } from '../lib/storage'
import type { Drug } from '../types'

type ImportMode = 'replace' | 'merge'

export default function ImportScreen() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [parsed, setParsed] = useState<Drug[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [skipped, setSkipped] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [importing, setImporting] = useState(false)

  async function handleFile(file: File) {
    const name = file.name.toLowerCase()
    try {
      if (name.endsWith('.csv')) {
        const text = await file.text()
        const result = parseCSV(text)
        setParsed(result.drugs)
        setErrors(result.errors)
        setSkipped(result.skipped)
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buf = await file.arrayBuffer()
        const result = parseExcel(buf)
        setParsed(result.drugs)
        setErrors(result.errors)
        setSkipped(result.skipped)
      } else {
        setErrors(['サポートされていないファイル形式です（.csv, .xlsx, .xls のみ）'])
      }
    } catch (e) {
      setErrors([`ファイルの読み込みに失敗しました: ${String(e)}`])
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function doImport() {
    if (!parsed) return
    setImporting(true)

    if (importMode === 'replace') {
      setDrugs(parsed)
      dispatch({ type: 'LOAD_DRUGS', payload: parsed })
    } else {
      dispatch({ type: 'MERGE_DRUGS', payload: parsed })
    }

    setImporting(false)
    navigate('/')
  }

  function downloadSampleCSV() {
    const sample = `商品名,一般名,疾患カテゴリ,用量,投与経路,禁忌,注意事項,年齢制限,タグ,参考文献
タミフル,オセルタミビル,感染症,2mg/kg/回 1日2回 5日間,経口,インフルエンザ脳炎禁,異常行動に注意,1歳以上,インフルエンザ,
アモキシシリン,アモキシシリン水和物,感染症,20-40mg/kg/日 3分割,経口,ペニシリンアレルギー禁,,,感染症,
アスベリン,チペピジンヒベンズ酸塩,呼吸器,1mg/kg/回 1日3回,経口,,,,呼吸器,
`
    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_drugs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="データインポート" />

      <div className="p-4 space-y-4">
        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-gray-700">
            ファイルをドロップ、またはタップして選択
          </p>
          <p className="text-xs text-gray-500 mt-1">.csv / .xlsx / .xls</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Sample download */}
        <button
          onClick={downloadSampleCSV}
          className="w-full btn-secondary text-sm"
        >
          サンプルCSVをダウンロード
        </button>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-red-700">警告</p>
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-red-600">{e}</p>
            ))}
          </div>
        )}

        {/* Parse result preview */}
        {parsed && (
          <div className="space-y-4">
            <div className="card">
              <p className="text-sm font-semibold text-gray-700 mb-1">読み込み結果</p>
              <p className="text-2xl font-bold text-primary-600">{parsed.length} 件</p>
              {skipped > 0 && (
                <p className="text-xs text-gray-500 mt-1">スキップ: {skipped}件（商品名・一般名が空の行）</p>
              )}
            </div>

            {/* Preview table */}
            <div className="card overflow-x-auto">
              <p className="text-sm font-semibold text-gray-700 mb-3">プレビュー（先頭5件）</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">商品名</th>
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">一般名</th>
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">疾患</th>
                    <th className="text-left py-1 font-medium text-gray-500">用量</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 5).map((d) => (
                    <tr key={d.id} className="border-b border-gray-100">
                      <td className="py-1.5 pr-3 font-medium">{d.brandName}</td>
                      <td className="py-1.5 pr-3 text-gray-600">{d.genericName}</td>
                      <td className="py-1.5 pr-3 text-gray-600">{d.category}</td>
                      <td className="py-1.5 text-gray-600">{d.dosage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import mode */}
            {state.drugs.length > 0 && (
              <div className="card">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  既存データ（{state.drugs.length}件）との統合方法
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-primary-500"
                    />
                    <div>
                      <p className="text-sm font-medium">追加（重複IDは無視）</p>
                      <p className="text-xs text-gray-500">既存データを保持して新規データを追加</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-primary-500"
                    />
                    <div>
                      <p className="text-sm font-medium">置き換え</p>
                      <p className="text-xs text-red-500">既存データをすべて削除して置き換え</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={doImport}
              disabled={importing}
              className="w-full btn-primary"
            >
              {importing ? 'インポート中...' : `${parsed.length}件をインポート`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
