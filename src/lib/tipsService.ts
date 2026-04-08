/**
 * Firestore tips service
 *
 * コレクション: "tips"
 * ドキュメント: {
 *   drugId: string
 *   text: string
 *   createdAt: Timestamp
 *   likes: number
 *   likedBy: string[]   // device IDs（匿名いいね重複防止）
 *   authorId: string    // device ID（削除権限）
 * }
 *
 * Firestore セキュリティルール（推奨）:
 * ----------------------------------------
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /tips/{tipId} {
 *       allow read: if true;
 *       allow create: if request.resource.data.text is string
 *                     && request.resource.data.text.size() > 0
 *                     && request.resource.data.text.size() < 300
 *                     && request.resource.data.drugId is string
 *                     && request.resource.data.authorId is string;
 *       allow update: if request.resource.data.diff(resource.data)
 *                       .affectedKeys().hasOnly(['likes', 'likedBy']);
 *       allow delete: if resource.data.authorId == request.auth.uid
 *                     || true; // 匿名削除を許可する場合は true のまま
 *     }
 *   }
 * }
 * ----------------------------------------
 */

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db, getDeviceId } from './firebase'

export interface FirestoreTip {
  id: string
  drugId: string
  text: string
  createdAt: number
  likes: number
  likedBy: string[]
  authorId: string
}

export async function fetchTips(drugId: string): Promise<FirestoreTip[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'tips'),
      where('drugId', '==', drugId),
      orderBy('likes', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FirestoreTip, 'id'>),
      createdAt: d.data().createdAt?.toMillis?.() ?? Date.now(),
    }))
  } catch {
    return []
  }
}

export async function addTip(drugId: string, text: string): Promise<FirestoreTip | null> {
  if (!db) return null
  const authorId = getDeviceId()
  try {
    const ref = await addDoc(collection(db, 'tips'), {
      drugId,
      text,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      authorId,
    })
    return {
      id: ref.id,
      drugId,
      text,
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      authorId,
    }
  } catch {
    return null
  }
}

export async function deleteTip(tipId: string): Promise<void> {
  if (!db) return
  try {
    await deleteDoc(doc(db, 'tips', tipId))
  } catch { /* ignore */ }
}

export async function toggleLike(tip: FirestoreTip): Promise<FirestoreTip> {
  if (!db) return tip
  const deviceId = getDeviceId()
  const hasLiked = tip.likedBy.includes(deviceId)
  try {
    await updateDoc(doc(db, 'tips', tip.id), {
      likes: increment(hasLiked ? -1 : 1),
      likedBy: hasLiked ? arrayRemove(deviceId) : arrayUnion(deviceId),
    })
    return {
      ...tip,
      likes: tip.likes + (hasLiked ? -1 : 1),
      likedBy: hasLiked
        ? tip.likedBy.filter((id) => id !== deviceId)
        : [...tip.likedBy, deviceId],
    }
  } catch {
    return tip
  }
}
