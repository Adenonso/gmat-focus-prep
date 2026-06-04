"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import AuthGuard from '../../../components/AuthGuard'
import { LESSONS } from '../../../data/lessons'
import { useAuth } from '../../../context/AuthContext'
import { db } from '../../../lib/firebase'
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore'
import LoadingSkeleton from '../../../components/LoadingSkeleton'

export default function LessonDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const lesson = LESSONS.find((l) => l.id === id)
  const { user } = useAuth()
  const router = useRouter()

  const [quiz, setQuiz] = useState<any[] | null>(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (!lesson) router.push('/lessons')
  }, [lesson, router])

  const startQuiz = async () => {
    if (!user) return
    setLoadingQuiz(true)
    try {
      const qs: any[] = []
      for (let i = 0; i < 3; i++) {
        const res = await fetch('/api/ai/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'generateQuestion', section: lesson.section, topic: lesson.title, difficulty: 'Medium' })
        })
        const data = await res.json()
        if (data.ok) qs.push(data.data)
      }
      setQuiz(qs)
      // cache quiz questions to Firestore
      try {
        const qcol = collection(db, 'questions')
        for (const q of qs) {
          await addDoc(qcol, {
            section: lesson.section,
            topic: lesson.title,
            difficulty: 'Medium',
            questionText: q.question || '',
            choices: q.choices || {},
            correctAnswer: q.correct || null,
            explanation: q.explanation || null,
            cachedAt: serverTimestamp()
          })
        }
      } catch (e) {
        console.error('cache lesson quiz failed', e)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingQuiz(false)
    }
  }

  const submitQuiz = async () => {
    if (!quiz || !user) return
    let correct = 0
    quiz.forEach((q, i) => {
      if (answers[i] && answers[i] === q.correct) correct++
    })
    setScore(Math.round((correct / quiz.length) * 100))
    // mark lesson completed in user doc
    try {
      const uref = doc(db, 'users', user.uid)
      await setDoc(uref, { lessonsCompleted: { [id]: serverTimestamp() } }, { merge: true })
    } catch (e) {
      console.error('mark lesson complete failed', e)
    }
  }

  if (!lesson) return null

  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">{lesson.title}</h2>
          <p className="mt-4 text-slate-700">{lesson.content}</p>

          {!quiz && (
            <div className="mt-6">
              <button onClick={startQuiz} disabled={loadingQuiz} className="px-4 py-2 bg-primary text-white rounded">{loadingQuiz ? 'Preparing quiz…' : 'Start Mini-Quiz'}</button>
              {loadingQuiz && <div className="mt-2"><LoadingSkeleton className="h-6 w-40" /></div>}
            </div>
          )}

          {quiz && (
            <div className="mt-6 space-y-4">
              {quiz.map((q, i) => (
                <div key={i} className="p-3 border rounded">
                  <div className="font-semibold">Q{i + 1}: {q.question}</div>
                  <div className="mt-2 grid gap-2">
                    {q.choices && Object.entries(q.choices).map(([k, v]) => (
                      <button key={k} onClick={() => setAnswers((a) => ({ ...a, [i]: k }))} className={`text-left p-2 border rounded ${answers[i] === k ? 'bg-primary text-white' : ''}`}>
                        <strong>{k}.</strong> {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4">
                <button onClick={submitQuiz} className="px-4 py-2 bg-accent text-white rounded">Submit Quiz</button>
              </div>
            </div>
          )}

          {score !== null && (
            <div className="mt-6 p-4 border rounded">
              <h3 className="font-semibold">Score: {score}%</h3>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
