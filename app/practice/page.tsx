"use client"
import { useState } from 'react'
import Navbar from '../../components/Navbar'
import AuthGuard from '../../components/AuthGuard'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore'
import LoadingSkeleton from '../../components/LoadingSkeleton'

export default function PracticePage() {
  const { user } = useAuth()
  const [section, setSection] = useState('Quantitative')
  const [topic, setTopic] = useState('Algebra')
  const [difficulty, setDifficulty] = useState('Medium')
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const FREE_DAILY_LIMIT = 30

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!user) throw new Error('Not authenticated')

      // check plan and today's attempts
      const uref = doc(db, 'users', user.uid)
      const udoc = await getDoc(uref)
      const plan = udoc.exists() ? (udoc.data() as any).plan || 'free' : 'free'

      if (plan !== 'pro') {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const attemptsQ = query(collection(db, 'attempts'), where('userId', '==', user.uid), where('date', '>=', Timestamp.fromDate(start)))
        const snaps = await getDocs(attemptsQ)
        if (snaps.size >= FREE_DAILY_LIMIT) {
          setError(`Daily free limit reached (${FREE_DAILY_LIMIT} questions). Upgrade to Pro for unlimited access.`)
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generateQuestion', section, topic, difficulty })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'AI error')
      setQuestion(data.data)

      // Cache question to Firestore questions collection
      try {
        const qcol = collection(db, 'questions')
        await addDoc(qcol, {
          section,
          topic,
          difficulty,
          questionText: data.data.question || '',
          choices: data.data.choices || {},
          correctAnswer: data.data.correct || null,
          explanation: data.data.explanation || null,
          cachedAt: serverTimestamp()
        })
      } catch (e) {
        console.error('failed to cache question', e)
      }

      // record attempt
      try {
        await addDoc(collection(db, 'attempts'), {
          userId: user.uid,
          mode: 'practice',
          section,
          topic,
          difficulty,
          date: serverTimestamp()
        })
      } catch (e) {
        console.error('failed to record attempt', e)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">Practice</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={section} onChange={(e) => setSection(e.target.value)} className="border px-3 py-2 rounded">
              <option>Quantitative</option>
              <option>Verbal</option>
              <option>Data Insights</option>
            </select>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="border px-3 py-2 rounded" />
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border px-3 py-2 rounded">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div className="mt-4">
            <button onClick={generate} disabled={loading} className="bg-primary text-white px-4 py-2 rounded">
              {loading ? 'Generating…' : 'Generate Question'}
            </button>
          </div>

          {error && <div className="mt-4 text-red-600">{error}</div>}

          {loading && !question && <LoadingSkeleton className="h-20 w-full" />}

          {question && (
            <div className="mt-6 border rounded p-4">
              <h3 className="font-semibold">{question.question}</h3>
              <ul className="mt-2 list-disc pl-6">
                {question.choices && Object.entries(question.choices).map(([k, v]: any) => (
                  <li key={k}><strong>{k}:</strong> {v}</li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
