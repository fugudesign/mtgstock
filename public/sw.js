// Service Worker pour Magic Stack PWA
const CACHE_NAME = "mtg-stock-v1";
const urlsToCache = [
  "/",
  "/search",
  "/collections",
  "/decks",
  "/manifest.json",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
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
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourner la ressource du cache si disponible
      if (response) {
        return response;
      }

      // Sinon, faire la requête réseau
      return fetch(event.request);
    })
  );
});
