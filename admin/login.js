// =====================================================
// PARSHD ADMIN LOGIN
// Firebase Authentication
// =====================================================

import {
    auth,
    db
} from "../js/firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// =====================================================
// FIRESTORE PATH
// =====================================================

const PARSHADS_PATH = [
    "parshd",
    "parshads",
    "data"
];


// =====================================================
// ELEMENTS
// =====================================================

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton") ||
    document.querySelector(
        'button[type="submit"]'
    );


// =====================================================
// MESSAGE ELEMENT
// =====================================================

const message =
    document.getElementById("message") ||
    document.getElementById("loginMessage") ||
    document.getElementById("errorMessage") ||
    document.getElementById("successMessage");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    type = "error"
) {

    if (!message) {

        alert(text);

        return;

    }

    message.textContent =
        text;

    message.style.display =
        "block";


    if (type === "success") {

        message.style.background =
            "#dcfce7";

        message.style.color =
            "#166534";

    }

    else {

        message.style.background =
            "#fee2e2";

        message.style.color =
            "#991b1b";

    }

}


// =====================================================
// HIDE MESSAGE
// =====================================================

function hideMessage() {

    if (message) {

        message.style.display =
            "none";

    }

}


// =====================================================
// GET PARSHAD RECORD
// =====================================================

async function getParshadRecord(uid) {

    const ref =
        doc(
            db,
            ...PARSHADS_PATH,
            uid
        );


    const snap =
        await getDoc(ref);


    if (!snap.exists()) {

        return null;

    }


    return {
        id: snap.id,
        ...snap.data()
    };

}


// =====================================================
// FIREBASE ERROR MESSAGE
// =====================================================

function firebaseErrorMessage(error) {

    console.error(
        "LOGIN ERROR:",
        error
    );


    switch (error.code) {

        case "auth/invalid-credential":

            return "Email ya password galat hai.";


        case "auth/invalid-login-credentials":

            return "Email ya password galat hai.";


        case "auth/user-not-found":

            return "Is email se koi Parshad account nahi mila.";


        case "auth/wrong-password":

            return "Password galat hai.";


        case "auth/invalid-email":

            return "Email address galat hai.";


        case "auth/too-many-requests":

            return "Bahut baar login try hua hai. Thodi der baad try karein.";


        case "auth/network-request-failed":

            return "Internet connection check karein.";


        case "auth/user-disabled":

            return "Ye Firebase account disabled hai.";


        case "permission-denied":

            return "Firestore permission denied. Firebase rules check karni hongi.";


        default:

            return (
                error.message ||
                "Login nahi ho paya."
            );

    }

}


// =====================================================
// LOGIN USER
// =====================================================

