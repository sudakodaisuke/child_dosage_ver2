import type { Drug, DrugProgress, SessionRecord, AppSettings, StreakData, DrugTip } from '../types'

const PREFIX = 'pdda_'

const DEFAULT_SETTINGS: AppSettings = {
  testMode: 'multiple-choice',
  questionsPerSession: 20,
  timerEnabled: false,
  timerSeconds: 30,
  showContraindications: true,
  flashcardOrder: 'shuffled',
  showGenericName: true,
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  studyDates: [],
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage quota exceeded or private mode — silently ignore
  }
}

// Drugs
export const getDrugs = (): Drug[] => get<Drug[]>('drugs', [])
export const setDrugs = (drugs: Drug[]): void => set('drugs', drugs)

// Progress
export const getProgress = (): Record<string, DrugProgress> =>
  get<Record<string, DrugProgress>>('progress', {})
export const setProgress = (progress: Record<string, DrugProgress>): void =>
  set('progress', progress)

export const updateDrugProgress = (p: DrugProgress): void => {
  const all = getProgress()
  all[p.drugId] = p
  setProgress(all)
}

// Sessions (capped at 200)
export const getSessions = (): SessionRecord[] => get<SessionRecord[]>('sessions', [])
export const addSession = (session: SessionRecord): void => {
  const sessions = getSessions()
  sessions.unshift(session)
  if (sessions.length > 200) sessions.splice(200)
  set('sessions', sessions)
}

// Retry queue
export const getRetryQueue = (): string[] => get<string[]>('retry_queue', [])
export const setRetryQueue = (ids: string[]): void => set('retry_queue', ids)
export const clearRetryQueue = (): void => set('retry_queue', [])

// Settings – merge with defaults so new keys always exist
export const getSettings = (): AppSettings => {
  const saved = get<Partial<AppSettings>>('settings', {})
  return { ...DEFAULT_SETTINGS, ...saved }
}
export const setSettings = (s: AppSettings): void => set('settings', s)

// Streak
export const getStreak = (): StreakData => get<StreakData>('streak', DEFAULT_STREAK)
export const setStreak = (s: StreakData): void => set('streak', s)

// Favorites
export const getFavorites = (): string[] => get<string[]>('favorites', [])
export const setFavorites = (ids: string[]): void => set('favorites', ids)

// Tips (local UGC – per-device)
export const getTips = (): Record<string, DrugTip[]> =>
  get<Record<string, DrugTip[]>>('tips', {})
export const setTips = (tips: Record<string, DrugTip[]>): void => set('tips', tips)

// Reset all progress (keep drug data)
export const resetProgress = (): void => {
  set('progress', {})
  set('sessions', [])
  set('retry_queue', [])
  set('streak', DEFAULT_STREAK)
}

// Full data export
export const exportAllData = () => ({
  drugs: getDrugs(),
  progress: getProgress(),
  sessions: getSessions(),
  settings: getSettings(),
  streak: getStreak(),
  favorites: getFavorites(),
  tips: getTips(),
  exportedAt: Date.now(),
})

// Full data import
export const importAllData = (data: ReturnType<typeof exportAllData>): void => {
  if (data.drugs) setDrugs(data.drugs)
  if (data.progress) setProgress(data.progress)
  if (data.sessions) set('sessions', data.sessions)
  if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
  if (data.streak) setStreak(data.streak)
  if ((data as Record<string, unknown>).favorites) setFavorites((data as Record<string, unknown>).favorites as string[])
  if ((data as Record<string, unknown>).tips) setTips((data as Record<string, unknown>).tips as Record<string, DrugTip[]>)
}
