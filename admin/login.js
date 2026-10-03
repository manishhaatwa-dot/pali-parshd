// =====================================================
// PARSHD PARSHAD LOGIN
// FIREBASE AUTH + EMAIL VERIFICATION + MANAGER APPROVAL
// =====================================================

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification
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
// STATE
// =====================================================

let loginInProgress = false;


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
// FORGOT PASSWORD UI
// =====================================================

function createForgotPasswordLink() {

    if (!passwordInput) return;

    if (
        document.getElementById(
            "forgotPasswordButton"
        )
    ) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.style.textAlign =
        "right";

    wrapper.style.marginTop =
        "8px";


    const button =
        document.createElement("button");

    button.type =
        "button";

    button.id =
        "forgotPasswordButton";

    button.textContent =
        "Forgot Password?";

    button.style.border =
        "0";

    button.style.background =
        "transparent";

    button.style.padding =
        "0";

    button.style.cursor =
        "pointer";

    button.style.color =
        "#2563eb";

    button.style.fontSize =
        "14px";

    button.style.fontWeight =
        "600";


    button.addEventListener(
        "click",
        forgotPassword
    );


    wrapper.appendChild(button);

    passwordInput.parentElement
        .appendChild(wrapper);
}


// =====================================================
// FORGOT PASSWORD
// =====================================================

async function forgotPassword() {

    hideMessage();


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    if (!email) {

        showMessage(
            "Password reset करने के लिए पहले अपना email डालें।"
        );

        if (emailInput) {
            emailInput.focus();
        }

        return;
    }


    if (loginButton) {

        loginButton.disabled =
            true;
    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        showMessage(
            "Password reset link आपके email पर भेज दिया गया है। Inbox और Spam/Junk folder दोनों check करें।",
            "success"
        );


    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        let message =
            "Password reset email भेजा नहीं जा सका।";


        if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "Email सही नहीं है।";

        } else if (
            error.code ===
            "auth/user-not-found"
        ) {

            message =
                "इस email से कोई account नहीं मिला।";

        } else if (
            error.code ===
            "auth/too-many-requests"
        ) {

            message =
                "बहुत ज्यादा requests हुई हैं। थोड़ी देर बाद फिर कोशिश करें।";
        }


        showMessage(message);


    } finally {

        if (loginButton) {

            loginButton.disabled =
                false;
        }
    }
}


// =====================================================
// CREATE FORGOT PASSWORD LINK
// =====================================================

createForgotPasswordLink();


// =====================================================
// CHECK PARSHAD ACCOUNT
// =====================================================

async function checkParshad(uid) {

    const parshadRef =
        doc(
            db,
            "parshd",
            "parshads",
            "data",
            uid
        );


    const parshadSnap =
        await getDoc(parshadRef);


    if (!parshadSnap.exists()) {

        return null;
    }


    return parshadSnap.data();
}


// =====================================================
// RESEND VERIFICATION
// =====================================================

async function resendVerification() {

    const user =
        auth.currentUser;


    if (!user) {

        showMessage(
            "पहले email और password से login करें।"
        );

        return;
    }


    try {

        await sendEmailVerification(
            user
        );


        showMessage(
            "Verification email दोबारा भेज दिया गया है। Inbox और Spam/Junk folder दोनों check करें।",
            "success"
        );


    } catch (error) {

        console.error(
            "Verification resend error:",
            error
        );


        if (
            error.code ===
            "auth/too-many-requests"
        ) {

            showMessage(
                "बहुत ज्यादा verification emails भेजे गए हैं। थोड़ी देर बाद फिर कोशिश करें।"
            );

        } else {

            showMessage(
                "Verification email भेजा नहीं जा सका।"
            );
        }
    }
}


// =====================================================
// SHOW VERIFICATION MESSAGE
// =====================================================

