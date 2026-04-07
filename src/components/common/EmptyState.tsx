import { useNavigate } from 'react-router-dom'

interface Props {
  title?: string
  description?: string
  action?: { label: string; to: string }
}

export default function EmptyState({
  title = 'データがありません',
  description = 'CSVまたはExcelファイルをインポートして薬剤データを追加してください。',
  action = { label: 'データをインポート', to: '/import' },
}: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>
      {action && (
        <button onClick={() => navigate(action.to)} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}
