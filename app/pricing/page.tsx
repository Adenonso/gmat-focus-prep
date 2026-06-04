import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function PricingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) {
        setPlan(null)
        return
      }
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      setPlan(snap.exists() ? ((snap.data() as any).plan || 'free') : 'free')
    }
    fetchPlan()
  }, [user])

  const upgrade = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      })
      const data = await res.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (e: any) {
      console.error(e)
      alert('Upgrade failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <p className="mt-2 text-slate-600">Upgrade to Pro for unlimited questions, mock exams, and AI tutor access.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded">
            <h3 className="font-semibold">Free</h3>
            <p className="mt-2">30 practice questions/day, basic review, and access to free learning materials.</p>
          </div>

          <div className="p-6 border rounded">
            <h3 className="font-semibold">Pro</h3>
            <p className="mt-2">Unlimited practice, mock exams, AI tutor chat, and personalized study recommendations.</p>
            <div className="mt-4">
              <button onClick={upgrade} disabled={!user || loading || plan === 'pro'} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">
                {plan === 'pro' ? 'Already Pro' : loading ? 'Upgrading…' : 'Upgrade to Pro'}
              </button>
            </div>
            {plan === 'pro' && <p className="mt-2 text-sm text-green-700">You are already on the Pro plan.</p>}
            {!user && <p className="mt-2 text-sm text-slate-600">Sign in to upgrade your account.</p>}
          </div>
        </div>
      </main>
    </div>
  )
}
