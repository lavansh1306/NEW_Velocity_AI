import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Diagnostic endpoint to help debug authentication issues
 * Endpoint: GET /api/diagnose
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const {step} = req.query;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (step === '1') {
    // Step 1: Check environment and cookies
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HubSpot Auth Diagnostic - Step 1</title>
        <style>
          body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
          .box { background: #252526; padding: 15px; border-radius: 4px; margin: 10px 0; border-left: 3px solid #007acc; }
          button { background: #0e639c; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-family: monospace; }
          button:hover { background: #1177bb; }
          a { color: #569cd6; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h2>Step 1: Check Cookies</h2>
        <div class="box">
          <p><strong>Current Cookies:</strong></p>
          <pre id="cookies">Loading...</pre>
          <p id="status"></p>
        </div>
        
        <div class="box">
          <p><strong>Next Step:</strong></p>
          <button onclick="window.location.href='/api/hubspot/auth/connect'">
            ➜ Click: Connect to HubSpot
          </button>
          <p style="margin-top: 10px; font-size: 12px; color: #888;">
            This should redirect you to HubSpot. After you authorize, you'll be sent to /oauth/hubspot/callback
          </p>
        </div>

        <div class="box">
          <p style="font-size: 12px; color: #888;">
            After clicking above, check cookies again and go to <a href="/api/diagnose?step=2">Step 2</a>
          </p>
        </div>

        <script>
          document.getElementById('cookies').textContent = document.cookie || '(no cookies)';
          document.getElementById('status').textContent = 'Cookies shown above ^ If empty, cookies are being blocked!';
        </script>
      </body>
      </html>
    `);
  }

  if (step === '2') {
    // Step 2: Check auth status
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HubSpot Auth Diagnostic - Step 2</title>
        <style>
          body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
          .box { background: #252526; padding: 15px; border-radius: 4px; margin: 10px 0; border-left: 3px solid #007acc; }
          .success { border-left-color: #4ec9b0; }
          .error { border-left-color: #f48771; }
          button { background: #0e639c; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-family: monospace; }
          button:hover { background: #1177bb; }
        </style>
      </head>
      <body>
        <h2>Step 2: Check Auth Status</h2>
        <div class="box">
          <p><strong>Checking authentication status...</strong></p>
          <pre id="status">Loading...</pre>
        </div>

        <div class="box">
          <button onclick="location.reload()">🔄 Refresh</button>
          <button onclick="window.location.href='/api/diagnose?step=1'">← Back to Step 1</button>
        </div>

        <script>
          fetch('/api/hubspot/auth/status', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
              const box = document.querySelector('.box');
              if (data.authenticated && data.userId) {
                box.classList.add('success');
                document.getElementById('status').textContent = JSON.stringify(data, null, 2);
                document.body.innerHTML += '<div class="box success"><h3>✓ Authentication Successful!</h3><p>You are authenticated as: ' + data.userId + '</p><p>Portal ID: ' + data.portalId + '</p></div>';
              } else {
                box.classList.add('error');
                document.getElementById('status').textContent = JSON.stringify(data, null, 2);
                document.body.innerHTML += '<div class="box error"><h3>✗ Not Authenticated</h3><p>Try the login flow again from Step 1</p></div>';
              }
            })
            .catch(err => {
              document.getElementById('status').textContent = 'Error: ' + err.message;
            });
        </script>
      </body>
      </html>
    `);
  }

  // Default: show menu
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>HubSpot Auth Diagnostic</title>
      <style>
        body { font-family: monospace; padding: 40px; background: #1e1e1e; color: #d4d4d4; max-width: 800px; margin: 0 auto; }
        h1 { color: #4ec9b0; border-bottom: 2px solid #4ec9b0; padding-bottom: 10px; }
        .box { background: #252526; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 3px solid #007acc; }
        button { background: #0e639c; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 14px; margin: 5px; }
        button:hover { background: #1177bb; }
        .warning { border-left-color: #dcdcaa; background: #32302e; }
        code { background: #1e1e1e; padding: 2px 6px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>🔐 HubSpot Auth Diagnostic</h1>
      
      <div class="box">
        <h2>Follow these steps to debug login issues:</h2>
      </div>

      <div class="box warning">
        <h3>⚠️ Common Issues</h3>
        <ul>
          <li><strong>Cookie blocked?</strong> Browser might block 3rd-party cookies</li>
          <li><strong>Redirect not working?</strong> Check redirect URI in HubSpot app</li>
          <li><strong>Session lost?</strong> Sessions don't persist across Vercel deployments</li>
        </ul>
      </div>

      <div class="box">
        <h3>Step 1: Check Cookies</h3>
        <p>View current cookies and begin the login flow</p>
        <button onclick="window.location.href='/api/diagnose?step=1'">→ Open Step 1</button>
      </div>

      <div class="box">
        <h3>Step 2: Check Auth Status</h3>
        <p>Verify if you're authenticated after the OAuth flow</p>
        <button onclick="window.location.href='/api/diagnose?step=2'">→ Open Step 2</button>
      </div>

      <div class="box">
        <h3>Direct Token (if logged in)</h3>
        <p>Get your token directly for testing</p>
        <button onclick="window.location.href='/api/hubspot/debug/token'">→ Get Token</button>
      </div>

      <div class="box warning">
        <h3>Manual Test with curl</h3>
        <p>If you have your token, test the endpoint:</p>
        <code>curl -H "x-hubspot-token: YOUR_TOKEN" https://www.joinvelocity.co/api/hubspot/ai-metrics</code>
      </div>
    </body>
    </html>
  `);
}
