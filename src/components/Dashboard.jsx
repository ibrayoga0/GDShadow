import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import LinkList from './LinkList'

export default function Dashboard({ session }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const user = session.user

  const origin = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
    return 'https://gdshadow.domain'
  }, [])

  const parseFileId = (url) => {
    if (!url) return ''
    // Support various Drive formats
    const patterns = [
      /https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /https?:\/\/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
      /^([a-zA-Z0-9_-]{10,})$/,
    ]
    for (const re of patterns) {
      const m = url.match(re)
      if (m?.[1]) return m[1]
    }
    return ''
  }

  const fetchLinks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    setLinks(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLinks() }, [])

  const onAdd = async (e) => {
    e.preventDefault()
    setError('')
    const fileId = parseFileId(input)
    if (!fileId) { setError('Link Google Drive tidak valid.'); return }
    const original_url = input
    const { error } = await supabase.from('links').insert({ file_id: fileId, original_url, title, created_by: user.id })
    if (error) { setError(error.message); return }
    setInput(''); setTitle('')
    fetchLinks()
  }

  const logout = async () => { await supabase.auth.signOut() }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800">
        <div className="container-narrow flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-brand-600 grid place-items-center font-bold">G</div>
            <div>
              <div className="font-semibold">GDShadow</div>
              <div className="text-xs text-neutral-400">Admin Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400 hidden sm:inline">{user.email}</span>
            <button className="btn btn-ghost" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="container-narrow py-8 space-y-8">
        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Tambah Link</h2>
          <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-2 sm:col-span-1">
              <label className="text-sm text-neutral-300">Link Google Drive</label>
              <input className="input" placeholder="https://drive.google.com/file/d/FILE_ID/view?..." value={input} onChange={e => setInput(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-1">
              <label className="text-sm text-neutral-300">Judul (opsional)</label>
              <input className="input" placeholder="Nama video" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="sm:row-start-2 sm:col-span-2">
              <button className="btn btn-primary w-full sm:w-auto">Generate</button>
            </div>
          </form>
          {error && <div className="text-sm text-red-400 mt-3">{error}</div>}
          <div className="text-xs text-neutral-500 mt-3">GD link akan menjadi: <span className="badge">{origin}/d/FILE_ID</span></div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daftar Link</h2>
            <button className="btn btn-ghost" onClick={fetchLinks}>Refresh</button>
          </div>
          <LinkList items={links} origin={origin} />
          {loading && <div className="text-neutral-400">Memuat…</div>}
          {!loading && links.length === 0 && (
            <div className="text-neutral-400">Belum ada data.</div>
          )}
        </section>
      </main>
    </div>
  )
}
