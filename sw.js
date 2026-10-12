const VERSION='2026-10-12-1';
const PREFIX='mascota-3d-pwa:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+VERSION;
const FILES=['./','index.html','icon.svg','manifest.webmanifest','pwa.js','style.css','living-pet.css','experience.css','adventures.css','world3d.css','art.js','experience.js','adventure-model.js','model.js','care-sessions.js','adventures.js','game.js','boot3d.js','world3d.js','three.module.js','three.core.js','THREE-LICENSE.txt','icon-192.png','icon-512.png','maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})))));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage({type:'OFFLINE_READY'});})());});
self.addEventListener('message',event=>{if(event.data?.type==='CHECK_OFFLINE')event.waitUntil(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',self.registration.scope).href)).then(response=>{if(response)event.source?.postMessage({type:'OFFLINE_READY'});}));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(event.request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(event.request)||await cache.match(new URL('index.html',scope).href)||fetch(event.request)));return;}
 event.respondWith(caches.open(CACHE).then(async cache=>{const saved=await cache.match(event.request);if(saved)return saved;return fetch(event.request);}));
});

