import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

/**
 * Firebase 設定
 * src/lib/firebase.ts の YOUR_* 部分をあなたのプロジェクト情報に書き換えてください。
 *
 * !! 投稿機能を使うには !!
 * Firebase Console → Authentication → Sign-in method → 「匿名」を有効にしてください。
 */
const firebaseConfig = {
  apiKey: 'AIzaSyCZQ2cqzBUugQMKvM5EaxqdmCHP6OQOp5g',
  authDomain: 'peddose-cloude.firebaseapp.com',
  projectId: 'peddose-cloude',
  storageBucket: 'peddose-cloude.firebasestorage.app',
  messagingSenderId: '653684934514',
  appId: '1:653684934514:web:a938fd31ead7368d3cffeb',
}
export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' && !!firebaseConfig.projectId

let db: ReturnType<typeof getFirestore> | null = null

if (isFirebaseConfigured) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  db = getFirestore(app)
}

export { db }

// ── Anonymous Auth ─────────────────────────────────────────
// 1つの Promise を使い回すことで多重サインインを防ぐ
let _authPromise: Promise<string | null> | null = null

/**
 * 匿名で Firebase にサインインし、UID を返す。
 * 未設定の場合は null を返す（localStorage の device ID にフォールバック）。
 */
export function ensureAuth(): Promise<string | null> {
  if (!isFirebaseConfigured) return Promise.resolve(null)

  if (!_authPromise) {
    _authPromise = (async () => {
      try {
        const auth = getAuth()
        if (auth.currentUser) return auth.currentUser.uid
        const { user } = await signInAnonymously(auth)
        return user.uid
      } catch {
        return null
      }
    })()
  }
  return _authPromise
}

/** デバイス識別用 ID（Firebase 未設定時のフォールバック） */
export function getDeviceId(): string {
  const KEY = 'pdda_device_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
