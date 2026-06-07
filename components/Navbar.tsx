"use client"
import Link from 'next/link'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const { user, signOut } = useAuth()

  return (
    <nav className="w-full border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-primary">GMAT Focus</Link>
        <div className="space-x-4 flex items-center">
          <Link href="/pricing" className="text-sm">Pricing</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm">Dashboard</Link>
              <button onClick={signOut} className="text-sm px-2 py-1 border rounded">Sign Out</button>
            </>
          ) : (
            <Link href="/auth" className="text-sm">Sign in</Link>
          )}
          <button onClick={toggle} aria-label="Toggle theme" className="ml-2 px-2 py-1 border rounded">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </nav>
  )
}
