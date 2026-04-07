import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { AppState, AppAction } from '../types'
import {
  getDrugs,
  getProgress,
  getSessions,
  getRetryQueue,
  getSettings,
  getStreak,
  setDrugs,
  setProgress,
  updateDrugProgress,
  addSession,
  setRetryQueue,
  clearRetryQueue,
  setSettings,
  resetProgress,
} from '../lib/storage'

const defaultSettings = getSettings()
const defaultStreak = getStreak()

const initialState: AppState = {
  drugs: [],
  progress: {},
  sessions: [],
  retryQueue: [],
  settings: defaultSettings,
  streak: defaultStreak,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      // Bulk-load from storage on mount — no side-effect writes
      return { ...state, ...action.payload }

    case 'LOAD_DRUGS':
      return { ...state, drugs: action.payload }

    case 'MERGE_DRUGS': {
      const existingIds = new Set(state.drugs.map((d) => d.id))
      const newDrugs = action.payload.filter((d) => !existingIds.has(d.id))
      const merged = [...state.drugs, ...newDrugs]
      setDrugs(merged)
      return { ...state, drugs: merged }
    }

    case 'UPDATE_PROGRESS': {
      const updated = { ...state.progress, [action.payload.drugId]: action.payload }
      updateDrugProgress(action.payload)
      return { ...state, progress: updated }
    }

    case 'ADD_SESSION': {
      addSession(action.payload)
      return { ...state, sessions: [action.payload, ...state.sessions].slice(0, 200) }
    }

    case 'SET_RETRY_QUEUE': {
      setRetryQueue(action.payload)
      return { ...state, retryQueue: action.payload }
    }

    case 'CLEAR_RETRY_QUEUE': {
      clearRetryQueue()
      return { ...state, retryQueue: [] }
    }

    case 'UPDATE_SETTINGS': {
      const updated = { ...state.settings, ...action.payload }
      setSettings(updated)
      return { ...state, settings: updated }
    }

    case 'UPDATE_STREAK':
      return { ...state, streak: action.payload }

    case 'RESET_ALL_PROGRESS': {
      resetProgress()
      return { ...state, progress: {}, sessions: [], retryQueue: [] }
    }

    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load persisted data on mount (single dispatch — no re-writes to storage)
  useEffect(() => {
    dispatch({
      type: 'INIT',
      payload: {
        drugs: getDrugs(),
        progress: getProgress(),
        sessions: getSessions(),
        retryQueue: getRetryQueue(),
        streak: getStreak(),
        settings: getSettings(),
      },
    })
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
