const DEMO_ACCOUNT_KEY = "parshd_demo_account";
const DEMO_SESSION_KEY = "parshd_demo_session";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");


// ================================
// MESSAGE
// ================================

function showMessage(message, type = "error") {
    loginMessage.textContent = message;

    loginMessage.className =
        `login-message show ${type}`;
}

function hideMessage() {
    loginMessage.textContent = "";

    loginMessage.className =
        "login-message";
}


// ================================
// PASSWORD SHOW / HIDE
// ================================

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        togglePassword.textContent =
            isPassword ? "🙈" : "👁";
    });
}


// ================================
// DEMO ACCOUNT
// ================================

function getDemoAccount() {
    try {

        const account =
            localStorage.getItem(DEMO_ACCOUNT_KEY);

        return account
            ? JSON.parse(account)
            : null;

    } catch (error) {

        console.error(error);

        return null;
    }
}


// ================================
// LOGIN
// ================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            hideMessage();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!email || !password) {

                showMessage(
                    "Email और password दोनों भरें।"
                );

                return;
            }


            const account =
                getDemoAccount();


            // अभी account बना नहीं है
            if (!account) {

                showMessage(
                    "पहले Parshad account बनाइए।"
                );

                return;
            }


            // Login check
            if (
                email.toLowerCase() !==
                account.email.toLowerCase() ||
                password !== account.password
            ) {

                showMessage(
                    "Email या password गलत है।"
                );

                return;
            }


            // Session
            localStorage.setItem(
                DEMO_SESSION_KEY,
                JSON.stringify({
                    loggedIn: true,
                    parshadId: account.parshadId,
                    loginTime: Date.now()
                })
            );


            showMessage(
                "Login successful...",
                "success"
            );


            loginButton.disabled = true;

            loginButton.textContent =
                "Opening Dashboard...";


            setTimeout(() => {

                window.location.href =
                    "./dashboard.html";

            }, 500);

        }
    );
}


// ================================
// ALREADY LOGGED IN
// ================================

function isLoggedIn() {

    try {

        const session =
            localStorage.getItem(
                DEMO_SESSION_KEY
            );

        if (!session) {
            return false;
        }

        const data =
            JSON.parse(session);

        return data.loggedIn === true;

    } catch (error) {

        return false;
    }
}


// ================================
// EXPORT HELPERS
// ================================

export function getDemoSession() {

    try {

        const session =
            localStorage.getItem(
                DEMO_SESSION_KEY
            );

        return session
            ? JSON.parse(session)
            : null;

    } catch (error) {

        return null;
    }
}


export function demoLogout() {

    localStorage.removeItem(
        DEMO_SESSION_KEY
    );

    window.location.href =
        "./index.html";
}


export function requireDemoLogin() {

    if (!isLoggedIn()) {

        window.location.href =
            "./index.html";

        return false;
    }

    return true;
}