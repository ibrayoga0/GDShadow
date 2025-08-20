import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Simple player switcher: default proxy (using redirect /d/:fileId); fallback to GDrive iframe
export default function VideoDetail() {
  const { fileId } = useParams()
  const [player, setPlayer] = useState('proxy') // 'proxy' | 'gdrive'
  const [meta, setMeta] = useState(null)
  const [settings, setSettings] = useState({ disqus: '', defaultPlayer: 'proxy' })

  const origin = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }, [])

  const proxyUrl = `${origin}/api/stream/${fileId}`
  const drivePreview = `https://drive.google.com/file/d/${fileId}/preview`

  useEffect(() => {
    setPlayer('proxy')
    // fire-and-forget view tracking
    try { fetch(`/api/track/view?fileId=${fileId}`).catch(()=>{}) } catch {}
  }, [fileId])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('links').select('*').eq('file_id', fileId).maybeSingle()
        setMeta(data || null)
      } catch {}
      // load settings from app_settings or localStorage
      try {
        const { data: rows, error } = await supabase.from('app_settings').select('key,value')
        if (!error && Array.isArray(rows)) {
          const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
          setSettings({
            disqus: map['disqus_shortname'] || localStorage.getItem('disqus_shortname') || '',
            defaultPlayer: map['default_player'] || localStorage.getItem('default_player') || 'proxy',
          })
          if (map['default_player']) setPlayer(map['default_player'])
          return
        }
      } catch {}
      const dp = localStorage.getItem('default_player') || 'proxy'
      setSettings({ disqus: localStorage.getItem('disqus_shortname') || '', defaultPlayer: dp })
      setPlayer(dp)
    }
    load()
  }, [fileId])

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-900">
        <div className="container-narrow py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/gdshadow-logo.png" alt="GDShadow" className="h-7" />
            <span className="font-semibold">GDShadow</span>
          </a>
          <nav className="flex items-center gap-3 text-sm">
            <a className="btn btn-ghost h-9 px-3" href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="container-narrow py-6 space-y-6">
        <div className="card p-0 overflow-hidden">
          <div className="p-3 flex items-center justify-between border-b border-neutral-800">
            <div className="text-sm text-neutral-300">Player</div>
            <div className="flex gap-2">
              <button className={`btn h-9 px-3 text-sm ${player==='proxy'?'btn-primary':'btn-ghost'}`} onClick={()=>setPlayer('proxy')}>Proxy</button>
              <button className={`btn h-9 px-3 text-sm ${player==='gdrive'?'btn-primary':'btn-ghost'}`} onClick={()=>setPlayer('gdrive')}>GDrive</button>
            </div>
          </div>
          <div className="aspect-video bg-black">
            {player==='proxy' ? (
              <video controls className="w-full h-full" src={proxyUrl} />
            ) : (
              <iframe src={drivePreview} allow="autoplay; fullscreen" className="w-full h-full" title={`Preview ${fileId}`} />
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="text-2xl font-semibold">{meta?.title || 'Tanpa Judul'}</div>
          {meta?.description && <div className="text-sm text-neutral-400 mt-1 whitespace-pre-line">{meta.description}</div>}
          <div className="mt-3 grid gap-2 text-sm text-neutral-400 sm:grid-cols-3">
            <div><span className="text-neutral-500">Upload:</span> {meta?.created_at ? new Date(meta.created_at).toLocaleString() : '-'}</div>
            <div><span className="text-neutral-500">Views:</span> {meta?.views ?? meta?.clicks ?? 0}</div>
            <div><span className="text-neutral-500">Downloads:</span> {meta?.downloads ?? 0}</div>
          </div>
          <div className="mt-4">
            <a className="btn btn-primary" href={proxyUrl} target="_blank" rel="noreferrer" onClick={()=>{try{fetch(`/api/track/download?fileId=${fileId}`).catch(()=>{})}catch{}}}>Download via Proxy</a>
            <a className="btn btn-ghost ml-2" href={`https://drive.google.com/uc?export=download&id=${fileId}`} target="_blank" rel="noreferrer" onClick={()=>{try{fetch(`/api/track/download?fileId=${fileId}`).catch(()=>{})}catch{}}}>Download via Drive</a>
          </div>
        </div>
        <Comments disqusShortname={settings.disqus} identifier={fileId} />
      </main>
    </div>
  )
}

function Comments({ disqusShortname, identifier }) {
  if (!disqusShortname) return (
    <div className="card p-6"><div className="text-neutral-400 text-sm">Komentar belum diaktifkan.</div></div>
  )
  // Disqus embed
  return (
    <div className="card p-6">
      <div id="disqus_thread"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        var disqus_config = function () {
          this.page.url = window.location.href;
          this.page.identifier = '${identifier}';
        };
        (function() { var d = document, s = d.createElement('script'); s.src = 'https://${disqusShortname}.disqus.com/embed.js'; s.setAttribute('data-timestamp', +new Date()); (d.head || d.body).appendChild(s); })();
      `}} />
    </div>
  )
}
