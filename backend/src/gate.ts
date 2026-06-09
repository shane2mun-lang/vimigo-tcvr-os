// Single-password gate. Active only when SITE_PASSWORD is set (the public deploy).
// Serves a small password page; on the correct password it sets a signed-ish cookie
// (sha256 of the password, never the raw value) good for 30 days. No extra deps.

import { createHash } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const COOKIE = 'tcvr_gate'

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function passwordGate(password: string) {
  const token = createHash('sha256').update('tcvr-gate:' + password).digest('hex').slice(0, 40)

  return (req: Request, res: Response, next: NextFunction): void => {
    const cookies = parseCookies(req.headers.cookie)
    if (cookies[COOKIE] === token) {
      next()
      return
    }
    if (req.method === 'POST' && req.path === '/__gate') {
      const pw = String((req.body as { password?: unknown })?.password ?? '')
      if (pw === password) {
        res.setHeader(
          'Set-Cookie',
          `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
        )
        res.json({ ok: true })
        return
      }
      res.status(401).json({ ok: false })
      return
    }
    res.status(401).type('html').send(GATE_PAGE)
  }
}

const GATE_PAGE = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>vimigo TCVR Revenue OS</title>
<style>
  *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,'Noto Sans SC',sans-serif;
    background:linear-gradient(135deg,#eef2ff,#fff);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#0f172a}
  .card{width:100%;max-width:360px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;
    box-shadow:0 10px 40px rgba(15,23,42,.08);padding:28px 26px;text-align:center}
  .logo{width:44px;height:44px;border-radius:12px;background:#6366f1;color:#fff;font-weight:800;
    display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:20px}
  h1{font-size:16px;margin:0 0 4px} p{font-size:13px;color:#64748b;margin:0 0 18px}
  input{width:100%;padding:11px 13px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;outline:none}
  input:focus{border-color:#6366f1;box-shadow:0 0 0 3px #e0e7ff}
  button{width:100%;margin-top:12px;padding:11px;border:0;border-radius:10px;background:#6366f1;color:#fff;
    font-size:14px;font-weight:600;cursor:pointer}button:hover{background:#4f46e5}
  .err{color:#dc2626;font-size:12px;margin-top:10px;min-height:16px}
</style></head>
<body>
  <form class="card" onsubmit="return go(event)">
    <div class="logo">V</div>
    <h1>vimigo TCVR Revenue OS</h1>
    <p>请输入密码访问 · Enter password to continue</p>
    <input id="pw" type="password" autocomplete="current-password" placeholder="Password" autofocus/>
    <button type="submit">进入 / Enter</button>
    <div class="err" id="err"></div>
  </form>
  <script>
    async function go(e){e.preventDefault();
      const pw=document.getElementById('pw').value;const err=document.getElementById('err');err.textContent='';
      try{const r=await fetch('/__gate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
        if(r.ok){location.reload();}else{err.textContent='密码错误 · Wrong password';}}catch(_){err.textContent='Error, try again';}
      return false;}
  </script>
</body></html>`
