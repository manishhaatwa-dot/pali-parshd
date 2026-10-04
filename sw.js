// =========================================================
// Parshd
// Service Worker
// PWA Cache + Firebase Cloud Messaging
// =========================================================


// =========================================================
// FIREBASE CLOUD MESSAGING
// =========================================================

importScripts(
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js"
);


// =========================================================
// FIREBASE CONFIG
// =========================================================

firebase.initializeApp({

    apiKey:
        "AIzaSyCes4Ir1Q_QHpLlhcQAPWKLMpA9zEZ6cyY",

    authDomain:
        "zeng-chatt.firebaseapp.com",

    databaseURL:
        "https://zeng-chatt-default-rtdb.firebaseio.com",

    projectId:
        "zeng-chatt",

    storageBucket:
        "zeng-chatt.firebasestorage.app",

    messagingSenderId:
        "1042057290439",

    appId:
        "1:1042057290439:web:878dcee41e24fdcbdd94e2"

});


// =========================================================
// FIREBASE MESSAGING
// =========================================================

const parshdMessaging =
    firebase.messaging();


// =========================================================
// BACKGROUND NOTIFICATION
// =========================================================

parshdMessaging.onBackgroundMessage(
    (payload) => {

        console.log(
            "Parshd background notification:",
            payload
        );


        const notification =
            payload.notification || {};


        const data =
            payload.data || {};


        const title =
            notification.title ||
            "नई शिकायत प्राप्त हुई";


        const body =
            notification.body ||
            "Parshd में नई शिकायत प्राप्त हुई है।";


        const icon =
            notification.icon ||
            "./assets/icons/icon-192.png";


        const notificationOptions = {

            body,

            icon,

            badge:
                notification.badge ||
                icon,

            data: {

                type:
                    data.type ||
                    "parshd_new_complaint",

                complaintId:
                    data.complaintId ||
                    "",

                publicComplaintId:
                    data.publicComplaintId ||
                    "",

                wardNumber:
                    data.wardNumber ||
                    ""

            },

            tag:
                data.complaintId
                    ? `parshd-${data.complaintId}`
                    : "parshd-new-complaint",

            renotify: true

        };


        return self.registration.showNotification(
            title,
            notificationOptions
        );

    }
);


// =========================================================
// CACHE
// =========================================================

const CACHE_NAME =
    "parshd-v5";


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

    "./js/parshd-notifications.js",

    "./assets/icons/icon-192.png",

    "./assets/icons/icon-512.png"

];


// =========================================================
// INSTALL
// =========================================================

self.addEventListener(
    "install",
    (event) => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    (cache) =>
                        cache.addAll(
                            APP_SHELL
                        )
                )

        );

        self.skipWaiting();

    }
);


// =========================================================
// ACTIVATE
// =========================================================

self.addEventListener(
    "activate",
    (event) => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    (cacheNames) =>
                        Promise.all(

                            cacheNames
                                .filter(
                                    (name) =>
                                        name !==
                                        CACHE_NAME
                                )
                                .map(
                                    (name) =>
                                        caches.delete(
                                            name
                                        )
                                )

                        )
                )

        );

        self.clients.claim();

    }
);


// =========================================================
// NOTIFICATION CLICK
// =========================================================

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();


        const data =
            event.notification.data || {};


        const complaintId =
            data.complaintId || "";


        const targetUrl =
            complaintId
                ? `/admin/complaints.html?complaint=${encodeURIComponent(complaintId)}`
                : "/admin/dashboard.html";


        event.waitUntil(

            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(
                    (clientList) => {

                        for (
                            const client
                            of clientList
                        ) {

                            if (
                                "focus" in client
                            ) {

                                client.navigate(
                                    targetUrl
                                );

                                return client.focus();

                            }

                        }


                        if (
                            clients.openWindow
                        ) {

                            return clients.openWindow(
                                targetUrl
                            );

                        }

                        return null;

                    }
                )

        );

    }
);


// =========================================================
// FETCH
// =========================================================

self.addEventListener(
    "fetch",
    (event) => {

        const request =
            event.request;


        if (
            request.method !==
            "GET"
        ) {

            return;

        }


        const url =
            new URL(
                request.url
            );


        // ---------------------------------------------------
        // FIREBASE / GOOGLE REQUESTS
        // ---------------------------------------------------

        if (

            url.hostname.includes(
                "firebaseio.com"
            )

            ||

            url.hostname.includes(
                "firebaseapp.com"
            )

            ||

            url.hostname.includes(
                "firebasestorage.app"
            )

            ||

            url.hostname.includes(
                "googleapis.com"
            )

            ||

            url.hostname.includes(
                "gstatic.com"
            )

        ) {

            return;

        }


        // ---------------------------------------------------
        // ADMIN / JS FILES
        // ---------------------------------------------------

        const pathname =
            url.pathname;


        const isAdminOrJsFile =
            pathname.includes(
                "/admin/"
            )
            ||
            pathname.includes(
                "/js/"
            );


        if (
            isAdminOrJsFile
        ) {

            event.respondWith(

                fetch(
                    request,
                    {
                        cache:
                            "no-store"
                    }
                )

                    .then(
                        (networkResponse) => {

                            if (
                                networkResponse &&
                                networkResponse.status ===
                                200
                            ) {

                                const responseClone =
                                    networkResponse.clone();


                                caches
                                    .open(
                                        CACHE_NAME
                                    )
                                    .then(
                                        (cache) =>
                                            cache.put(
                                                request,
                                                responseClone
                                            )
                                    );

                            }


                            return networkResponse;

                        }
                    )

                    .catch(
                        () =>
                            caches.match(
                                request
                            )
                    )

            );

            return;

        }


        // ---------------------------------------------------
        // COMPLAINT FILES
        // ---------------------------------------------------

        const isComplaintFile =

            pathname.endsWith(
                "/complaint.html"
            )

            ||

            pathname.endsWith(
                "/js/complaints.js"
            );


        if (
            isComplaintFile
        ) {

            event.respondWith(

                fetch(
                    request,
                    {
                        cache:
                            "no-store"
                    }
                )

                    .then(
                        (networkResponse) => {

                            if (
                                networkResponse &&
                                networkResponse.status ===
                                200
                            ) {

                                const responseClone =
                                    networkResponse.clone();


                                caches
                                    .open(
                                        CACHE_NAME
                                    )
                                    .then(
                                        (cache) =>
                                            cache.put(
                                                request,
                                                responseClone
                                            )
                                    );

                            }


                            return networkResponse;

                        }
                    )

                    .catch(
                        () =>
                            caches.match(
                                request
                            )
                    )

            );

            return;

        }


        // ---------------------------------------------------
        // NORMAL REQUESTS
        // ---------------------------------------------------

        event.respondWith(

            caches
                .match(
                    request
                )
                .then(
                    (cachedResponse) => {

                        if (
                            cachedResponse
                        ) {

                            return cachedResponse;

                        }


                        return fetch(
                            request
                        )

                            .then(
                                (networkResponse) => {

                                    if (

                                        networkResponse &&

                                        networkResponse.status ===
                                        200 &&

                                        networkResponse.type ===
                                        "basic"

                                    ) {

                                        const responseClone =
                                            networkResponse.clone();


                                        caches
                                            .open(
                                                CACHE_NAME
                                            )
                                            .then(
                                                (cache) =>
                                                    cache.put(
                                                        request,
                                                        responseClone
                                                    )
                                            );

                                    }


                                    return networkResponse;

                                }
                            )

                            .catch(
                                () =>
                                    caches.match(
                                        "./index.html"
                                    )
                            );

                    }
                )

        );

    }
);
