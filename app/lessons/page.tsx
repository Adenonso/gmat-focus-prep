"use client"
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import AuthGuard from '../../components/AuthGuard'
import { LESSONS } from '../../data/lessons'

export default function LessonsPage() {
  return (
    <AuthGuard>
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold">Lessons</h2>
          <div className="mt-6 grid gap-4">
            {LESSONS.map((l) => (
              <Link key={l.id} href={`/lessons/${l.id}`} className="block p-4 border rounded">
                <h3 className="font-semibold">{l.title}</h3>
                <p className="text-sm text-slate-600">{l.section}</p>
                <p className="mt-2 text-slate-700 text-sm">{l.content.slice(0, 120)}...</p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
