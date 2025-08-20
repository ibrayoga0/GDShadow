import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { fileId } = req.query
  if (!fileId || Array.isArray(fileId)) return res.status(400).json({ ok: false })

  try {
    const serviceUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceUrl || !serviceKey) return res.status(200).json({ ok: true })
    const supabase = createClient(serviceUrl, serviceKey)
    const referer = req.headers['referer'] || null
    const user_agent = req.headers['user-agent'] || null
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim()
    const { data: link } = await supabase.from('links').select('id, downloads').eq('file_id', fileId).maybeSingle()
    if (link?.id) {
      await supabase.from('links').update({ downloads: (link.downloads || 0) + 1 }).eq('id', link.id)
      await supabase.from('download_logs').insert({ link_id: link.id, referer, user_agent, ip })
    }
  } catch {}
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ ok: true })
}
