import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-2">
        <label className="text-sm text-neutral-300">Email</label>
        <input className="input text-base py-3" type="email" placeholder="admin@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <label className="text-sm text-neutral-300">Password</label>
        <input className="input text-base py-3" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <button type="submit" className="btn btn-primary w-full h-11 text-base" disabled={loading}>
        {loading ? 'Masuk…' : 'Login' }
      </button>
    </form>
  )
}
