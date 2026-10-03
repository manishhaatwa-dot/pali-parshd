const CACHE_NAME = "parshd-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./complaint.html",
  "./track.html",

  "./manifest.json",

  "./css/style.css",
  "./css/responsive.css",

  "./js/app.js",
  "./js/firebase-config.js",
  "./js/auth.js",
  "./js/complaints.js",
  "./js/storage.js",
  "./js/profile.js",
  "./js/location.js",
  "./js/qr.js",

  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});


self.addEventListener("fetch", (event) => {
  const request = event.request;

  // केवल GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Firebase / Google CDN को cache नहीं करना
  if (
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firebaseapp.com") ||
    url.hostname.includes("firebasestorage.app") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {

      // पहले cache
      if (cachedResponse) {
        return cachedResponse;
      }

      // फिर network
      return fetch(request)
        .then((networkResponse) => {

          // केवल valid basic response cache करें
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // Offline होने पर home page
          return caches.match("./index.html");
        });
    })
  );
});
