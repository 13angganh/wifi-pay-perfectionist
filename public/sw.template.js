const CACHE_VERSION='wifipay-v__BUILD_HASH__';
const STATIC_CACHE=`${CACHE_VERSION}-static`;
const PAGES_CACHE=`${CACHE_VERSION}-pages`;
const STATIC_ASSETS=['/offline','/manifest.json','/favicon.ico','/apple-touch-icon.png','/icon-192.png','/icon-512.png'];

self.addEventListener('install',(event)=>{
 event.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',(event)=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>!k.includes(CACHE_VERSION)).map(k=>caches.delete(k)));
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window'});
  clients.forEach(client=>client.postMessage({type:'SW_UPDATED',version:CACHE_VERSION}));
 })());
});

self.addEventListener('message',(event)=>{
 if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',(event)=>{
 const {request}=event;
 if(request.method!=='GET') return;
 const url=new URL(request.url);
 if(url.origin!==location.origin||url.pathname==='/sw.js') return;

 event.respondWith((async()=>{
  try{
   const fresh=await fetch(request);
   if(fresh.ok){
    const cache=await caches.open(request.destination==='document'?PAGES_CACHE:STATIC_CACHE);
    cache.put(request,fresh.clone());
   }
   return fresh;
  }catch(err){
   const cached=await caches.match(request);
   if(cached) return cached;
   if(request.mode==='navigate'){
    const offline=await caches.match('/offline');
    if(offline) return offline;
   }
   return new Response('Offline',{status:503});
  }
 })())
});
