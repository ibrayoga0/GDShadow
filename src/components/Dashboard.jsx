import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import LinkList from './LinkList'
import ShadowPlayer from './ShadowPlayer'

export default function Dashboard({ session }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [defaultEngine, setDefaultEngine] = useState('drive') // 'drive' | 'shadow'

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

  const fetchLinks = async (p = page) => {
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error, count } = await supabase
      .from('links')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) setError(error.message)
    setLinks(data || [])
    setTotal(count || 0)
    setPage(p)
    setLoading(false)
  }

  useEffect(() => { fetchLinks(); fetchDefaultEngine() }, [])

  const fetchDefaultEngine = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('key,value').eq('key', 'default_preview_engine').maybeSingle()
      if (!error && data?.value) setDefaultEngine(data.value)
    } catch {}
  }

  const onAdd = async (e) => {
    e.preventDefault()
    setError('')
    const fileId = parseFileId(input)
    if (!fileId) { setError('Link Google Drive tidak valid.'); return }
    const original_url = input
    let finalTitle = title
    if (!finalTitle) {
      try {
        const resp = await fetch(`/api/meta/${fileId}`)
        const data = await resp.json()
        if (data?.name) finalTitle = data.name
      } catch {}
    }
    const { error } = await supabase.from('links').insert({ file_id: fileId, original_url, title: finalTitle, created_by: user.id })
    if (error) { setError(error.message); return }
    setInput(''); setTitle('')
    fetchLinks()
  }

  const logout = async () => { await supabase.auth.signOut() }

  const toggleUseShadow = async (item, next) => {
    try {
      const { error } = await supabase.from('links').update({ use_shadow: next }).eq('id', item.id)
      if (!error) fetchLinks(page)
    } catch {}
  }

  const saveDefaultEngine = async (engine) => {
    setDefaultEngine(engine)
    try {
      // upsert by key
      const { error } = await supabase.from('app_settings').upsert({ key: 'default_preview_engine', value: engine }, { onConflict: 'key' })
      if (!error) return
    } catch {}
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800">
        <div className="container-narrow flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src="/gdshadow-logo.png" alt="GDShadow" className="h-8 w-auto" />
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
          <form onSubmit={onAdd} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-2 sm:col-span-1">
              <label className="text-sm text-neutral-300">Link Google Drive</label>
              <input className="input text-base py-3" placeholder="https://drive.google.com/file/d/FILE_ID/view?..." value={input} onChange={e => setInput(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-1">
              <label className="text-sm text-neutral-300">Judul (opsional)</label>
              <input className="input text-base py-3" placeholder="Nama video" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="sm:row-start-2 sm:col-span-2">
              <button className="btn btn-primary w-full sm:w-auto h-11 text-base">Generate</button>
            </div>
          </form>
          {error && <div className="text-sm text-red-400 mt-3">{error}</div>}
          <div className="text-xs text-neutral-500 mt-3">GD link akan menjadi: <span className="badge">{origin}/d/FILE_ID</span></div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-3">Settings → Player</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm text-neutral-300">Default Preview Engine</div>
            <div className="flex gap-2">
              <button
                className={`btn ${defaultEngine === 'drive' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => saveDefaultEngine('drive')}
              >Google Drive</button>
              <button
                className={`btn ${defaultEngine === 'shadow' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => saveDefaultEngine('shadow')}
              >Shadow Player</button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daftar Link</h2>
            <button className="btn btn-ghost" onClick={() => fetchLinks(page)}>Refresh</button>
          </div>
          <LinkList
            items={links}
            origin={origin}
            defaultEngine={defaultEngine}
            onToggleUseShadow={toggleUseShadow}
            renderPreview={(fileId, useShadow) => (
              useShadow ? (
                <ShadowPlayer fileId={fileId} />
              ) : (
                <div className="mt-4">
                  {/* Fall back to Drive preview */}
                  <iframe
                    src={`https://drive.google.com/file/d/${fileId}/preview`}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="w-full aspect-video rounded-lg border border-neutral-800"
                    title={`Preview ${fileId}`}
                  />
                </div>
              )
            )}
          />
          {total > 0 && (
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={(p) => fetchLinks(p)}
            />
          )}
          {loading && <div className="text-neutral-400">Memuat…</div>}
          {!loading && links.length === 0 && (
            <div className="text-neutral-400">Belum ada data.</div>
          )}
        </section>
      </main>
    </div>
  )
}

function Pager({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages
  // Build compact page numbers (window of up to 5)
  let start = Math.max(1, page - 2)
  let end = Math.min(totalPages, start + 4)
  start = Math.max(1, end - 4)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-end gap-2 mt-3">
      <button
        className="btn btn-ghost h-9 px-3 text-sm"
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
      >Prev</button>
      {start > 1 && (
        <>
          <button className="btn btn-ghost h-9 px-3 text-sm" onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="text-neutral-500">…</span>}
        </>
      )}
      {pages.map(p => (
        <button
          key={p}
          className={`h-9 px-3 text-sm rounded-lg border ${p === page ? 'bg-brand-600 border-brand-600 text-white' : 'btn btn-ghost'}`}
          onClick={() => onChange(p)}
        >{p}</button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-neutral-500">…</span>}
          <button className="btn btn-ghost h-9 px-3 text-sm" onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button
        className="btn btn-ghost h-9 px-3 text-sm"
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
      >Next</button>
    </div>
  )
}
