import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { fileId } = req.query
  if (!fileId || Array.isArray(fileId)) return res.status(400).send('File ID missing')
  const safe = /^[a-zA-Z0-9_-]{10,}$/
  if (!safe.test(fileId)) return res.status(400).send('Invalid file ID')

  const driveLink = `https://drive.google.com/uc?export=download&id=${fileId}`

  // Optional click logging if service role is configured
  try {
    const serviceUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceUrl && serviceKey) {
      const supabase = createClient(serviceUrl, serviceKey)
      const referer = req.headers['referer'] || null
      const user_agent = req.headers['user-agent'] || null
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim()
      // Find link id by file_id
      const { data: link } = await supabase.from('links').select('id, clicks').eq('file_id', fileId).maybeSingle()
      if (link?.id) {
        await supabase.from('link_clicks').insert({ link_id: link.id, referer, user_agent, ip })
        await supabase.from('links').update({ clicks: (link.clicks || 0) + 1, last_clicked_at: new Date().toISOString() }).eq('id', link.id)
      }
    }
  } catch (e) {
    // don't block redirect on analytics errors
  }

  res.setHeader('Cache-Control', 'public, max-age=60')
  return res.redirect(driveLink)
}
