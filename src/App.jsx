import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess))
    return () => sub?.subscription?.unsubscribe()
  }, [])

  const isAdmin = session?.user?.email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(session.user.email))

  if (loading) return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-neutral-400">Loading…</div>
    </div>
  )

  if (!session || !isAdmin) return <AuthGate reason={!session ? 'Silakan login admin' : 'Akun ini tidak terdaftar sebagai admin'} />

  return <Dashboard session={session} />
}

function AuthGate({ reason }) {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 flex flex-col items-center gap-3">
          <img src="/gdshadow-logo.png" alt="GDShadow" className="h-12 w-auto" />
          <div>
            <h1 className="text-2xl font-semibold">GDShadow Admin</h1>
            <p className="text-neutral-400 mt-1">{reason}</p>
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
