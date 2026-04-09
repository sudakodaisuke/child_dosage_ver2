import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { AppState, AppAction, DrugTip } from '../types'
import {
  getDrugs,
  getProgress,
  getSessions,
  getRetryQueue,
  getSettings,
  getStreak,
  getFavorites,
  getTips,
  setDrugs,
  setProgress,
  updateDrugProgress,
  addSession,
  setRetryQueue,
  clearRetryQueue,
  setSettings,
  setFavorites,
  setTips,
  resetProgress,
} from '../lib/storage'
import { parseCSV } from '../lib/csvParser'
import { BUILTIN_DRUGS } from '../data/drugs'

const defaultSettings = getSettings()
const defaultStreak = getStreak()

const initialState: AppState = {
  drugs: [],
  progress: {},
  sessions: [],
  retryQueue: [],
  settings: defaultSettings,
  streak: defaultStreak,
  favorites: [],
  tips: {},
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
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

    case 'TOGGLE_FAVORITE': {
      const id = action.payload
      const favs = state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id]
      setFavorites(favs)
      return { ...state, favorites: favs }
    }

    case 'ADD_TIP': {
      const tip: DrugTip = action.payload
      const drugTips = [...(state.tips[tip.drugId] ?? []), tip]
      const updated = { ...state.tips, [tip.drugId]: drugTips }
      setTips(updated)
      return { ...state, tips: updated }
    }

    case 'DELETE_TIP': {
      const { drugId, tipId } = action.payload
      const drugTips = (state.tips[drugId] ?? []).filter((t) => t.id !== tipId)
      const updated = { ...state.tips, [drugId]: drugTips }
      setTips(updated)
      return { ...state, tips: updated }
    }

    case 'LIKE_TIP': {
      const { drugId, tipId } = action.payload
      const drugTips = (state.tips[drugId] ?? []).map((t) =>
        t.id === tipId ? { ...t, likes: t.likes + 1 } : t
      )
      const updated = { ...state.tips, [drugId]: drugTips }
      setTips(updated)
      return { ...state, tips: updated }
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

  useEffect(() => {
    async function loadData() {
      let drugs = getDrugs()

      // First launch: try to fetch public/data.csv, fall back to BUILTIN_DRUGS
      if (drugs.length === 0) {
        try {
          const res = await fetch(import.meta.env.BASE_URL + 'data.csv')
          if (res.ok) {
            const text = await res.text()
            const parsed = parseCSV(text)
            if (parsed.drugs.length > 0) {
              drugs = parsed.drugs
            }
          }
        } catch { /* network error – fall through */ }

        if (drugs.length === 0) {
          drugs = BUILTIN_DRUGS
        }
        setDrugs(drugs)
      }

      dispatch({
        type: 'INIT',
        payload: {
          drugs,
          progress: getProgress(),
          sessions: getSessions(),
          retryQueue: getRetryQueue(),
          streak: getStreak(),
          settings: getSettings(),
          favorites: getFavorites(),
          tips: getTips(),
        },
      })
    }

    loadData()
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
