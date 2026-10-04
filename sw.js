const CACHE_NAME = "parshd-v3";

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


// =========================================================
// INSTALL
// =========================================================

self.addEventListener("install", (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();

});


// =========================================================
// ACTIVATE
// =========================================================

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


// =========================================================
// FETCH
// =========================================================

self.addEventListener("fetch", (event) => {

  const request = event.request;


  // केवल GET
  if (request.method !== "GET") {
    return;
  }


  const url =
    new URL(request.url);


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


  /*
   * IMPORTANT:
   *
   * complaint.html और complaints.js को हमेशा
   * network से latest version लेने की कोशिश करेंगे.
   *
   * इससे Complaint ON/OFF वाला नया code
   * पुराने PWA cache में फंसा नहीं रहेगा.
   */

  const pathname =
    url.pathname;


  const isComplaintFile =
    pathname.endsWith("/complaint.html") ||
    pathname.endsWith("/js/complaints.js");


  if (isComplaintFile) {

    event.respondWith(

      fetch(request, {
        cache: "no-store"
      })
      .then((networkResponse) => {

        if (
          networkResponse &&
          networkResponse.status === 200
        ) {

          const responseClone =
            networkResponse.clone();


          caches.open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                request,
                responseClone
              );

            });

        }


        return networkResponse;

      })
      .catch(() => {

        /*
         * Internet unavailable होने पर
         * cached version fallback.
         */

        return caches.match(request);

      })

    );

    return;

  }


  // =======================================================
  // बाकी files: cache first
  // =======================================================

  event.respondWith(

    caches.match(request)
      .then((cachedResponse) => {

        if (cachedResponse) {
          return cachedResponse;
        }


        return fetch(request)
          .then((networkResponse) => {

            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {

              const responseClone =
                networkResponse.clone();


              caches.open(CACHE_NAME)
                .then((cache) => {

                  cache.put(
                    request,
                    responseClone
                  );

                });

            }


            return networkResponse;

          })
          .catch(() => {

            return caches.match(
              "./index.html"
            );

          });

      })

  );

});
