// Service Worker pour Magic Stack PWA
const CACHE_NAME = "mtg-stock-v2"; // Changé pour forcer l'update
const urlsToCache = [
  "/manifest.json",
  // Ne pas cacher les pages HTML pour éviter les problèmes d'hydratation
];

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle immédiatement
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  // Ne PAS cacher les pages HTML - laisser Next.js gérer
  if (
    event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html")
  ) {
    return; // Laisse passer la requête réseau
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
