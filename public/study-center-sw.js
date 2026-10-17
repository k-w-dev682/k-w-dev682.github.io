// StudyLab v3.0 - offline cache for pages/resources actually visited. No automatic whole-site download.
const CACHE='studylab-v3-pages-20261017';
const PREFIX='studylab-v3-pages-';
const ROOT=new URL('./',self.registration.scope);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled([
  cache.add(new URL('centrum-nauki/',ROOT)),cache.add(new URL('',ROOT)),
  cache.add(new URL('study-center-offline.html',ROOT))
 ])));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if((key.startsWith(PREFIX)||key.startsWith('studylab-v2-pages-'))&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.cache==='no-store'||req.mode==='no-cors'||req.headers.has('range'))return;
 const url=new URL(req.url);
 if(url.pathname.includes('/.git/')||url.pathname.endsWith('study-center-sw.js'))return;
 const html=req.mode==='navigate';
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try {
   const response=await fetch(req);
   if(response.ok&&response.type==='basic'&&!/no-store/i.test(response.headers.get('Cache-Control')||'')){
    await cache.put(req,response.clone()).catch(()=>{});
   }
   return response;
  }catch(e){
   const hit=await cache.match(req,{ignoreSearch:html});
   if(hit)return hit;
   if(html)return (await cache.match(new URL('study-center-offline.html',ROOT))) || Response.error();
   throw e;
  }
 })());
});
