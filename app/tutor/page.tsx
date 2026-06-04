"use client"
import { useState } from 'react'
import Navbar from '../../components/Navbar'
import AuthGuard from '../../components/AuthGuard'
import { useAuth } from '../../context/AuthContext'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import LoadingSkeleton from '../../components/LoadingSkeleton'

export default function TutorPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim()) return
    const next = [...messages, { role: 'user', text: input }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const payload = { mode: 'chat', messages: next.map((m) => ({ role: m.role, content: m.text })) }
      const res = await fetch('/api/ai/route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.ok) {
        const reply = data.data.reply || data.data
        setMessages((m) => [...m, { role: 'assistant', text: reply }])

        // persist chat message optionally
        if (user) {
          try {
            await addDoc(collection(db, 'tutorSessions'), {
              userId: user.uid,
              messages: [...next, { role: 'assistant', text: reply }],
              date: serverTimestamp()
            })
          } catch (e) {
            console.error('failed to save tutor session', e)
          }
        }
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, I could not get a response right now.' }])
      }
    } catch (e) {
      console.error(e)
      setMessages((m) => [...m, { role: 'assistant', text: 'Error contacting AI service.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">AI Tutor</h2>
          <div className="mt-4 border rounded p-4 min-h-[300px]">
            {messages.map((m, i) => (<div key={i} className="mb-2"><strong>{m.role}:</strong> {m.text}</div>))}
            {loading && <div className="mt-2"><LoadingSkeleton className="h-6 w-40" /></div>}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border px-3 py-2 rounded" />
            <button onClick={send} disabled={loading} className="bg-primary text-white px-4 py-2 rounded">{loading ? 'Thinking…' : 'Send'}</button>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
