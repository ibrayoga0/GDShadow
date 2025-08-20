import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const serviceUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceUrl || !serviceKey) return res.status(200).json({ settings: {} })
    const supabase = createClient(serviceUrl, serviceKey)
    const { data, error } = await supabase.from('app_settings').select('key,value')
    if (error) return res.status(200).json({ settings: {} })
    const map = Object.fromEntries((data||[]).map(r => [r.key, r.value]))
    return res.status(200).json({ settings: map })
  } catch {
    return res.status(200).json({ settings: {} })
  }
}
