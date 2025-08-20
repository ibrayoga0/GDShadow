import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { fileId } = req.query
  if (!fileId || Array.isArray(fileId)) return res.status(400).json({ ok: false })

  try {
    const serviceUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceUrl || !serviceKey) return res.status(200).json({ ok: true })
    const supabase = createClient(serviceUrl, serviceKey)
    const { data: link } = await supabase.from('links').select('id, views').eq('file_id', fileId).maybeSingle()
    if (link?.id) {
      await supabase.from('links').update({ views: (link.views || 0) + 1 }).eq('id', link.id)
    }
  } catch {}
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ ok: true })
}
