"use client"
import Navbar from '../../components/Navbar'
import AuthGuard from '../../components/AuthGuard'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { doc, onSnapshot, query, collection, where, orderBy, limit, onSnapshot as onSnap, getFirestore } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import LoadingSkeleton from '../../components/LoadingSkeleton'

export default function DashboardPage() {
  const { user } = useAuth()
  const [userDoc, setUserDoc] = useState<any | null>(null)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  useEffect(() => {
    if (!user) return
    const uref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(uref, (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null)
    })

    const sessionsQ = query(collection(db, 'sessions'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(5))
    const unsubSessions = onSnap(sessionsQ, (qsnap) => {
      const items: any[] = []
      qsnap.forEach((d) => items.push({ id: d.id, ...d.data() }))
      setRecentSessions(items)
    })

    return () => {
      unsub()
      unsubSessions()
    }
  }, [user])

  useEffect(() => { if (user !== undefined) setLoadingInitial(false) }, [user])

  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">Welcome, {user?.displayName ?? user?.email}</h2>

          <section className="mt-6 grid gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold">Progress</h3>
              <div className="mt-2">
                {loadingInitial ? (
                  <LoadingSkeleton className="h-6 w-1/3" />
                ) : (
                  <>
                    <div className="text-sm text-slate-600">Streak: {userDoc?.streak ?? 0}</div>
                    <div className="text-sm text-slate-600">Total Questions: {userDoc?.totalQuestionsAttempted ?? 0}</div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-semibold">Recent Sessions</h3>
              <ul className="mt-2 list-disc pl-6">
                {recentSessions.length === 0 && <li>No recent sessions</li>}
                {recentSessions.map((s) => (
                  <li key={s.id}>{s.type} — {new Date(s.date?.toDate?.() ?? s.date).toLocaleString()}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 border rounded">Quick start: Practice / Mock Exam / Tutor</div>
          </section>
        </main>
      </div>
    </AuthGuard>
  )
}
