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

  const base = `https://drive.google.com/uc?export=download&id=${fileId}`
  const range = req.headers['range']
  let cookie = ''

  try {
    // First request (allow redirects). Some files require a confirm token.
    let url = base
    for (let i = 0; i < 2; i++) { // try up to 2 passes (token flow)
      const r = await fetch(url, {
        method: 'GET',
        headers: {
          ...(range ? { Range: range } : {}),
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        redirect: 'manual',
      })

      // Handle redirect
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location')
        const setCookie = r.headers.get('set-cookie')
        if (setCookie) cookie = mergeCookie(cookie, setCookie)
        if (loc) { url = new URL(loc, 'https://drive.google.com').toString(); continue }
      }

      // If HTML returned with confirm token, extract and retry
      const contentType = r.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        const html = await r.text()
        const m = html.match(/confirm=([0-9A-Za-z_\-]+)/)
        if (m?.[1]) { url = `${base}&confirm=${m[1]}`; continue }
        // Fallback: serve small HTML error
        res.status(502).send('Upstream blocked the request')
        return
      }

      // Stream response
      passHeaders(r, res)
      res.status(r.status)
      if (r.body) r.body.pipe(res)
      else res.end()
      return
    }

    // If loop exits without streaming
    return res.status(502).send('Unable to fetch from Drive')
  } catch (e) {
    return res.status(500).send('Proxy error')
  }
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
