import { Request, Response } from 'express'

export default function handler(req: Request, res: Response) {
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
