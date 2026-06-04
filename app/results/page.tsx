"use client"
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import AuthGuard from '../../components/AuthGuard'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import LoadingSkeleton from '../../components/LoadingSkeleton'

export default function ResultsPage() {
  const { user } = useAuth()
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true)
      if (!user) {
        setLoading(false)
        return
      }
      const q = query(collection(db, 'sessions'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) setSession({ id: snap.docs[0].id, ...snap.docs[0].data() })
      setLoading(false)
    }
    fetchLatest()
  }, [user])

  const analyze = async () => {
    if (!session) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyzeMock', session })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'AI error')
      setAnalysis(data.data)
    } catch (e: any) {
      setAnalysis({ error: e.message })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">Results</h2>

          {loading && <div className="mt-4"><LoadingSkeleton className="h-6 w-48" /></div>}

          {!loading && !session && <div className="mt-4">No sessions found. Take a mock exam to see results here.</div>}

          {session && (
            <div className="mt-4 space-y-4">
              <div className="p-4 border rounded">
                <h3 className="font-semibold">Score: {session.score ?? 'N/A'}</h3>
                <pre className="mt-2 bg-slate-50 p-3 rounded overflow-auto">{JSON.stringify(session.sectionBreakdown, null, 2)}</pre>
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-semibold">Quick review</h3>
                <p className="mt-2 text-sm text-slate-600">Correct/incorrect review and per-question feedback coming soon.</p>
              </div>

              <div className="p-4 border rounded">
                <h3 className="font-semibold">AI improvement suggestions</h3>
                {analysis ? (
                  <div className="mt-2">
                    {analysis.error ? (
                      <p className="text-red-600">Error: {analysis.error}</p>
                    ) : (
                      <>
                        {analysis.summary && <p className="font-medium">{analysis.summary}</p>}
                        {analysis.improvementPlan && <div className="mt-2 whitespace-pre-wrap">{analysis.improvementPlan}</div>}
                        {analysis.bySection && (
                          <div className="mt-2">
                            <h4 className="font-semibold">By section</h4>
                            <ul className="mt-2 list-disc pl-6">
                              {Object.entries(analysis.bySection).map(([s, advice]: any) => (
                                <li key={s}><strong>{s}:</strong> {advice}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <button onClick={analyze} disabled={analyzing} className="px-4 py-2 bg-primary text-white rounded">{analyzing ? 'Analyzing…' : 'Analyze with AI'}</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}

