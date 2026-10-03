// =========================================================
// PARSHD - FIREBASE CONFIGURATION
// File: js/firebase-config.js
// =========================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { getStorage } from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {
    apiKey: "AIzaSyCes4Ir1Q_QHpLlhCqAPWKLMpA9Zez6cyY",
    authDomain: "zeng-chatt.firebaseapp.com",
    databaseURL: "https://zeng-chatt-default-rtdb.firebaseio.com",
    projectId: "zeng-chatt",
    storageBucket: "zeng-chatt.firebasestorage.app",
    messagingSenderId: "1042057290439",
    appId: "1:1042057290439:web:878dcee41e24fdcbdd94e2"
};


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

const app = initializeApp(firebaseConfig);


// =========================================================
// FIREBASE SERVICES
// =========================================================

const db = getFirestore(app);

const storage = getStorage(app);

const auth = getAuth(app);


// =========================================================
// EXPORT SERVICES
// =========================================================

export {
    app,
    db,
    storage,
    auth
};