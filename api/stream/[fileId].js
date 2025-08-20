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

  const range = req.headers['range']
  const base = `https://drive.google.com/uc?export=download&id=${fileId}`
  try {
    let r = await fetch(base, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GDShadow/1.0)',
        ...(range ? { Range: range } : {}),
      },
      redirect: 'follow',
    })

    // Handle HTML interstitial (confirm token for large files)
    if (r.ok) {
      const ct = r.headers.get('content-type') || ''
      if (ct.includes('text/html')) {
        const html = await r.text()
        const m = html.match(/confirm=([0-9A-Za-z_]+)/)
        if (m && m[1]) {
          const confirmUrl = `${base}&confirm=${m[1]}`
          r = await fetch(confirmUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GDShadow/1.0)',
              ...(range ? { Range: range } : {}),
            },
            redirect: 'follow',
          })
        } else {
          // cannot bypass; return error
          return res.status(403).send('Consent required by Google Drive')
        }
      }
    }

    // Pass-through headers
    const pass = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'last-modified', 'etag', 'cache-control']
    pass.forEach((h) => {
      const v = r.headers.get(h)
      if (v) res.setHeader(h, v)
    })
    res.setHeader('Accept-Ranges', 'bytes')

    res.status(r.status)
    if (!r.body) return res.end()
    r.body.pipe(res)
  } catch (e) {
    res.status(502).send('Upstream error')
  }
}
