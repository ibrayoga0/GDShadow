import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })
  try {
    const { key, value } = req.body || {}
    if (!key) return res.status(400).json({ ok: false })
    const serviceUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceUrl || !serviceKey) return res.status(200).json({ ok: true })
    const supabase = createClient(serviceUrl, serviceKey)
    await supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' })
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(200).json({ ok: false })
  }
}
