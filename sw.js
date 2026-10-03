const CACHE_NAME = "parshd-v1";

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
  "./js/qr.js"
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

  // केवल GET requests को handle करें
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {

      // पहले cache से
      if (cachedResponse) {
        return cachedResponse;
      }

      // नहीं मिला तो network से
      return fetch(request)
        .then((networkResponse) => {

          // केवल valid response cache करें
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
          // Network बंद होने पर home page
          return caches.match("./index.html");
        });
    })
  );
});