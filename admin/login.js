// =====================================================
// PARSHD - PARSHAD LOGIN
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
// HELPERS
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
// PASSWORD TOGGLE
// =====================================================

if (
    togglePassword &&
    passwordInput
) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type ===
                "password";

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
// CHECK PARSHAD RECORD
// =====================================================

export async function getParshadRecord(
    uid
) {

    const ref =
        doc(
            db,
            "parshd",
            "parshads",
            "data",
            uid
        );


    const snap =
        await getDoc(ref);


    if (!snap.exists()) {

        return null;
    }


    return snap.data();
}


// =====================================================
// CHECK APPROVED PARSHAD
// =====================================================

export async function isApprovedParshad(
    user
) {

    if (!user) {
        return false;
    }


    if (!user.emailVerified) {
        return false;
    }


    const data =
        await getParshadRecord(
            user.uid
        );


    if (!data) {
        return false;
    }


    return (
        data.status === "approved" &&
        data.approved === true
    );
}


// =====================================================
// FORGOT PASSWORD
// =====================================================

async function forgotPassword() {

    hideMessage();


    const email =
        emailInput
            ? emailInput.value
                .trim()
                .toLowerCase()
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


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        showMessage(
            "Password reset link email पर भेज दिया गया है। Inbox और Spam/Junk दोनों check करें।",
            "success"
        );


    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        if (
            error.code ===
            "auth/invalid-email"
        ) {

            showMessage(
                "Email सही नहीं है।"
            );

        }

        else if (
            error.code ===
            "auth/user-not-found"
        ) {

            showMessage(
                "इस email से कोई account नहीं मिला।"
            );

        }

        else if (
            error.code ===
            "auth/too-many-requests"
        ) {

            showMessage(
                "बहुत ज्यादा requests हुई हैं। थोड़ी देर बाद फिर कोशिश करें।"
            );

        }

        else {

            showMessage(
                "Password reset email भेजा नहीं जा सका।"
            );

        }

    }

}


// =====================================================
// CREATE FORGOT PASSWORD
// =====================================================

function createForgotPasswordLink() {

    if (!passwordInput) {
        return;
    }


    if (
        document.getElementById(
            "forgotPasswordButton"
        )
    ) {

        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.textAlign =
        "right";

    wrapper.style.marginTop =
        "8px";


    const button =
        document.createElement(
            "button"
        );


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


    wrapper.appendChild(
        button
    );


    passwordInput
        .parentElement
        .appendChild(
            wrapper
        );

}


createForgotPasswordLink();


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
            "Verification email दोबारा भेज दिया गया है। Inbox और Spam/Junk दोनों check करें।",
            "success"
        );


    } catch (error) {

        console.error(
            error
        );


        showMessage(
            "Verification email भेजा नहीं जा सका।"
        );

    }

}


