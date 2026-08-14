const CACHE="mma-manager-shell-v29";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim())
));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const u=new URL(e.request.url);
  if(e.request.mode==="navigate" || e.request.destination==="document" || u.pathname.endsWith(".html")){
    e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match("./index.html")));
  }else{
    e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request)));
  }
});
