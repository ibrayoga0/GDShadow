import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import LinkList from './LinkList'

export default function Dashboard({ session }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [section, setSection] = useState('dashboard') // dashboard | links | settings | logs
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, totalViews: 0, totalDownloads: 0, recent: [], topDownloads: [] })
  const [logs, setLogs] = useState([])
  const [logsPage, setLogsPage] = useState(1)
  const LOGS_SIZE = 10
  const [logsTotal, setLogsTotal] = useState(0)

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

  const fetchStats = async () => {
    try {
  const { data: recent } = await supabase.from('links').select('*').order('created_at', { ascending: false }).limit(5)
  const { data: topDownloads } = await supabase.from('links').select('*').order('downloads', { ascending: false }).limit(5)
  const totalLinks = await fetchCount('links')
  const totalClicks = await fetchSum('links', 'clicks')
  const totalViews = await fetchSum('links', 'views')
  const totalDownloads = await fetchSum('links', 'downloads')
  setStats({ totalLinks, totalClicks, totalViews, totalDownloads, recent: recent || [], topDownloads: topDownloads || [] })
    } catch {}
  }

  const fetchLogs = async (p = logsPage) => {
    try {
      const from = (p - 1) * LOGS_SIZE
      const to = from + LOGS_SIZE - 1
      const { data, error, count } = await supabase
        .from('link_clicks')
        .select('id, clicked_at, referer, user_agent, ip, link:links(file_id,title)', { count: 'exact' })
        .order('clicked_at', { ascending: false })
        .range(from, to)
      if (!error) {
        setLogs(data || [])
        setLogsTotal(count || 0)
        setLogsPage(p)
      }
    } catch {}
  }

  useEffect(() => { fetchLinks(); fetchStats(); if (section === 'logs') fetchLogs() }, [section])

  const onAdd = async (e) => {
    e.preventDefault()
    setError('')
    const fileId = parseFileId(input)
    if (!fileId) { setError('Link Google Drive tidak valid.'); return }
    const original_url = input
    let finalTitle = title
    let poster_url = ''
    let preview_url = ''
    if (!finalTitle) {
      try {
        const resp = await fetch(`/api/meta/${fileId}`)
        const data = await resp.json()
        if (data?.name) finalTitle = data.name
        if (data?.poster) poster_url = data.poster
        if (data?.preview) preview_url = data.preview
      } catch {}
    }
    const { error } = await supabase.from('links').insert({ file_id: fileId, original_url, title: finalTitle, created_by: user.id })
    if (error) { setError(error.message); return }
    // Best-effort update extra fields if columns exist
    try {
      const patch = {}
      if (poster_url) patch.poster_url = poster_url
      if (preview_url) patch.preview_url = preview_url
      if (Object.keys(patch).length > 0) {
        await supabase.from('links').update(patch).eq('file_id', fileId)
      }
    } catch {}
    setInput(''); setTitle('')
    fetchLinks()
  }

  const logout = async () => { await supabase.auth.signOut() }

  // Shadow Player removed: no per-item or global toggles

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      {/* Sidebar */}
    <aside className="hidden md:block bg-neutral-950 border-r border-neutral-900 p-4">
        <div className="flex items-center gap-2 mb-6">
          <img src="/gdshadow-logo.png" alt="GDShadow" className="h-7 w-auto" />
          <div className="font-semibold">GDShadow</div>
        </div>
        <nav className="grid gap-1 text-sm">
      <button className={`btn w-full justify-start ${section==='dashboard'?'btn-primary':'btn-ghost'}`} onClick={()=>setSection('dashboard')}>Dashboard</button>
      <button className={`btn w-full justify-start ${section==='links'?'btn-primary':'btn-ghost'}`} onClick={()=>setSection('links')}>Links</button>
      <button className={`btn w-full justify-start ${section==='settings'?'btn-primary':'btn-ghost'}`} onClick={()=>setSection('settings')}>Settings</button>
      <button className={`btn w-full justify-start ${section==='logs'?'btn-primary':'btn-ghost'}`} onClick={()=>setSection('logs')}>Logs</button>
        </nav>
      </aside>

      <div className="min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="border-b border-neutral-900">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-neutral-400 capitalize">{section}</div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-400 hidden sm:inline">{user.email}</span>
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8">
          {section==='links' && (
          <section className="space-y-6">
            <div className="card p-6">
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
            </div>
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Daftar Link</h2>
                <button className="btn btn-ghost h-9 px-3 text-sm" onClick={() => fetchLinks(page)}>Refresh</button>
              </div>
              <div className="p-4">
                <LinkList items={links} origin={origin} />
                {loading && <div className="text-neutral-400">Memuat…</div>}
                {!loading && links.length === 0 && (
                  <div className="text-neutral-400">Belum ada data.</div>
                )}
              </div>
              {total > 0 && (
                <div className="p-4 border-t border-neutral-800">
                  <Pager
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={(p) => fetchLinks(p)}
                  />
                </div>
              )}
            </div>
          </section>
          )}

          {section==='dashboard' && (
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="card p-6"><div className="text-sm text-neutral-400">Total Links</div><div className="text-3xl font-semibold mt-1">{stats.totalLinks}</div></div>
              <div className="card p-6"><div className="text-sm text-neutral-400">Total Views</div><div className="text-3xl font-semibold mt-1">{stats.totalViews}</div></div>
              <div className="card p-6"><div className="text-sm text-neutral-400">Total Downloads</div><div className="text-3xl font-semibold mt-1">{stats.totalDownloads}</div></div>
              <div className="card p-6"><div className="text-sm text-neutral-400">User</div><div className="text-3xl font-semibold mt-1">{user.email}</div></div>
              <div className="lg:col-span-2 card p-0 overflow-hidden">
                <div className="p-4 border-b border-neutral-800 font-semibold">Recent Links</div>
                <table className="w-full text-sm">
                  <thead className="text-neutral-400">
                    <tr className="border-b border-neutral-800">
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">FILE_ID</th>
                      <th className="text-left p-3">Views</th>
                      <th className="text-left p-3">Downloads</th>
                      <th className="text-left p-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map(r => (
                      <tr key={r.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                        <td className="p-3">{r.title || 'Tanpa Judul'}</td>
                        <td className="p-3 text-xs text-neutral-400">{r.file_id}</td>
                        <td className="p-3">{r.views ?? r.clicks ?? 0}</td>
                        <td className="p-3">{r.downloads ?? 0}</td>
                        <td className="p-3 text-xs text-neutral-400">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {stats.recent.length===0 && (
                      <tr><td className="p-3 text-neutral-400" colSpan="4">Belum ada data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-neutral-800 font-semibold">Top Downloads</div>
                <table className="w-full text-sm">
                  <thead className="text-neutral-400">
                    <tr className="border-b border-neutral-800">
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">Downloads</th>
                      <th className="text-left p-3">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topDownloads.map(r => (
                      <tr key={r.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                        <td className="p-3">{r.title || 'Tanpa Judul'}</td>
                        <td className="p-3">{r.downloads ?? 0}</td>
                        <td className="p-3">{r.views ?? r.clicks ?? 0}</td>
                      </tr>
                    ))}
                    {stats.topDownloads.length===0 && (
                      <tr><td className="p-3 text-neutral-400" colSpan="3">Belum ada data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {section==='settings' && (
            <Settings origin={origin} />
          )}

          {section==='logs' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Logs</h2>
                <button className="btn btn-ghost" onClick={() => fetchLogs(logsPage)}>Refresh</button>
              </div>
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-neutral-400">
                    <tr className="border-b border-neutral-800">
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">FILE_ID</th>
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">IP</th>
                      <th className="text-left p-3">Referer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                        <td className="p-3 text-xs">{new Date(l.clicked_at).toLocaleString()}</td>
                        <td className="p-3 text-xs text-neutral-400">{l.link?.file_id || '-'}</td>
                        <td className="p-3">{l.link?.title || '—'}</td>
                        <td className="p-3 text-xs">{l.ip || '-'}</td>
                        <td className="p-3 text-xs truncate max-w-[240px]">{l.referer || '-'}</td>
                      </tr>
                    ))}
                    {logs.length===0 && (
                      <tr><td className="p-3 text-neutral-400" colSpan="5">Belum ada data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {logsTotal > 0 && (
                <Pager page={logsPage} pageSize={LOGS_SIZE} total={logsTotal} onChange={(p)=>fetchLogs(p)} center />
              )}
            </section>
          )}
        </main>
      </div>
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
    <div className="flex items-center justify-center gap-2 mt-3">
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

async function fetchCount(table) {
  const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return count || 0
}

async function fetchAllClicks() {
  const { data, error } = await supabase.from('links').select('clicks')
  if (error || !data) return 0
  return data.reduce((a, b) => a + (b.clicks || 0), 0)
}

async function fetchSum(table, column) {
  const { data, error } = await supabase.from(table).select(column)
  if (error || !data) return 0
  return data.reduce((a, b) => a + (b[column] || 0), 0)
}

function Settings({ origin }) {
  const [defaultPlayer, setDefaultPlayer] = useState(localStorage.getItem('default_player') || 'proxy')
  const [disqus, setDisqus] = useState(localStorage.getItem('disqus_shortname') || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/settings/get')
        const json = await resp.json()
        const s = json?.settings || {}
        if (s.default_player) setDefaultPlayer(s.default_player)
        if (s.disqus_shortname) setDisqus(s.disqus_shortname)
      } catch {}
    })()
  }, [])

  const save = async () => {
    try {
      await fetch('/api/settings/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'default_player', value: defaultPlayer }) })
      await fetch('/api/settings/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'disqus_shortname', value: disqus }) })
    } catch {}
    // local fallback
    localStorage.setItem('default_player', defaultPlayer)
    localStorage.setItem('disqus_shortname', disqus)
    setSaved(true)
    setTimeout(()=>setSaved(false), 1500)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <div className="text-lg font-semibold mb-2">General</div>
        <div className="text-sm text-neutral-400">Domain: {origin}</div>
        <div className="text-sm text-neutral-400 mt-1">Supabase URL set: {Boolean(import.meta.env.VITE_SUPABASE_URL) ? 'Yes' : 'No'}</div>
        <div className="mt-4 grid gap-2">
          <label className="text-sm text-neutral-300">Default Player</label>
          <div className="flex gap-2">
            <button className={`btn h-9 px-3 text-sm ${defaultPlayer==='proxy'?'btn-primary':'btn-ghost'}`} onClick={()=>setDefaultPlayer('proxy')}>Proxy</button>
            <button className={`btn h-9 px-3 text-sm ${defaultPlayer==='gdrive'?'btn-primary':'btn-ghost'}`} onClick={()=>setDefaultPlayer('gdrive')}>GDrive</button>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="text-lg font-semibold mb-2">Komentar</div>
        <label className="text-sm text-neutral-300">Disqus Shortname</label>
        <input className="input mt-1" placeholder="contoh: mysite" value={disqus} onChange={e=>setDisqus(e.target.value)} />
        <div className="mt-4 flex items-center gap-2">
          <button className="btn btn-primary" onClick={save}>Simpan</button>
          {saved && <span className="text-sm text-brand-400">Tersimpan</span>}
        </div>
      </div>
    </section>
  )
}

