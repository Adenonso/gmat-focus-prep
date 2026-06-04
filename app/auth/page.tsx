"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'

export default function AuthPage() {
  const { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)

  if (!loading && user) {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 border rounded">
        <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
        <button
          onClick={async () => {
            await signInWithGoogle()
            router.push('/dashboard')
          }}
          className="w-full bg-white border px-4 py-2 rounded flex items-center justify-center"
        >
          Sign in with Google
        </button>

        <div className="mt-4">
          <label className="block text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
          <label className="block text-sm mt-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />

          {isSigningUp && (
            <>
              <label className="block text-sm mt-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={async () => {
                if (isSigningUp) {
                  await signUpWithEmail(email, password, name)
                } else {
                  await signInWithEmail(email, password)
                }
                router.push('/dashboard')
              }}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              {isSigningUp ? 'Sign up' : 'Sign in'}
            </button>

            <button className="px-3 py-2 border rounded" onClick={() => setIsSigningUp((s) => !s)}>
              {isSigningUp ? 'Have an account?' : 'Create account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
