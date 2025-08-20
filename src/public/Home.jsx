import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

export default function PublicHome() {
  const [latest, setLatest] = useState([])
  const [viral, setViral] = useState([])
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // We use existing 'links' table as videos. Views/downloads fields may not exist yet, fallback to clicks as popularity.
  const { data: latestData } = await supabase.from('links').select('*').order('created_at', { ascending: false }).limit(8)
  const { data: popularData } = await supabase.from('links').select('*').order('downloads', { ascending: false }).limit(8)
  const { data: viralData } = await supabase.from('links').select('*').order('views', { ascending: false }).limit(8)
      setLatest(latestData || [])
  setPopular((popularData && popularData.length>0) ? popularData : (latestData || []))
  setViral((viralData && viralData.length>0) ? viralData : (popularData || latestData || []))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-900">
        <div className="container-narrow py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/gdshadow-logo.png" alt="GDShadow" className="h-7" />
            <span className="font-semibold">GDShadow</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <a className="btn btn-ghost h-9 px-3" href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="container-narrow py-8 space-y-10">
        <Section title="Video Terbaru" items={latest} />
        <Section title="Video Viral" items={viral} />
        <Section title="Video Populer" items={popular} />
        {loading && <div className="text-neutral-400">Memuat…</div>}
      </main>
    </div>
  )
}

function Section({ title, items }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(item => (
          <Link key={item.id} to={`/v/${item.file_id}`} className="group">
            <div className="card p-0 overflow-hidden">
              <div className="aspect-video bg-neutral-900">
                {item.poster_url && (
                  <img src={item.poster_url} alt="thumb" className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="p-3">
                <div className="text-sm truncate group-hover:text-brand-400 transition-colors">{item.title || 'Tanpa Judul'}</div>
                <div className="text-xs text-neutral-500 mt-1">{(item.views ?? item.clicks ?? 0)} views • {(item.downloads ?? 0)} downloads</div>
              </div>
            </div>
          </Link>
        ))}
        {items.length===0 && (
          <div className="text-neutral-400">Belum ada data.</div>
        )}
      </div>
    </section>
  )
}
