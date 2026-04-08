import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase 設定
 * ------------------------------------------
 * 1. https://console.firebase.google.com で新しいプロジェクトを作成
 * 2. プロジェクト設定 > 「ウェブアプリ」を追加
 * 3. 下記の各値をコピー＆ペーストしてください
 * 4. Firestore Database を有効化（テストモードで開始 → 後でルールを設定）
 * ------------------------------------------
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

/** デバイスを一意に識別する匿名ID（localStorage に保存） */
export function getDeviceId(): string {
  const KEY = 'pdda_device_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
