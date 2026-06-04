import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <main>
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">GMAT Focus Prep</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">AI-powered practice, mock exams, and an expert tutor built for GMAT Focus Edition.</p>
            <ul className="mt-4 list-disc pl-6 space-y-1 text-slate-600">
              <li>AI-generated practice questions with explanations</li>
              <li>Timed mock exams with personalized analysis</li>
              <li>Interactive lessons and an AI tutor</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link href="/auth" className="inline-block bg-primary text-white px-4 py-2 rounded">Get started â€” it's free</Link>
              <Link href="/pricing" className="inline-block border px-4 py-2 rounded">See pricing</Link>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-6 border rounded">
            <h4 className="font-semibold">Why GMAT Focus?</h4>
            <p className="mt-2 text-sm text-slate-600">Practice targeted by topic, get rapid explanations, and track progress over time. Free tier available.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
