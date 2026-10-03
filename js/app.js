// =========================================================
// PARSHD - CITIZEN APP CONTROLLER
// File: js/app.js
// =========================================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// =========================================================
// PARSHD APP CONFIG
// =========================================================

const PARSHD_ROOT = "parshd";


// =========================================================
// DEFAULT PROFILE DATA
// =========================================================

const DEFAULT_PROFILE = {
    name: "Parshad",
    wardNumber: "",
    areaName: "",
    designation: "Ward Parshad",
    profilePhoto: "assets/images/default-profile.png",
    partyLogo: "assets/images/default-logo.png",
    phone: "",
    whatsapp: "",
    about: "",
    complaintEnabled: true
};


// =========================================================
// APP STATE
// =========================================================

const AppState = {
    wardId: null,
    profile: null,
    loading: false
};


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        initializeMenu();

        initializeButtons();

        AppState.wardId = getWardFromURL();


        // -----------------------------------------
        // NO WARD
        // -----------------------------------------

        if (!AppState.wardId) {

            AppState.profile = null;

            hideLoading();

            showNoWardState();

            return;
        }


        // -----------------------------------------
        // WARD FOUND
        // -----------------------------------------

        await loadWardProfile();

    } catch (error) {

        console.error(
            "Parshd App Error:",
            error
        );

        AppState.loading = false;

        hideLoading();

        showSystemError(
            "कुछ तकनीकी समस्या हुई है। कृपया थोड़ी देर बाद फिर प्रयास करें।"
        );
    }

});


// =========================================================
// GET WARD FROM URL
// =========================================================

function getWardFromURL() {

    const path =
        window.location.pathname;


    /*
        Production example:

        https://parshd.in/ward/44

        Result:
        44
    */

    const parts =
        path
            .split("/")
            .filter(Boolean);


    const wardIndex =
        parts.indexOf("ward");


    if (
        wardIndex !== -1 &&
        parts[wardIndex + 1]
    ) {

        const ward =
            decodeURIComponent(
                parts[wardIndex + 1]
            ).trim();


        if (ward) {
            return ward;
        }
    }


    // -----------------------------------------
    // Query parameter support
    // -----------------------------------------

    const params =
        new URLSearchParams(
            window.location.search
        );


    const wardParam =
        params.get("ward");


    if (wardParam) {

        const ward =
            wardParam.trim();

        if (ward) {
            return ward;
        }
    }


    return null;
}


// =========================================================
// LOAD WARD PROFILE
// =========================================================

async function loadWardProfile() {

    AppState.loading = true;

    showLoading();


    try {

        /*
            IMPORTANT:

            Only Parshd namespace is accessed.

            Existing ZenG collections are NOT touched.
        */

        const profileRef =
            doc(
                db,
                PARSHD_ROOT,
                "wards",
                "data",
                AppState.wardId
            );


        const snapshot =
            await getDoc(profileRef);


        if (snapshot.exists()) {

            AppState.profile = {
                ...DEFAULT_PROFILE,
                ...snapshot.data()
            };


            renderProfile();

        } else {

            AppState.profile = null;

            showWardNotFound();

        }

    } catch (error) {

        console.error(
            "Ward profile loading failed:",
            error
        );


        AppState.profile = null;


        showSystemError(
            "Ward profile load नहीं हो सकी।"
        );

    } finally {

        AppState.loading = false;

        hideLoading();

    }

}


// =========================================================
// RENDER PROFILE
// =========================================================

function renderProfile() {

    const profile =
        AppState.profile;


    if (!profile) {
        return;
    }


    // -----------------------------------------
    // Party Logo
    // -----------------------------------------

    setImage(
        [
            "#partyLogo",
            ".party-logo",
            "[data-party-logo]"
        ],
        profile.partyLogo
    );


    // -----------------------------------------
    // Profile Photo
    // -----------------------------------------

    setImage(
        [
            "#profilePhoto",
            ".profile-photo",
            "[data-profile-photo]"
        ],
        profile.profilePhoto
    );


    // -----------------------------------------
    // Name
    // -----------------------------------------

    setText(
        [
            "#parshadName",
            ".parshad-name",
            "[data-parshad-name]"
        ],
        profile.name
    );


    // -----------------------------------------
    // Ward Number
    // -----------------------------------------

    setText(
        [
            "#wardNumber",
            ".ward-number",
            "[data-ward-number]"
        ],
        profile.wardNumber
            ? `वार्ड नंबर ${profile.wardNumber}`
            : ""
    );


    // -----------------------------------------
    // Area
    // -----------------------------------------

    setText(
        [
            "#areaName",
            ".area-name",
            "[data-area-name]"
        ],
        profile.areaName
    );


    // -----------------------------------------
    // Designation
    // -----------------------------------------

    setText(
        [
            "#designation",
            ".designation",
            "[data-designation]"
        ],
        profile.designation
    );


    // -----------------------------------------
    // About
    // -----------------------------------------

    const about =
        document.querySelector(
            "#aboutText, .about-text, [data-about]"
        );


    if (about) {

        if (profile.about) {

            about.textContent =
                profile.about;

        } else {

            const section =
                about.closest(
                    ".about-section"
                );


            if (section) {
                section.style.display =
                    "none";
            }
        }
    }


    // -----------------------------------------
    // Contact
    // -----------------------------------------

    renderContact(profile);


    // -----------------------------------------
    // Complaint Status
    // -----------------------------------------

    renderComplaintStatus(
        profile.complaintEnabled
    );


    // -----------------------------------------
    // Page Title
    // -----------------------------------------

    updatePageTitle(profile);

}


