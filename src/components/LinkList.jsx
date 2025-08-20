import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import VideoPreview from './VideoPreview'

export default function LinkList({ items, origin }) {
  const [openId, setOpenId] = useState(null)
  const [busy, setBusy] = useState(null)

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  const regen = async (fileId) => {
    try {
      setBusy(fileId)
      const r = await fetch(`/api/meta/${fileId}`)
      const data = await r.json()
      const patch = {}
      if (data?.poster) patch.poster_url = data.poster
      if (data?.name) patch.title = data.name
      if (Object.keys(patch).length>0) {
        await supabase.from('links').update(patch).eq('file_id', fileId)
      }
    } finally {
      setBusy(null)
      // soft refresh
      try { location.reload() } catch {}
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-neutral-400">
          <tr className="border-b border-neutral-800">
            <th className="text-left p-3">Judul</th>
            <th className="text-left p-3">Drive URL</th>
            <th className="text-left p-3">GD Link</th>
            <th className="text-left p-3">Tanggal</th>
            <th className="text-right p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const url = `${origin}/d/${item.file_id}`
            return (
              <>
                <tr key={item.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                  <td className="p-3 align-top">
                    <div className="flex items-start gap-3">
                      {item.poster_url && (
                        <img src={item.poster_url} alt="thumb" className="w-16 h-10 rounded object-cover border border-neutral-800" loading="lazy" />
                      )}
                      <div>
                        <div className="font-medium">{item.title || 'Tanpa Judul'}</div>
                        {typeof item.clicks === 'number' && (
                          <div className="text-xs text-neutral-400">{item.clicks} klik</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-top text-xs text-neutral-400 break-all">{item.original_url}</td>
                  <td className="p-3 align-top text-xs text-brand-400 break-all">{url}</td>
                  <td className="p-3 align-top text-xs text-neutral-400">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="p-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost h-8 px-3" onClick={() => copy(url)}>Copy</button>
                      <button className="btn btn-ghost h-8 px-3" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                        {openId === item.id ? 'Tutup' : 'Preview'}
                      </button>
                      <button className="btn btn-ghost h-8 px-3" onClick={() => regen(item.file_id)} disabled={busy===item.file_id}>{busy===item.file_id?'...':'Regen Poster'}</button>
                      <a className="btn btn-primary h-8 px-3" href={url} target="_blank" rel="noreferrer">Buka</a>
                    </div>
                  </td>
                </tr>
                {openId === item.id && (
                  <tr className="border-b border-neutral-900">
                    <td className="p-3" colSpan={5}>
                      <VideoPreview fileId={item.file_id} />
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