function showVerificationMessage() {

    showMessage(
        "आपका email अभी verify नहीं हुआ है। Inbox और Spam/Junk folder check करें। Verification link पर click करने के बाद दोबारा login करें।"
    );


    if (
        document.getElementById(
            "resendVerificationButton"
        )
    ) {
        return;
    }


    const button =
        document.createElement("button");


    button.type =
        "button";

    button.id =
        "resendVerificationButton";

    button.textContent =
        "Resend Verification Email";


    button.style.display =
        "block";

    button.style.width =
        "100%";

    button.style.marginTop =
        "12px";

    button.style.padding =
        "11px";

    button.style.border =
        "1px solid #d1d5db";

    button.style.borderRadius =
        "9px";

    button.style.background =
        "#ffffff";

    button.style.color =
        "#111827";

    button.style.fontWeight =
        "600";

    button.style.cursor =
        "pointer";


    button.addEventListener(
        "click",
        resendVerification
    );


    if (loginMessage) {

        loginMessage
            .parentElement
            .appendChild(button);
    }
}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            loginInProgress =
                true;

            hideMessage();


            const email =
                emailInput
                    ? emailInput.value
                        .trim()
                        .toLowerCase()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (!email || !password) {

                showMessage(
                    "Email और password दोनों भरें।"
                );

                loginInProgress =
                    false;

                return;
            }


            // -----------------------------------------
            // BUTTON
            // -----------------------------------------

            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Checking...";
            }


            try {

                // =====================================
                // FIREBASE LOGIN
                // =====================================

                const credential =
                    await
                    signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                // =====================================
                // EMAIL VERIFICATION
                // =====================================

                if (!user.emailVerified) {

                    // Verification email automatically
                    // dobara bhej denge.
                    try {

                        await
                        sendEmailVerification(
                            user
                        );

                    } catch (_) {
                        // Ignore resend error here.
                    }


                    await signOut(auth);


                    showVerificationMessage();


                    loginInProgress =
                        false;

                    return;
                }


                // =====================================
                // PARSHAD FIRESTORE RECORD
                // =====================================

                const parshad =
                    await checkParshad(
                        user.uid
                    );


                // =====================================
                // RECORD NOT FOUND
                // =====================================

                if (!parshad) {

                    await signOut(auth);


                    showMessage(
                        "इस account का Parshd registration record नहीं मिला।"
                    );


                    loginInProgress =
                        false;

                    return;
                }


                // =====================================
                // REJECTED
                // =====================================

                if (
                    parshad.status ===
                    "rejected"
                ) {

                    await signOut(auth);


                    showMessage(
                        "आपका Parshd registration Manager द्वारा rejected किया गया है।"
                    );


                    loginInProgress =
                        false;

                    return;
                }


                // =====================================
                // PENDING
                // =====================================

                if (
                    parshad.status !==
                    "approved"
                ) {

                    await signOut(auth);


                    showMessage(
                        "आपका registration अभी Manager approval के लिए pending है। Approval होने के बाद आप login कर सकेंगे।"
                    );


                    loginInProgress =
                        false;

                    return;
                }


                // =====================================
                // APPROVED FLAG
                // =====================================

                if (
                    parshad.approved !==
                    true
                ) {

                    await signOut(auth);


                    showMessage(
                        "आपका account अभी approved नहीं हुआ है।"
                    );


                    loginInProgress =
                        false;

                    return;
                }


                // =====================================
                // SUCCESS
                // =====================================

                showMessage(
                    "Login successful...",
                    "success"
                );


                if (loginButton) {

                    loginButton.textContent =
                        "Opening Dashboard...";
                }


                setTimeout(() => {

                    window.location.href =
                        "./dashboard.html";

                }, 500);


            } catch (error) {

                console.error(
                    "Parshad login error:",
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
                        "यह account मौजूद नहीं है।";

                } else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    message =
                        "Password गलत है।";

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
                        "बहुत ज्यादा login attempts हुए हैं। थोड़ी देर बाद कोशिश करें।";

                } else if (
                    error.code ===
                    "auth/user-disabled"
                ) {

                    message =
                        "यह account disabled है।";
                }


                showMessage(
                    message
                );


            } finally {

                loginInProgress =
                    false;


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Login";
                }
            }
        }
    );
}


// =====================================================
// ALREADY LOGGED-IN PARSHAD
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // Login form submit चल रहा है तो
        // यह listener बीच में interfere नहीं करेगा.
        if (loginInProgress) {
            return;
        }


        if (!user) {
            return;
        }


        try {

            // -----------------------------------------
            // EMAIL VERIFIED CHECK
            // -----------------------------------------

            if (!user.emailVerified) {

                await signOut(auth);

                return;
            }


            // -----------------------------------------
            // PARSHAD CHECK
            // -----------------------------------------

            const parshad =
                await checkParshad(
                    user.uid
                );


            if (!parshad) {

                await signOut(auth);

                return;
            }


            // -----------------------------------------
            // APPROVAL CHECK
            // -----------------------------------------

            if (
                parshad.status ===
                "approved"
                &&
                parshad.approved === true
            ) {

                window.location.href =
                    "./dashboard.html";

                return;
            }


            // Pending / rejected account
            // dashboard access नहीं मिलेगा.

            await signOut(auth);


        } catch (error) {

            console.error(
                "Parshad session check error:",
                error
            );


            try {

                await signOut(auth);

            } catch (_) {}
        }
    }
);


// =====================================================
// LOGOUT HELPER
// =====================================================

export async function parshadLogout() {

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
// REQUIRE PARSHAD LOGIN
// =====================================================

export function requireParshadLogin(
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

                    // ---------------------------------
                    // EMAIL VERIFIED
                    // ---------------------------------

                    if (
                        !user.emailVerified
                    ) {

                        await signOut(auth);

                        window.location.href =
                            redirect;

                        resolve(false);

                        return;
                    }


                    // ---------------------------------
                    // PARSHAD RECORD
                    // ---------------------------------

                    const parshad =
                        await checkParshad(
                            user.uid
                        );


                    if (!parshad) {

                        await signOut(auth);

                        window.location.href =
                            redirect;

                        resolve(false);

                        return;
                    }


                    // ---------------------------------
                    // APPROVED
                    // ---------------------------------

                    if (
                        parshad.status !==
                        "approved"
                        ||
                        parshad.approved !==
                        true
                    ) {

                        await signOut(auth);

                        window.location.href =
                            redirect;

                        resolve(false);

                        return;
                    }


                    // ---------------------------------
                    // ALLOWED
                    // ---------------------------------

                    resolve(true);


                } catch (error) {

                    console.error(
                        "Parshad login requirement error:",
                        error
                    );


                    await signOut(auth);

                    window.location.href =
                        redirect;

                    resolve(false);
                }
            }
        );
    });
}