// =========================================================
// RENDER CONTACT BUTTONS
// =========================================================

function renderContact(profile) {

    const phone =
        normalizePhone(
            profile.phone
        );


    const whatsapp =
        normalizePhone(
            profile.whatsapp ||
            profile.phone
        );


    const callButtons =
        document.querySelectorAll(
            "[data-call], .call-button"
        );


    callButtons.forEach(button => {

        if (phone) {

            button.href =
                `tel:${phone}`;

            button.style.display = "";

        } else {

            button.style.display =
                "none";
        }

    });


    const whatsappButtons =
        document.querySelectorAll(
            "[data-whatsapp], .whatsapp-button"
        );


    whatsappButtons.forEach(button => {

        if (whatsapp) {

            button.href =
                `https://wa.me/${whatsapp}`;

            button.target =
                "_blank";

            button.rel =
                "noopener noreferrer";

            button.style.display = "";

        } else {

            button.style.display =
                "none";
        }

    });


    const contactSection =
        document.querySelector(
            ".contact-section"
        );


    if (
        contactSection &&
        !phone &&
        !whatsapp
    ) {

        contactSection.style.display =
            "none";
    }

}


// =========================================================
// COMPLAINT STATUS
// =========================================================

function renderComplaintStatus(enabled) {

    const complaintButton =
        document.querySelector(
            "#complaintButton, .complaint-btn, [data-complaint-button]"
        );


    const closedMessage =
        document.querySelector(
            "#complaintClosed, .complaint-closed, [data-complaint-closed]"
        );


    if (enabled === false) {

        if (complaintButton) {

            complaintButton.style.display =
                "none";
        }


        if (closedMessage) {

            closedMessage.style.display =
                "block";
        }


        return;
    }


    if (complaintButton) {

        complaintButton.style.display =
            "";
    }


    if (closedMessage) {

        closedMessage.style.display =
            "none";
    }

}


// =========================================================
// INITIALIZE BUTTONS
// =========================================================

function initializeButtons() {

    // -----------------------------------------
    // Complaint
    // -----------------------------------------

    const complaintButtons =
        document.querySelectorAll(
            "#complaintButton, .complaint-btn, [data-complaint-button]"
        );


    complaintButtons.forEach(button => {

        button.addEventListener(
            "click",
            openComplaint
        );

    });


    // -----------------------------------------
    // Track Complaint
    // -----------------------------------------

    const trackButtons =
        document.querySelectorAll(
            "[data-track-complaint], .track-complaint"
        );


    trackButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    `track.html?ward=${encodeURIComponent(
                        AppState.wardId || ""
                    )}`;

            }
        );

    });


    // -----------------------------------------
    // Solved Problems
    // -----------------------------------------

    const solvedButtons =
        document.querySelectorAll(
            "[data-solved-problems], .solved-problems"
        );


    solvedButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    `track.html?ward=${encodeURIComponent(
                        AppState.wardId || ""
                    )}&status=solved`;

            }
        );

    });

}


// =========================================================
// OPEN COMPLAINT
// =========================================================

function openComplaint(event) {

    if (!AppState.wardId) {

        event.preventDefault();

        showNoWardState();

        return;
    }


    if (
        AppState.profile &&
        AppState.profile.complaintEnabled === false
    ) {

        event.preventDefault();

        renderComplaintStatus(false);

        return;
    }


    const ward =
        AppState.wardId;


    window.location.href =
        `complaint.html?ward=${encodeURIComponent(
            ward
        )}`;

}


// =========================================================
// MENU
// =========================================================

function initializeMenu() {

    const menuButton =
        document.querySelector(
            "#menuButton, .menu-button, [data-menu-button]"
        );


    const sideMenu =
        document.querySelector(
            "#sideMenu, .side-menu, [data-side-menu]"
        );


    const overlay =
        document.querySelector(
            "#menuOverlay, .menu-overlay, [data-menu-overlay]"
        );


    if (!menuButton || !sideMenu) {
        return;
    }


    menuButton.addEventListener(
        "click",
        () => {

            sideMenu.classList.toggle(
                "active"
            );


            if (overlay) {

                overlay.classList.toggle(
                    "active"
                );
            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMenu
        );

    }


    const closeButtons =
        sideMenu.querySelectorAll(
            "[data-menu-close], .menu-close"
        );


    closeButtons.forEach(button => {

        button.addEventListener(
            "click",
            closeMenu
        );

    });

}


function closeMenu() {

    const sideMenu =
        document.querySelector(
            "#sideMenu, .side-menu, [data-side-menu]"
        );


    const overlay =
        document.querySelector(
            "#menuOverlay, .menu-overlay, [data-menu-overlay]"
        );


    if (sideMenu) {

        sideMenu.classList.remove(
            "active"
        );
    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );
    }

}


