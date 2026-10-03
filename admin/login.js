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
    sendPasswordResetEmail,
    onAuthStateChanged
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

const message =
    document.getElementById("message") ||
    document.getElementById("loginMessage") ||
    document.getElementById("errorMessage") ||
    document.getElementById("successMessage");


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    text,
    type = "error"
) {

    if (!message) {

        console.log(text);

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

    } else {

        message.style.background =
            "#fee2e2";

        message.style.color =
            "#991b1b";

    }

}


function hideMessage() {

    if (message) {

        message.style.display =
            "none";

    }

}


// =====================================================
// GET PARSHAD FIRESTORE RECORD
// =====================================================

async function getParshadRecord(uid) {

    if (!uid) {

        return null;

    }

    const ref =
        doc(
            db,
            ...PARSHADS_PATH,
            uid
        );

    const snapshot =
        await getDoc(ref);

    if (!snapshot.exists()) {

        return null;

    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };

}


// =====================================================
// CHECK APPROVED PARSHAD
// =====================================================

async function isApprovedParshad(user) {

    if (!user) {

        return false;

    }

    // Email verification required
    if (!user.emailVerified) {

        return false;

    }

    const account =
        await getParshadRecord(
            user.uid
        );

    if (!account) {

        return false;

    }

    return (
        account.status === "approved" &&
        account.approved === true
    );

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

            return "Firestore permission denied. Firebase Rules check karein.";


        case "failed-precondition":

            return "Firebase configuration check karein.";


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
        // FIREBASE AUTH
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
                "Email verify nahi hua hai. Inbox/Spam me Firebase verification email check karein."
            );


            await signOut(
                auth
            );

            return;

        }


        // =================================================
        // STEP 3
        // FIRESTORE PARSHAD RECORD
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


            await signOut(
                auth
            );


            showMessage(
                "Login hua, lekin Parshad account data read nahi ho pa raha. Firestore Rules check karein."
            );


            return;

        }


        // =================================================
        // ACCOUNT NOT FOUND
        // =================================================

        if (!account) {

            await signOut(
                auth
            );


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

            await signOut(
                auth
            );


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
        // APPROVED FLAG
        // =================================================

        if (
            account.approved !==
            true
        ) {

            await signOut(
                auth
            );


            showMessage(
                "Parshad account ka approval complete nahi hai."
            );


            return;

        }


        // =================================================
        // SUCCESS
        // =================================================

        showMessage(
            "Login successful. Dashboard open ho raha hai...",
            "success"
        );


        console.log(
            "PARSHD LOGIN SUCCESS"
        );


        // Firebase auth state ko settle hone ka time
        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );


        window.location.replace(
            "./dashboard.html"
        );

    }

    catch (error) {

        console.error(
            "COMPLETE LOGIN ERROR:",
            error
        );


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
// REQUIRE PARSHAD LOGIN
// Dashboard / Profile ke liye
// =====================================================

async function requireParshadLogin(
    redirectPath = "./index.html"
) {

    return new Promise(
        resolve => {

            let finished = false;

            const finish = (
                result
            ) => {

                if (finished) {

                    return;

                }

                finished = true;

                unsubscribe();

                resolve(result);

            };


            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    async user => {

                        try {

                            // =================================
                            // USER LOGIN NAHI HAI
                            // =================================

                            if (!user) {

                                console.log(
                                    "No Firebase user found."
                                );


                                window.location.replace(
                                    redirectPath
                                );


                                finish(
                                    false
                                );

                                return;

                            }


                            console.log(
                                "Auth user found:",
                                user.uid
                            );


                            // =================================
                            // EMAIL VERIFICATION
                            // =================================

                            if (
                                !user.emailVerified
                            ) {

                                console.log(
                                    "Email is not verified."
                                );


                                await signOut(
                                    auth
                                );


                                window.location.replace(
                                    redirectPath
                                );


                                finish(
                                    false
                                );

                                return;

                            }


                            // =================================
                            // FIRESTORE PARSHAD RECORD
                            // =================================

                            let account;

                            try {

                                account =
                                    await getParshadRecord(
                                        user.uid
                                    );

                            }

                            catch (error) {

                                console.error(
                                    "PARSHAD RECORD READ ERROR:",
                                    error
                                );


                                await signOut(
                                    auth
                                );


                                window.location.replace(
                                    redirectPath
                                );


                                finish(
                                    false
                                );

                                return;

                            }


                            // =================================
                            // RECORD NOT FOUND
                            // =================================

                            if (!account) {

                                console.log(
                                    "Parshad record not found."
                                );


                                await signOut(
                                    auth
                                );


                                window.location.replace(
                                    redirectPath
                                );


                                finish(
                                    false
                                );

                                return;

                            }


                            // =================================
                            // APPROVAL CHECK
                            // =================================

                            if (
                                account.status !==
                                    "approved" ||
                                account.approved !==
                                    true
                            ) {

                                console.log(
                                    "Parshad is not approved.",
                                    account.status,
                                    account.approved
                                );


                                await signOut(
                                    auth
                                );


                                window.location.replace(
                                    redirectPath
                                );


                                finish(
                                    false
                                );

                                return;

                            }


                            // =================================
                            // EVERYTHING OK
                            // =================================

                            console.log(
                                "Parshad session verified:",
                                user.uid
                            );


                            finish(
                                true
                            );

                        }

                        catch (error) {

                            console.error(
                                "requireParshadLogin ERROR:",
                                error
                            );


                            try {

                                await signOut(
                                    auth
                                );

                            }

                            catch (_) {}


                            window.location.replace(
                                redirectPath
                            );


                            finish(
                                false
                            );

                        }

                    }
                );

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

async function parshadLogout() {

    try {

        await signOut(
            auth
        );


        console.log(
            "Parshad logged out."
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

        throw error;

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
// LOGIN FORM
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
// =====================================================

export {
    loginUser,
    getParshadRecord,
    isApprovedParshad,
    requireParshadLogin,
    parshadLogout
};
