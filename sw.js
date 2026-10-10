// VET Heat – offline cache. Bij een update: verhoog het versienummer hieronder.
const V='vh-v7';
const FILES=['./','index.html','attest-engine.js','pdf-lib.min.js','manifest.webmanifest','logo.png','logo-app.png','icon-192.png','icon-512.png','apple-touch-icon.png','schouw-types.js','reinigingsattest.pdf','verbrandingsattest.pdf'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{const net=fetch(e.request).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit);return hit||net}))});
