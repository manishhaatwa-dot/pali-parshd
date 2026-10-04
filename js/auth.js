// =========================================================
// PARSHD - AUTHENTICATION MODULE
// File: js/auth.js
// =========================================================

import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


// =========================================================
// AUTH PERSISTENCE
// =========================================================

const persistenceReady =
    setPersistence(
        auth,
        browserLocalPersistence
    );


// =========================================================
// LOGIN
// =========================================================

export async function login(
    email,
    password
) {

    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();


    if (!cleanEmail) {
        throw new Error(
            "Email दर्ज करें।"
        );
    }


    if (!password) {
        throw new Error(
            "Password दर्ज करें।"
        );
    }


    try {

        // Make sure login session is saved
        // on the device/browser.
        await persistenceReady;


        const result =
            await signInWithEmailAndPassword(
                auth,
                cleanEmail,
                password
            );


        return result.user;

    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        let message =
            "Login नहीं हो सका।";


        switch (error.code) {

            case "auth/invalid-credential":

                message =
                    "Email या password गलत है।";

                break;


            case "auth/user-disabled":

                message =
                    "यह account अभी disabled है।";

                break;


            case "auth/too-many-requests":

                message =
                    "बहुत ज्यादा login attempts हुए हैं। थोड़ी देर बाद फिर प्रयास करें।";

                break;


            case "auth/network-request-failed":

                message =
                    "Internet connection check करें।";

                break;

        }


        throw new Error(message);

    }

}


// =========================================================
// LOGOUT
// =========================================================

export async function logout() {

    await signOut(auth);

}


// =========================================================
// CURRENT USER
// =========================================================

export function getCurrentUser() {

    return auth.currentUser;

}


// =========================================================
// AUTH STATE LISTENER
// =========================================================

export function watchAuthState(
    callback
) {

    return onAuthStateChanged(
        auth,
        user => {

            if (
                typeof callback ===
                "function"
            ) {

                callback(user);

            }

        }
    );

}


// =========================================================
// REQUIRE LOGIN
// =========================================================

export function requireLogin(
    redirect = "index.html"
) {

    return new Promise(
        resolve => {

            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    user => {

                        unsubscribe();


                        if (!user) {

                            window.location.href =
                                redirect;

                            return;

                        }


                        resolve(user);

                    }
                );

        }
    );

}


// =========================================================
// GET USER UID
// =========================================================

export function getUserId() {

    const user =
        auth.currentUser;


    if (!user) {
        return null;
    }


    return user.uid;

}


// =========================================================
// GLOBAL AUTH API
// =========================================================

window.ParshdAuth = {

    login,

    logout,

    getCurrentUser,

    watchAuthState,

    requireLogin,

    getUserId

};
