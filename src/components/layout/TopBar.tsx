import { useNavigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAppContext } from '../../store/AppContext'

interface Props {
  title: string
  showBack?: boolean
  actions?: ReactNode
}

function GenericNameToggle() {
  const { state, dispatch } = useAppContext()
  const on = state.settings.showGenericName
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <span className="text-xs font-medium text-gray-500">一般名</span>
      <button
        onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { showGenericName: !on } })}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-primary-500' : 'bg-gray-300'}`}
        aria-label="一般名の表示切り替え"
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  )
}

export default function TopBar({ title, showBack, actions }: Props) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 no-print">
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
              aria-label="戻る"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <GenericNameToggle />
          {actions && <>{actions}</>}
        </div>
      </div>
    </header>
  )
}
