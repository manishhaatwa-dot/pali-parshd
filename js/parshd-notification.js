// =========================================================
// Parshd
// Firebase Cloud Messaging
// Parshad Device Notification Registration
// =========================================================

import {
    getMessaging,
    getToken,
    deleteToken
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    auth,
    db,
    app
} from "./firebase-config.js";


// =========================================================
// FCM VAPID KEY
// =========================================================

const FCM_VAPID_KEY =
    "BPJ0z3Scf3gMG30pwgODae6j3vwxGXIlWmATXKQoWM2kOIxkMnWn-XPsx2Uyxrz1zfVEleVQdQVXJMAElUcC9dw";


// =========================================================
// PARSHD TOKEN PATH
// =========================================================

const PARSHD_ROOT =
    "parshd";

const PARSHADS_COLLECTION =
    "parshads";

const PARSHAD_DATA_COLLECTION =
    "data";

const FCM_TOKENS_COLLECTION =
    "fcmTokens";


// =========================================================
// FIREBASE MESSAGING
// =========================================================

let messaging = null;

try {

    messaging =
        getMessaging(app);

} catch (error) {

    console.warn(
        "Parshd FCM messaging is not available:",
        error
    );

}


// =========================================================
// NOTIFICATION SUPPORT
// =========================================================

function isNotificationSupported() {

    return (
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        Boolean(messaging)
    );

}


// =========================================================
// REQUEST PERMISSION
// =========================================================

async function requestParshdNotificationPermission() {

    if (
        !isNotificationSupported()
    ) {

        return "unsupported";

    }


    if (
        Notification.permission ===
        "granted"
    ) {

        return "granted";

    }


    if (
        Notification.permission ===
        "denied"
    ) {

        return "denied";

    }


    try {

        return await Notification.requestPermission();

    } catch (error) {

        console.warn(
            "Parshd notification permission failed:",
            error
        );

        return "denied";

    }

}


// =========================================================
// CREATE SAFE TOKEN DOCUMENT ID
// =========================================================

async function createTokenId(token) {

    const data =
        new TextEncoder().encode(token);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );

    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");

}


// =========================================================
// SAVE FCM TOKEN
// =========================================================

async function saveParshdFcmToken(
    uid,
    token
) {

    if (!uid) {

        throw new Error(
            "Parshad UID is required."
        );

    }


    if (!token) {

        throw new Error(
            "FCM token is required."
        );

    }


    const tokenId =
        await createTokenId(token);


    const tokenRef =
        doc(
            db,
            PARSHD_ROOT,
            PARSHADS_COLLECTION,
            PARSHAD_DATA_COLLECTION,
            uid,
            FCM_TOKENS_COLLECTION,
            tokenId
        );


    await setDoc(
        tokenRef,
        {
            uid,
            token,
            platform:
                "web",
            updatedAt:
                serverTimestamp()
        },
        {
            merge: true
        }
    );


    console.log(
        "Parshd FCM token saved successfully."
    );


    return token;

}


// =========================================================
// REGISTER CURRENT PARSHAD DEVICE
// =========================================================

async function registerParshdNotification() {

    try {

        if (
            !isNotificationSupported()
        ) {

            console.warn(
                "Parshd notifications are not supported on this device."
            );

            return null;

        }


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            console.warn(
                "Parshd notification registration skipped: user not logged in."
            );

            return null;

        }


        const permission =
            await requestParshdNotificationPermission();


        if (
            permission !==
            "granted"
        ) {

            console.warn(
                "Parshd notification permission:",
                permission
            );

            return null;

        }


        // -------------------------------------------------
        // EXISTING ROOT SERVICE WORKER
        // -------------------------------------------------

        const registration =
            await navigator.serviceWorker.ready;


        if (!registration) {

            throw new Error(
                "Parshd service worker registration unavailable."
            );

        }


        // -------------------------------------------------
        // GET FCM TOKEN
        // -------------------------------------------------

        let token = null;


        try {

            token =
                await getToken(
                    messaging,
                    {
                        vapidKey:
                            FCM_VAPID_KEY,

                        serviceWorkerRegistration:
                            registration
                    }
                );

        } catch (error) {

            console.warn(
                "Parshd FCM token generation failed:",
                error
            );


            const errorText =
                String(
                    error?.message ||
                    error ||
                    ""
                ).toLowerCase();


            // ---------------------------------------------
            // ONE RECOVERY ATTEMPT
            // ---------------------------------------------

            if (
                errorText.includes(
                    "registration"
                )
                ||
                errorText.includes(
                    "token-subscribe"
                )
                ||
                errorText.includes(
                    "too-many"
                )
            ) {

                try {

                    await deleteToken(
                        messaging
                    );


                    token =
                        await getToken(
                            messaging,
                            {
                                vapidKey:
                                    FCM_VAPID_KEY,

                                serviceWorkerRegistration:
                                    registration
                            }
                        );

                } catch (retryError) {

                    console.error(
                        "Parshd FCM recovery failed:",
                        retryError
                    );

                    return null;

                }

            } else {

                return null;

            }

        }


        if (!token) {

            console.warn(
                "Firebase did not return a Parshd FCM token."
            );

            return null;

        }


        // -------------------------------------------------
        // SAVE TOKEN
        // -------------------------------------------------

        await saveParshdFcmToken(
            currentUser.uid,
            token
        );


        console.log(
            "Parshd notification device registered."
        );


        return token;

    } catch (error) {

        console.error(
            "Parshd notification registration error:",
            error
        );

        return null;

    }

}


// =========================================================
// EXPORT
// =========================================================

export {
    FCM_VAPID_KEY,
    isNotificationSupported,
    requestParshdNotificationPermission,
    saveParshdFcmToken,
    registerParshdNotification
};