// =========================================================
// IMAGE HELPER
// =========================================================

function setImage(
    selectors,
    source
) {

    if (!source) {
        return;
    }


    for (const selector of selectors) {

        const elements =
            document.querySelectorAll(
                selector
            );


        if (!elements.length) {
            continue;
        }


        elements.forEach(element => {

            element.src =
                source;


            element.onerror = () => {

                element.onerror = null;


                if (
                    selector.includes(
                        "profile"
                    )
                ) {

                    element.src =
                        "assets/images/default-profile.png";

                } else {

                    element.src =
                        "assets/images/default-logo.png";
                }

            };

        });


        break;
    }

}


// =========================================================
// TEXT HELPER
// =========================================================

function setText(
    selectors,
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return;
    }


    for (const selector of selectors) {

        const elements =
            document.querySelectorAll(
                selector
            );


        if (!elements.length) {
            continue;
        }


        elements.forEach(element => {

            element.textContent =
                value;

        });


        break;
    }

}


// =========================================================
// PHONE NORMALIZER
// =========================================================

function normalizePhone(phone) {

    if (!phone) {
        return "";
    }


    let value =
        String(phone)
            .replace(/[^\d+]/g, "");


    if (
        value.startsWith("0") &&
        value.length === 10
    ) {

        value =
            "+91" +
            value.substring(1);

    }


    if (
        /^\d{10}$/.test(value)
    ) {

        value =
            "+91" +
            value;

    }


    return value;
}


// =========================================================
// PAGE TITLE
// =========================================================

function updatePageTitle(profile) {

    if (!profile.name) {
        return;
    }


    document.title =
        `${profile.name} | Ward ${
            profile.wardNumber || ""
        } | Parshd`;

}


// =========================================================
// LOADING CONTROL
// =========================================================

function showLoading() {

    const loadingElements =
        document.querySelectorAll(
            "#pageLoading, #loadingScreen, .page-loading, .loading-screen, [data-loading]"
        );


    loadingElements.forEach(element => {

        element.style.display =
            "flex";

    });

}


function hideLoading() {

    const loadingElements =
        document.querySelectorAll(
            "#pageLoading, #loadingScreen, .page-loading, .loading-screen, [data-loading]"
        );


    loadingElements.forEach(element => {

        element.style.display =
            "none";

    });

}


// =========================================================
// NO WARD STATE
// =========================================================

function showNoWardState() {

    const errorBox =
        document.querySelector(
            "#systemError, .system-error, [data-system-error]"
        );


    if (errorBox) {

        const messageElement =
            errorBox.querySelector(
                "[data-error-message], .error-message"
            );


        if (messageElement) {

            messageElement.textContent =
                "यह Parshd citizen portal है। कृपया अपने Parshad द्वारा दिया गया Ward QR code scan करें।";

        }


        errorBox.style.display =
            "flex";


        return;
    }


    // Fallback:
    // अगर HTML में error box नहीं है,
    // तो loading को बस hide कर दें।

    console.info(
        "No ward ID found. Open this website using a Ward QR code."
    );

}


// =========================================================
// WARD NOT FOUND
// =========================================================

function showWardNotFound() {

    const errorBox =
        document.querySelector(
            "#systemError, .system-error, [data-system-error]"
        );


    if (!errorBox) {
        return;
    }


    const messageElement =
        errorBox.querySelector(
            "[data-error-message], .error-message"
        );


    if (messageElement) {

        messageElement.textContent =
            "यह Ward अभी Parshd portal पर उपलब्ध नहीं है।";

    }


    errorBox.style.display =
        "flex";

}


// =========================================================
// SYSTEM ERROR
// =========================================================

function showSystemError(message) {

    console.error(message);


    const errorBox =
        document.querySelector(
            "#systemError, .system-error, [data-system-error]"
        );


    if (!errorBox) {
        return;
    }


    const messageElement =
        errorBox.querySelector(
            "[data-error-message], .error-message"
        );


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    errorBox.style.display =
        "flex";

}


// =========================================================
// GLOBAL APP ACCESS
// =========================================================

window.ParshdApp = {

    getState() {

        return {
            ...AppState
        };

    },


    reloadProfile() {

        if (!AppState.wardId) {
            return;
        }

        return loadWardProfile();

    },


    closeMenu

};
