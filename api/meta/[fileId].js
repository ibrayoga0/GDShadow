export default async function handler(req, res) {
  try {
    const { fileId } = req.query || {}
    if (!fileId || Array.isArray(fileId)) return res.status(400).json({ error: 'File ID missing' })
    const safe = /^[a-zA-Z0-9_-]{10,}$/
    if (!safe.test(fileId)) return res.status(400).json({ error: 'Invalid file ID' })

    const url = `https://drive.google.com/file/d/${fileId}/view`
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GDShadow/1.0)' } })
    if (!r.ok) return res.status(502).json({ error: 'Failed to fetch metadata' })
    const html = await r.text()

    // Extract <title>FileName - Google Drive</title>
    const m = html.match(/<title>([^<]+)<\/title>/i)
    let name = m?.[1]?.trim() || ''
    name = name.replace(/\s*[–-]\s*Google Drive\s*$/i, '').trim()
    if (!name) name = `Drive File ${fileId}`

  // Prefer Google Drive thumbnail endpoint; fallback to og:image if present
  let poster = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  if (og?.[1]) poster = og[1]
  const preview = `https://drive.google.com/file/d/${fileId}/preview`

    res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.status(200).json({ name, poster, preview })
  } catch (e) {
    return res.status(500).json({ error: 'Metadata error' })
  }
}
