// =====================================================
// PARSHD MASTER MANAGER LOGIN
// =====================================================

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    auth,
    db
} from "../js/firebase-config.js";


// =====================================================
// FIXED MASTER MANAGER
// =====================================================

const MANAGER_UID =
    "bgsjA85tL7Ws4YZl9HBBkUms5lY2";


// =====================================================
// ELEMENTS
// =====================================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const togglePassword =
    document.getElementById("togglePassword");

const loginMessage =
    document.getElementById("loginMessage");


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type = "error"
) {

    if (!loginMessage) return;

    loginMessage.textContent =
        message;

    loginMessage.className =
        `login-message show ${type}`;
}


function hideMessage() {

    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.className =
        "login-message";
}


// =====================================================
// PASSWORD SHOW / HIDE
// =====================================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            const show =
                passwordInput.type ===
                "password";

            passwordInput.type =
                show
                    ? "text"
                    : "password";

            togglePassword.textContent =
                show
                    ? "🙈"
                    : "👁";
        }
    );
}


// =====================================================
// CHECK MASTER MANAGER
// =====================================================

async function getManager(uid) {

    // UID must be our Master Manager UID
    if (uid !== MANAGER_UID) {

        return null;
    }


    const managerRef =
        doc(
            db,
            "parshd",
            "managers",
            "data",
            uid
        );


    const managerSnap =
        await getDoc(managerRef);


    if (!managerSnap.exists()) {

        return null;
    }


    const manager =
        managerSnap.data();


    if (
        manager.role !==
        "manager"
    ) {

        return null;
    }


    if (
        manager.active !==
        true
    ) {

        return null;
    }


    return manager;
}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            if (!email || !password) {

                showMessage(
                    "Email और password दोनों भरें।"
                );

                return;
            }


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Checking...";
            }


            try {

                // =====================================
                // FIREBASE AUTH LOGIN
                // =====================================

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                // =====================================
                // MASTER MANAGER CHECK
                // =====================================

                const manager =
                    await getManager(
                        user.uid
                    );


                // =====================================
                // NOT AUTHORIZED
                // =====================================

                if (!manager) {

                    await signOut(auth);

                    showMessage(
                        "इस account को Master Manager access नहीं मिला है।"
                    );

                    return;
                }


                // =====================================
                // SUCCESS
                // =====================================

                showMessage(
                    "Manager login successful...",
                    "success"
                );


                if (loginButton) {

                    loginButton.textContent =
                        "Opening Dashboard...";
                }


                setTimeout(
                    () => {

                        window.location.href =
                            "./dashboard.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Manager login error:",
                    error
                );


                let message =
                    "Login नहीं हो सका।";


                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    message =
                        "Email या password गलत है।";

                } else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "Email सही नहीं है।";

                } else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    message =
                        "बहुत ज्यादा attempts हुए हैं। थोड़ी देर बाद कोशिश करें।";
                }


                showMessage(message);


            } finally {

                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Manager Login";
                }
            }
        }
    );
}


// =====================================================
// CHECK EXISTING SESSION
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) return;


        try {

            const manager =
                await getManager(
                    user.uid
                );


            if (manager) {

                window.location.href =
                    "./dashboard.html";

            } else {

                await signOut(auth);
            }

        } catch (error) {

            console.error(
                "Manager session check:",
                error
            );

            await signOut(auth);
        }
    }
);


// =====================================================
// MANAGER LOGOUT
// =====================================================

export async function managerLogout() {

    try {

        await signOut(auth);

        window.location.href =
            "./index.html";

    } catch (error) {

        console.error(
            "Manager logout error:",
            error
        );
    }
}


// =====================================================
// REQUIRE MANAGER LOGIN
// =====================================================

export function requireManagerLogin() {

    return new Promise(
        (resolve) => {

            onAuthStateChanged(
                auth,
                async (user) => {

                    if (!user) {

                        window.location.href =
                            "./index.html";

                        resolve(false);

                        return;
                    }


                    try {

                        const manager =
                            await getManager(
                                user.uid
                            );


                        if (!manager) {

                            await signOut(auth);

                            window.location.href =
                                "./index.html";

                            resolve(false);

                            return;
                        }


                        resolve(true);

                    } catch (error) {

                        console.error(error);

                        await signOut(auth);

                        window.location.href =
                            "./index.html";

                        resolve(false);
                    }
                }
            );
        }
    );
}
