// =====================================================
// PARSHD MANAGER LOGIN
// FIREBASE AUTH
// =====================================================

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
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

function showMessage(message, type = "error") {

    if (!loginMessage) return;

    loginMessage.textContent = message;

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

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";

            togglePassword.textContent =
                isPassword
                    ? "🙈"
                    : "👁";
        }
    );
}


// =====================================================
// CHECK MANAGER
// =====================================================

async function checkManager(uid) {

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
        manager.active !== true ||
        manager.role !== "manager"
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
                emailInput.value.trim();

            const password =
                passwordInput.value;


            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (!email || !password) {

                showMessage(
                    "Email और password दोनों भरें।"
                );

                return;
            }


            // -----------------------------------------
            // BUTTON
            // -----------------------------------------

            if (loginButton) {

                loginButton.disabled = true;

                loginButton.textContent =
                    "Checking...";
            }


            try {

                // -------------------------------------
                // FIREBASE LOGIN
                // -------------------------------------

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                // -------------------------------------
                // MANAGER CHECK
                // -------------------------------------

                const manager =
                    await checkManager(user.uid);


                // -------------------------------------
                // NOT A MANAGER
                // -------------------------------------

                if (!manager) {

                    await signOut(auth);

                    showMessage(
                        "इस account को Manager access नहीं मिला है।"
                    );

                    return;
                }


                // -------------------------------------
                // SUCCESS
                // -------------------------------------

                showMessage(
                    "Manager login successful...",
                    "success"
                );


                if (loginButton) {

                    loginButton.textContent =
                        "Opening Manager Panel...";
                }


                setTimeout(() => {

                    window.location.href =
                        "./dashboard.html";

                }, 500);


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
                    "auth/user-not-found"
                ) {

                    message =
                        "यह Manager account मौजूद नहीं है।";

                } else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    message =
                        "Password गलत है।";

                } else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    message =
                        "बहुत ज्यादा login attempts हुए हैं। थोड़ी देर बाद कोशिश करें।";

                } else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "Email सही नहीं है।";
                }


                showMessage(message);


            } finally {

                if (loginButton) {

                    loginButton.disabled = false;

                    loginButton.textContent =
                        "Manager Login";
                }
            }
        }
    );
}


// =====================================================
// ALREADY LOGGED-IN MANAGER
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) return;

        try {

            const manager =
                await checkManager(user.uid);


            if (manager) {

                window.location.href =
                    "./dashboard.html";

            } else {

                await signOut(auth);
            }

        } catch (error) {

            console.error(
                "Manager session check error:",
                error
            );
        }
    }
);


// =====================================================
// LOGOUT HELPER
// =====================================================

export async function managerLogout() {

    try {

        await signOut(auth);

        window.location.href =
            "./index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
    }
}


// =====================================================
// REQUIRE MANAGER LOGIN
// =====================================================

export function requireManagerLogin(
    redirect = "./index.html"
) {

    return new Promise((resolve) => {

        onAuthStateChanged(
            auth,
            async (user) => {

                if (!user) {

                    window.location.href =
                        redirect;

                    resolve(false);

                    return;
                }


                try {

                    const manager =
                        await checkManager(
                            user.uid
                        );


                    if (!manager) {

                        await signOut(auth);

                        window.location.href =
                            redirect;

                        resolve(false);

                        return;
                    }


                    resolve(true);

                } catch (error) {

                    console.error(error);

                    await signOut(auth);

                    window.location.href =
                        redirect;

                    resolve(false);
                }
            }
        );
    });
}
