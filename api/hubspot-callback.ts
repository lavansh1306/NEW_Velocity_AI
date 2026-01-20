import { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Debug Callback] Received request to /oauth/hubspot/callback', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      host: req.headers.host,
      referer: req.headers.referer,
      origin: req.headers.origin,
    }
  })

  res.status(200).json({
    ok: true,
    message: 'Debug: callback reached',
    query: req.query
  })
}
