// =====================================================
// PARSHD + ZENG CHAT FIREBASE CONFIG
// =====================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    getStorage
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCes4Ir1Q_QHpLlhCqAPWKLMpA9Zez6cyY",

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

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);


// =====================================================
// SERVICES
// =====================================================

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);


// =====================================================
// APP
// =====================================================

export { app };
