// Milestown service worker: werkt offline en toont de rustige meldingen
const CACHE = "milestown-v1";
const SHELL = ["./", "./index.html", "./config.js", "./vendor/supabase.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// de app zelf: eerst het netwerk (zodat updates meteen binnenkomen), offline uit de cache
// lettertypes en bibliotheken: uit de cache, op de achtergrond bijgewerkt
self.addEventListener("fetch", event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const same = url.origin === self.location.origin, fonts = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (!same && !fonts) return;
  if (req.mode === "navigate" || (same && /\/(index\.html|config\.js)?$/.test(url.pathname))) {
    event.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});

// één rustig berichtje: geen getal, alleen een kleine tril
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || "Milestown", {
    body: data.body || "Een toekomstige inwoner zegt hoi. Geen haast!",
    icon: "icons/icon-192.png",
    tag: data.tag || "milestown",
    vibrate: [60],
    data: { url: "./?telefoon=1" },
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) { c.postMessage({ open: "phone" }); return c.focus(); } }
    return self.clients.openWindow(event.notification.data && event.notification.data.url || "./");
  }));
});
