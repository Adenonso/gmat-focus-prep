"use client"
import { useEffect, useRef, useState } from 'react'
import Navbar from '../../components/Navbar'
import AuthGuard from '../../components/AuthGuard'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import LoadingSkeleton from '../../components/LoadingSkeleton'

type Question = {
  question: string
  choices: Record<string, string>
  correct?: string | null
  explanation?: string | null
}

const SECTIONS = [
  { key: 'Quantitative', count: 23, seconds: 45 * 60 },
  { key: 'Verbal', count: 23, seconds: 45 * 60 },
  { key: 'Data Insights', count: 20, seconds: 45 * 60 }
]

export default function MockExamPage() {
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sectionIndex, setSectionIndex] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number>(0)
  const timerRef = useRef<number | null>(null)

  const [questions, setQuestions] = useState<Record<string, Question[]>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startSectionTimer = (secs: number) => {
    setSecondsLeft(secs)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // auto-submit current section
          if (timerRef.current) clearInterval(timerRef.current)
          onSectionTimeout()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const onSectionTimeout = async () => {
    // move to next section or finish
    const next = (sectionIndex ?? 0) + 1
    if (next >= SECTIONS.length) {
      await submitExam()
    } else {
      setSectionIndex(next)
      startSectionTimer(SECTIONS[next].seconds)
    }
  }

  const ensurePro = async (): Promise<boolean> => {
    if (!user) return false
    const uref = doc(db, 'users', user.uid)
    const udoc = await getDoc(uref)
    const plan = udoc.exists() ? (udoc.data() as any).plan || 'free' : 'free'
    if (plan !== 'pro') {
      setError('Mock exams are available to Pro users only. Please upgrade to access full mocks.')
      return false
    }
    return true
  }

  const startExam = async () => {
    setError(null)
    if (!user) {
      setError('You must be signed in to start an exam.')
      return
    }

    const ok = await ensurePro()
    if (!ok) return

    setIsStarting(true)
    // initialize first section
    setSectionIndex(0)
    startSectionTimer(SECTIONS[0].seconds)
    setIsStarting(false)
  }

  const fetchQuestionForSection = async (sectionKey: string): Promise<Question | null> => {
    try {
      const res = await fetch('/api/ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generateQuestion', section: sectionKey, topic: 'Mixed', difficulty: 'Medium' })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'AI error')
      return data.data as Question
    } catch (e) {
      console.error('fetchQuestionForSection', e)
      return null
    }
  }

  const getCurrentQuestion = async () => {
    if (sectionIndex === null) return null
    const sec = SECTIONS[sectionIndex]
    const arr = questions[sec.key] || []
    const idx = arr.length
    if (idx >= sec.count) return null
    // fetch new question
    const q = await fetchQuestionForSection(sec.key)
    if (!q) return null
    setQuestions((prev) => ({ ...prev, [sec.key]: [...(prev[sec.key] || []), q] }))
    return q
  }

  const selectAnswer = (sectionKey: string, qIndex: number, choice: string) => {
    const qid = `${sectionKey}_${qIndex}`
    setAnswers((a) => ({ ...a, [qid]: choice }))
  }

  const submitExam = async () => {
    if (!user) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSaving(true)

    // compute scores
    const sectionBreakdown: any = {}
    let totalAttempted = 0
    let totalCorrect = 0
    for (const s of SECTIONS) {
      const arr = questions[s.key] || []
      let correct = 0
      arr.forEach((q, i) => {
        const qid = `${s.key}_${i}`
        const sel = answers[qid]
        if (sel) {
          totalAttempted++
          if (q.correct && sel === q.correct) correct++
        }
      })
      sectionBreakdown[s.key] = {
        attempted: arr.length,
        correct,
        accuracy: arr.length ? Math.round((correct / arr.length) * 100) : 0
      }
      totalCorrect += correct
    }

    const overallAccuracy = totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0

    try {
      await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        type: 'mock',
        date: serverTimestamp(),
        score: overallAccuracy,
        sectionBreakdown,
        questionsAttempted: answers,
        meta: { totalAttempted }
      })
      setFinished(true)
    } catch (e) {
      console.error('failed to save session', e)
      setError('Failed to save session. Try again later.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">Mock Exam</h2>

          {error && <div className="mt-4 text-red-600">{error}</div>}

          {sectionIndex === null && !finished && (
            <div className="mt-6">
              <p className="text-slate-600">Full mock: 23 Quant + 23 Verbal + 20 Data Insights. 45 minutes per section. Auto-submits on timeout.</p>
              <div className="mt-4">
                <button onClick={startExam} disabled={isStarting} className="bg-primary text-white px-4 py-2 rounded">Start Mock Exam</button>
                {isStarting && <div className="mt-2"><LoadingSkeleton className="h-6 w-40" /></div>}
              </div>
            </div>
          )}

          {sectionIndex !== null && !finished && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Section: {SECTIONS[sectionIndex].key}</h3>
                <div className="font-mono">{Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:{(secondsLeft % 60).toString().padStart(2, '0')}</div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-slate-600">Questions answered in this section: {(questions[SECTIONS[sectionIndex].key] || []).length} / {SECTIONS[sectionIndex].count}</p>
                <div className="mt-4">
                  <button onClick={async () => { await getCurrentQuestion() }} className="px-3 py-2 border rounded">Load Next Question</button>
                </div>

                <div className="mt-4 space-y-4">
                  {(questions[SECTIONS[sectionIndex].key] || []).map((q, i) => (
                    <div key={i} className="p-3 border rounded">
                      <div className="font-semibold">Q{i + 1}: {q.question}</div>
                      <div className="mt-2 grid gap-2">
                        {q.choices && Object.entries(q.choices).map(([k, v]) => (
                          <button key={k} onClick={() => selectAnswer(SECTIONS[sectionIndex].key, i, k)} className={`text-left p-2 border rounded ${answers[`${SECTIONS[sectionIndex].key}_${i}`] === k ? 'bg-primary text-white' : ''}`}>
                            <strong>{k}.</strong> {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={onSectionTimeout} className="px-3 py-2 border rounded">Finish Section</button>
                  <button onClick={submitExam} className="px-3 py-2 bg-accent text-white rounded">Submit Exam</button>
                  {saving && <LoadingSkeleton className="h-6 w-24" />}
                </div>
              </div>
            </div>
          )}

          {finished && (
            <div className="mt-6">
              <h3 className="font-semibold">Exam submitted</h3>
              <p className="mt-2">Results saved. View them on your dashboard or the results page.</p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
