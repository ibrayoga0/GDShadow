import { Readable } from 'stream'

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const { fileId } = req.query || {}
  if (!fileId || Array.isArray(fileId)) return res.status(400).send('File ID missing')
  const safe = /^[a-zA-Z0-9_-]{10,}$/
  if (!safe.test(fileId)) return res.status(400).send('Invalid file ID')

  // Removed: Shadow Player streaming proxy
}

function passHeaders(r, res) {
  const pass = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'last-modified', 'etag', 'cache-control']
  pass.forEach((h) => {
    const v = r.headers.get(h)
    if (v) res.setHeader(h, v)
  })
  res.setHeader('Accept-Ranges', 'bytes')
}

function mergeCookie(existing, setCookie) {
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie]
  const kv = parts.map(s => s.split(';')[0]).filter(Boolean)
  const map = new Map()
  if (existing) existing.split(';').forEach(p => { const [k, ...v] = p.trim().split('='); if (k) map.set(k, v.join('=')) })
  kv.forEach(p => { const [k, ...v] = p.trim().split('='); if (k) map.set(k, v.join('=')) })
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}
