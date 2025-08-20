import { useState } from 'react'
import VideoPreview from './VideoPreview'

export default function LinkList({ items, origin, defaultEngine = 'drive', onToggleUseShadow, renderPreview }) {
  const [openId, setOpenId] = useState(null)

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  return (
    <div className="grid gap-3">
      {items.map(item => {
        const url = `${origin}/d/${item.file_id}`
        const useShadow = (item.use_shadow ?? null) === null ? (defaultEngine === 'shadow') : !!item.use_shadow
        return (
          <div key={item.id} className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <span>{item.title || 'Tanpa Judul'}</span>
                  <span className="badge">{useShadow ? 'Shadow' : 'Drive'}</span>
                </div>
                <div className="text-xs text-neutral-400 break-all">{item.original_url}</div>
                <div className="text-xs text-brand-400 break-all mt-1">{url}</div>
                <div className="flex gap-2 mt-2 text-xs text-neutral-400">
                  {item.clicks != null && <span className="badge">{item.clicks} klik</span>}
                  {item.created_at && <span className="badge">{new Date(item.created_at).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="text-xs text-neutral-400">Preview:</div>
                <button className={`btn ${!useShadow ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onToggleUseShadow?.(item, false)}>Drive</button>
                <button className={`btn ${useShadow ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onToggleUseShadow?.(item, true)}>Shadow</button>
                <button className="btn btn-ghost" onClick={() => copy(url)}>Copy Link</button>
                <button className="btn btn-ghost" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                  {openId === item.id ? 'Tutup Preview' : 'Preview'}
                </button>
                <a className="btn btn-primary" href={url} target="_blank" rel="noreferrer">Buka</a>
              </div>
            </div>
            {openId === item.id && (renderPreview ? renderPreview(item.file_id, useShadow) : (
              <div className="mt-4"><VideoPreview fileId={item.file_id} /></div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