async function loginUser() {

    if (!emailInput || !passwordInput) {

        console.error(
            "Email/password input nahi mila."
        );

        return;

    }


    const email =
        emailInput.value
            .trim()
            .toLowerCase();

    const password =
        passwordInput.value;


    // =================================================
    // VALIDATION
    // =================================================

    if (!email) {

        showMessage(
            "Email enter karein."
        );

        emailInput.focus();

        return;

    }


    if (!password) {

        showMessage(
            "Password enter karein."
        );

        passwordInput.focus();

        return;

    }


    // =================================================
    // BUTTON LOADING
    // =================================================

    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.dataset.oldText =
            loginButton.textContent;

        loginButton.textContent =
            "Logging in...";

    }


    hideMessage();


    try {

        // =================================================
        // STEP 1
        // FIREBASE AUTH LOGIN
        // =================================================

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        console.log(
            "Firebase login successful:",
            user.uid
        );


        // =================================================
        // STEP 2
        // EMAIL VERIFICATION
        // =================================================

        if (!user.emailVerified) {

            showMessage(
                "Email verify nahi hua hai. Apne Inbox/Spam me Firebase verification email check karein."
            );


            await signOut(auth);

            return;

        }


        // =================================================
        // STEP 3
        // PARSHAD FIRESTORE RECORD
        // =================================================

        let account;


        try {

            account =
                await getParshadRecord(
                    user.uid
                );

        }

        catch (firestoreError) {

            console.error(
                "PARSHAD RECORD ERROR:",
                firestoreError
            );


            await signOut(auth);


            showMessage(
                "Login hua, lekin Parshad account data read nahi ho pa raha. Firestore Rules check karein."
            );


            return;

        }


        // =================================================
        // ACCOUNT NOT FOUND
        // =================================================

        if (!account) {

            await signOut(auth);


            showMessage(
                "Firebase login ho gaya, lekin Parshad account record nahi mila."
            );


            return;

        }


        console.log(
            "Parshad account:",
            account
        );


        // =================================================
        // APPROVAL CHECK
        // =================================================

        if (
            account.status !==
            "approved"
        ) {

            await signOut(auth);


            if (
                account.status ===
                "pending"
            ) {

                showMessage(
                    "Aapka Parshad account abhi Manager approval ke liye pending hai."
                );

            }

            else if (
                account.status ===
                "rejected"
            ) {

                showMessage(
                    "Aapka Parshad registration reject kiya gaya hai."
                );

            }

            else {

                showMessage(
                    "Parshad account approved nahi hai."
                );

            }


            return;

        }


        // =================================================
        // APPROVED FLAG CHECK
        // =================================================

        if (
            account.approved !==
            true
        ) {

            await signOut(auth);


            showMessage(
                "Parshad account ka approval complete nahi hai."
            );


            return;

        }


        // =================================================
        // LOGIN SUCCESS
        // =================================================

        showMessage(
            "Login successful. Dashboard open ho raha hai...",
            "success"
        );


        console.log(
            "PARSHD LOGIN SUCCESS"
        );


        // =================================================
        // AUTH STATE SETTLE
        // =================================================

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );


        // =================================================
        // OPEN DASHBOARD
        // =================================================

        window.location.href =
            "./dashboard.html";

    }

    catch (error) {

        console.error(
            "COMPLETE LOGIN ERROR:",
            error
        );


        // =================================================
        // CLEAN AUTH SESSION
        // =================================================

        try {

            await signOut(
                auth
            );

        }

        catch (_) {}


        showMessage(
            firebaseErrorMessage(
                error
            )
        );

    }

    finally {

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                loginButton.dataset.oldText ||
                "Login";

        }

    }

}


// =====================================================
// FORGOT PASSWORD
// =====================================================

async function forgotPassword() {

    if (!emailInput) {

        return;

    }


    const email =
        emailInput.value
            .trim()
            .toLowerCase();


    if (!email) {

        showMessage(
            "Pehle email enter karein."
        );

        emailInput.focus();

        return;

    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        showMessage(
            "Password reset email bhej diya gaya hai. Inbox aur Spam/Junk check karein.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "PASSWORD RESET ERROR:",
            error
        );


        showMessage(
            firebaseErrorMessage(
                error
            )
        );

    }

}


// =====================================================
// PARSHAD LOGOUT
// =====================================================

async function parshadLogout() {

    try {

        await signOut(
            auth
        );


        window.location.replace(
            "./index.html"
        );

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    }

}


// =====================================================
// FORGOT PASSWORD BUTTON
// =====================================================

const forgotButton =
    document.getElementById(
        "forgotPassword"
    ) ||
    document.querySelector(
        '[data-action="forgot-password"]'
    );


if (forgotButton) {

    forgotButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            forgotPassword();

        }
    );

}


// =====================================================
// LOGIN BUTTON
// =====================================================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            loginUser();

        }
    );

}


// =====================================================
// FORM SUBMIT
// =====================================================

const loginForm =
    document.querySelector(
        "form"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            loginUser();

        }
    );

}


// =====================================================
// ENTER KEY
// =====================================================

if (passwordInput) {

    passwordInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                loginUser();

            }

        }
    );

}


// =====================================================
// EXPORTS
// Dashboard / Profile can use these
// =====================================================

export {
    loginUser,
    getParshadRecord,
    parshadLogout
};