// =====================================================
// VERIFICATION MESSAGE
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
        document.createElement(
            "button"
        );


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
            .appendChild(
                button
            );

    }

}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideMessage();


            const email =
                emailInput
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput
                    .value;


            if (
                !email ||
                !password
            ) {

                showMessage(
                    "Email और password दोनों भरें।"
                );

                return;
            }


            loginButton.disabled =
                true;

            loginButton.textContent =
                "Checking...";


            try {

                // -------------------------------------
                // FIREBASE LOGIN
                // -------------------------------------

                const credential =
                    await
                    signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                // -------------------------------------
                // EMAIL VERIFICATION
                // -------------------------------------

                if (
                    !user.emailVerified
                ) {

                    showVerificationMessage();

                    await signOut(
                        auth
                    );

                    return;
                }


                // -------------------------------------
                // PARSHAD RECORD
                // -------------------------------------

                const parshad =
                    await getParshadRecord(
                        user.uid
                    );


                if (!parshad) {

                    await signOut(
                        auth
                    );

                    showMessage(
                        "इस account का Parshd registration record नहीं मिला।"
                    );

                    return;
                }


                // -------------------------------------
                // REJECTED
                // -------------------------------------

                if (
                    parshad.status ===
                    "rejected"
                ) {

                    await signOut(
                        auth
                    );

                    showMessage(
                        "आपका registration Manager द्वारा rejected किया गया है।"
                    );

                    return;
                }


                // -------------------------------------
                // PENDING
                // -------------------------------------

                if (
                    parshad.status !==
                    "approved"
                ) {

                    await signOut(
                        auth
                    );

                    showMessage(
                        "आपका registration अभी Manager approval के लिए pending है।"
                    );

                    return;
                }


                // -------------------------------------
                // APPROVED FLAG
                // -------------------------------------

                if (
                    parshad.approved !==
                    true
                ) {

                    await signOut(
                        auth
                    );

                    showMessage(
                        "आपका account अभी approved नहीं हुआ है।"
                    );

                    return;
                }


                // -------------------------------------
                // SUCCESS
                // -------------------------------------

                showMessage(
                    "Login successful...",
                    "success"
                );


                loginButton.textContent =
                    "Opening Dashboard...";


                window.location.href =
                    "./dashboard.html";

            }


            catch (error) {

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

                }

                else if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    message =
                        "यह account मौजूद नहीं है।";

                }

                else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    message =
                        "Password गलत है।";

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "Email सही नहीं है।";

                }

                else if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    message =
                        "बहुत ज्यादा login attempts हुए हैं। थोड़ी देर बाद कोशिश करें।";

                }

                else if (
                    error.code ===
                    "permission-denied"
                ) {

                    message =
                        "Account verification की permission नहीं मिली।";

                }


                showMessage(
                    message
                );


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";

            }

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

export async function parshadLogout() {

    try {

        await signOut(
            auth
        );

        window.location.href =
            "./index.html";

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


// =====================================================
// REQUIRE PARSHAD LOGIN
// =====================================================
//
// Dashboard इसी function को use करेगा.
// =====================================================

export function requireParshadLogin(
    redirect = "./index.html"
) {

    return new Promise(
        resolve => {

            let finished =
                false;


            const unsubscribe =
                onAuthStateChanged(
                    auth,
                    async user => {

                        if (finished) {
                            return;
                        }


                        try {

                            if (!user) {

                                finished =
                                    true;

                                unsubscribe();

                                window.location.href =
                                    redirect;

                                resolve(
                                    false
                                );

                                return;
                            }


                            // -------------------------
                            // EMAIL VERIFIED
                            // -------------------------

                            if (
                                !user.emailVerified
                            ) {

                                finished =
                                    true;

                                unsubscribe();

                                await signOut(
                                    auth
                                );

                                window.location.href =
                                    redirect;

                                resolve(
                                    false
                                );

                                return;
                            }


                            // -------------------------
                            // PARSHAD RECORD
                            // -------------------------

                            const parshad =
                                await getParshadRecord(
                                    user.uid
                                );


                            if (
                                !parshad
                                ||
                                parshad.status !==
                                    "approved"
                                ||
                                parshad.approved !==
                                    true
                            ) {

                                finished =
                                    true;

                                unsubscribe();

                                await signOut(
                                    auth
                                );

                                window.location.href =
                                    redirect;

                                resolve(
                                    false
                                );

                                return;
                            }


                            // -------------------------
                            // ALLOWED
                            // -------------------------

                            finished =
                                true;

                            unsubscribe();

                            resolve(
                                true
                            );

                        }

                        catch (error) {

                            console.error(
                                "Parshad auth check error:",
                                error
                            );


                            if (
                                finished
                            ) {
                                return;
                            }


                            finished =
                                true;

                            unsubscribe();


                            try {

                                await signOut(
                                    auth
                                );

                            } catch (_) {}


                            window.location.href =
                                redirect;


                            resolve(
                                false
                            );

                        }

                    }
                );

        }
    );

}
