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
import { db, ensureAuth, getDeviceId } from './firebase'

export interface FirestoreTip {
  id: string
  drugId: string
  text: string
  createdAt: number
  likes: number
  likedBy: string[]
  authorId: string
}

/** 現在のユーザーIDを取得（Firebase UID → localStorage fallback） */
async function currentUserId(): Promise<string> {
  const uid = await ensureAuth()
  return uid ?? getDeviceId()
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
  const authorId = await currentUserId()
  try {
    const ref = await addDoc(collection(db, 'tips'), {
      drugId,
      text,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      authorId,
    })
    return { id: ref.id, drugId, text, createdAt: Date.now(), likes: 0, likedBy: [], authorId }
  } catch {
    return null
  }
}

export async function deleteTip(tipId: string): Promise<void> {
  if (!db) return
  try { await deleteDoc(doc(db, 'tips', tipId)) } catch { /* ignore */ }
}

export async function toggleLike(tip: FirestoreTip): Promise<FirestoreTip> {
  if (!db) return tip
  const userId = await currentUserId()
  const hasLiked = tip.likedBy.includes(userId)
  try {
    await updateDoc(doc(db, 'tips', tip.id), {
      likes: increment(hasLiked ? -1 : 1),
      likedBy: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    })
    return {
      ...tip,
      likes: tip.likes + (hasLiked ? -1 : 1),
      likedBy: hasLiked ? tip.likedBy.filter((id) => id !== userId) : [...tip.likedBy, userId],
    }
  } catch {
    return tip
  }
}
