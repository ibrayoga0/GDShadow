export default function handler(req, res) {
  let fileId = req.query?.fileId
  if (!fileId && req.query?.path) fileId = req.query.path.split('/').pop()
  if (!fileId || Array.isArray(fileId)) return res.status(400).send('File ID missing')
  const safe = /^[a-zA-Z0-9_-]{10,}$/
  if (!safe.test(fileId)) return res.status(400).send('Invalid file ID')
  const driveLink = `https://drive.google.com/uc?export=download&id=${fileId}`
  res.redirect(driveLink)
}
