#!/usr/bin/env node
// Builds docs/index.html: the app (index.html) AES-encrypted behind a password gate,
// suitable for public static hosting (GitHub Pages).
// Usage: node build.js <password>
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node build.js <password>');
  process.exit(1);
}

const ITERATIONS = 600000;
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const plaintext = '<!doctype html>\n<meta charset="utf-8">\n' + src;

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final(), cipher.getAuthTag()]);

const payload = JSON.stringify({
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: ct.toString('base64'),
  iter: ITERATIONS,
});

const gate = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rhys &amp; Elissar — Seating Plan</title>
<style>
  :root{
    --ground:#F7F4EC; --panel:#FFFFFF; --ink:#22303A; --muted:#6B7A85;
    --line:#E4DFD2; --sea:#2E6E8E; --sea-deep:#1F4F68; --coral:#C0564A;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --ground:#141B21; --panel:#1C2630; --ink:#E9E5DB; --muted:#93A3AE;
      --line:#2C3944; --sea:#71AECB; --sea-deep:#9CC8DD; --coral:#E08175;
    }
  }
  *{box-sizing:border-box}
  body{
    margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--ground); color:var(--ink);
    font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  }
  .card{
    background:var(--panel); border:1px solid var(--line); border-radius:16px;
    box-shadow:0 4px 24px rgba(34,48,58,.08); padding:36px 34px; width:min(92vw,380px);
    text-align:center;
  }
  h1{
    margin:0 0 2px; font:600 26px/1.2 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  }
  .sub{color:var(--muted); font-size:12.5px; letter-spacing:.1em; text-transform:uppercase; margin:0 0 24px}
  input{
    width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:9px;
    background:var(--ground); color:var(--ink); font:inherit; text-align:center;
  }
  input:focus{outline:2px solid var(--sea); outline-offset:1px; border-color:transparent}
  button{
    width:100%; margin-top:10px; padding:10px 12px; border:none; border-radius:9px;
    background:var(--sea); color:#fff; font:600 15px/1 inherit; font-family:inherit; cursor:pointer;
  }
  button:hover{background:var(--sea-deep)}
  .err{color:var(--coral); font-size:13px; min-height:1.4em; margin:10px 0 0}
</style>
</head>
<body>
<form class="card" id="f">
  <h1>Rhys &amp; Elissar</h1>
  <p class="sub">Seating plan · Elio Sedef</p>
  <input type="password" id="pw" placeholder="Password" autocomplete="current-password" autofocus>
  <button type="submit">Open</button>
  <p class="err" id="err"></p>
</form>
<script>
'use strict';
const DATA = ${payload};
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function decrypt(pw){
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    {name:'PBKDF2', salt:b64(DATA.salt), iterations:DATA.iter, hash:'SHA-256'},
    km, {name:'AES-GCM', length:256}, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64(DATA.iv)}, key, b64(DATA.ct));
  return new TextDecoder().decode(pt);
}
async function open(pw, remember){
  const html = await decrypt(pw); // throws on wrong password
  if(remember){ try{ localStorage.setItem('seating-gate', pw); }catch(e){} }
  document.open();
  document.write(html);
  document.close();
}
document.getElementById('f').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('err');
  err.textContent = '';
  try{ await open(document.getElementById('pw').value, true); }
  catch(ex){ err.textContent = 'That’s not it — try again.'; }
});
(async () => {
  let saved = null;
  try{ saved = localStorage.getItem('seating-gate'); }catch(e){}
  if(saved){ try{ await open(saved, false); }catch(ex){ try{ localStorage.removeItem('seating-gate'); }catch(e){} } }
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'docs', 'index.html'), gate);
console.log('Built docs/index.html (' + Math.round(gate.length / 1024) + ' KB)');
