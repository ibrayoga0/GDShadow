import { useState } from 'react'
import VideoPreview from './VideoPreview'

export default function LinkList({ items, origin }) {
  const [openId, setOpenId] = useState(null)

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {}
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
                    <div className="font-medium">{item.title || 'Tanpa Judul'}</div>
                    {typeof item.clicks === 'number' && (
                      <div className="text-xs text-neutral-400">{item.clicks} klik</div>
                    )}
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
