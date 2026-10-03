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
// CONFIG
// =========================================================

const PARSHD_ROOT = "parshd";


// =========================================================
// DEFAULT PROFILE
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
// PAGE START
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        initializeMenu();
        initializeButtons();
        initializeFooter();

        // -----------------------------------------
        // GET WARD FROM URL
        // -----------------------------------------

        AppState.wardId = getWardFromURL();

        console.log("Detected Ward:", AppState.wardId);


        // -----------------------------------------
        // NO WARD
        // -----------------------------------------

        if (!AppState.wardId) {

            showNoWardState();

            return;
        }


        // -----------------------------------------
        // LOAD WARD
        // -----------------------------------------

        await loadWardProfile();

    } catch (error) {

        console.error("Parshd App Error:", error);

        showSystemError(
            "कुछ तकनीकी समस्या हुई है। कृपया थोड़ी देर बाद फिर प्रयास करें।"
        );
    }

});


// =========================================================
// GET WARD FROM URL
// =========================================================

function getWardFromURL() {

    const path = window.location.pathname;

    const parts = path
        .split("/")
        .filter(Boolean);


    // -----------------------------------------
    // /ward/44
    // -----------------------------------------

    const wardIndex = parts.indexOf("ward");

    if (
        wardIndex !== -1 &&
        parts[wardIndex + 1]
    ) {

        return decodeURIComponent(
            parts[wardIndex + 1]
        );
    }


    // -----------------------------------------
    // ?ward=44
    // -----------------------------------------

    const params = new URLSearchParams(
        window.location.search
    );

    const wardParam = params.get("ward");

    if (wardParam) {
        return wardParam;
    }


    return null;
}


// =========================================================
// LOAD WARD PROFILE
// =========================================================

async function loadWardProfile() {

    AppState.loading = true;

    showLoader();


    try {

        const profileRef = doc(
            db,
            PARSHD_ROOT,
            "wards",
            "data",
            String(AppState.wardId)
        );


        const snapshot = await getDoc(profileRef);


        // -----------------------------------------
        // WARD FOUND
        // -----------------------------------------

        if (snapshot.exists()) {

            console.log(
                "Ward profile found:",
                snapshot.data()
            );


            AppState.profile = {
                ...DEFAULT_PROFILE,
                ...snapshot.data()
            };


            renderProfile();

            showApp();

            return;
        }


        // -----------------------------------------
        // WARD NOT FOUND
        // -----------------------------------------

        console.warn(
            "Ward does not exist:",
            AppState.wardId
        );


        showWardNotFound();


    } catch (error) {

        console.error(
            "Ward profile loading failed:",
            error
        );


        showSystemError(
            "Ward profile load नहीं हो सकी।"
        );


    } finally {

        AppState.loading = false;

        hideLoader();
    }

}


// =========================================================
// RENDER PROFILE
// =========================================================

function renderProfile() {

    const profile = AppState.profile;

    if (!profile) return;


    // -----------------------------------------
    // PARTY LOGO
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
    // PROFILE PHOTO
    // -----------------------------------------

    setImage(
        [
            "#parshadPhoto",
            "#profilePhoto",
            ".profile-photo",
            "[data-profile-photo]"
        ],
        profile.profilePhoto
    );


    // -----------------------------------------
    // NAME
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
    // DESIGNATION
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
    // WARD NUMBER
    // -----------------------------------------

    setText(
        [
            "#wardNumber",
            "#infoWardNumber",
            ".ward-number",
            "[data-ward-number]"
        ],
        profile.wardNumber
            ? profile.wardNumber
            : AppState.wardId
    );


    // -----------------------------------------
    // AREA
    // -----------------------------------------

    setText(
        [
            "#wardArea",
            "#infoWardArea",
            "#areaName",
            ".ward-area",
            ".area-name",
            "[data-ward-area]"
        ],
        profile.areaName || ""
    );


    // -----------------------------------------
    // ABOUT
    // -----------------------------------------

    renderAbout(profile);


    // -----------------------------------------
    // CONTACT
    // -----------------------------------------

    renderContact(profile);


    // -----------------------------------------
    // COMPLAINT STATUS
    // -----------------------------------------

    renderComplaintStatus(
        profile.complaintEnabled
    );


    // -----------------------------------------
    // TITLE
    // -----------------------------------------

    updatePageTitle(profile);

}


// =========================================================
// ABOUT
// =========================================================

function renderAbout(profile) {

    const aboutSection =
        document.querySelector("#aboutSection");


    const aboutText =
        document.querySelector("#aboutText");


    if (!aboutSection || !aboutText) {
        return;
    }


    if (profile.about) {

        aboutText.textContent =
            profile.about;

        aboutSection.classList.remove("hidden");

    } else {

        aboutSection.classList.add("hidden");
    }

}


// =========================================================
// CONTACT
// =========================================================

function renderContact(profile) {

    const phone =
        normalizePhone(profile.phone);


    const whatsapp =
        normalizePhone(
            profile.whatsapp ||
            profile.phone
        );


    const contactSection =
        document.querySelector("#contactSection");


    const callButton =
        document.querySelector("#callButton");


    const whatsappButton =
        document.querySelector("#whatsappButton");


    let hasContact = false;


    // -----------------------------------------
    // CALL
    // -----------------------------------------

    if (callButton && phone) {

        callButton.href =
            `tel:${phone}`;

        callButton.classList.remove("hidden");

        hasContact = true;

    } else if (callButton) {

        callButton.classList.add("hidden");
    }


    // -----------------------------------------
    // WHATSAPP
    // -----------------------------------------

    if (whatsappButton && whatsapp) {

        whatsappButton.href =
            `https://wa.me/${whatsapp}`;

        whatsappButton.target =
            "_blank";

        whatsappButton.rel =
            "noopener noreferrer";

        whatsappButton.classList.remove("hidden");

        hasContact = true;

    } else if (whatsappButton) {

        whatsappButton.classList.add("hidden");
    }


    // -----------------------------------------
    // CONTACT SECTION
    // -----------------------------------------

    if (contactSection) {

        if (hasContact) {

            contactSection.classList.remove(
                "hidden"
            );

        } else {

            contactSection.classList.add(
                "hidden"
            );
        }
    }

}


// =========================================================
// COMPLAINT STATUS
// =========================================================

function renderComplaintStatus(enabled) {

    const complaintButton =
        document.querySelector(
            "#registerComplaintButton"
        );


    const closedMessage =
        document.querySelector(
            "#complaintClosedMessage"
        );


    if (enabled === false) {

        if (complaintButton) {

            complaintButton.classList.add(
                "hidden"
            );
        }


        if (closedMessage) {

            closedMessage.classList.remove(
                "hidden"
            );
        }


        return;
    }


    // -----------------------------------------
    // ENABLED
    // -----------------------------------------

    if (complaintButton) {

        complaintButton.classList.remove(
            "hidden"
        );
    }


    if (closedMessage) {

        closedMessage.classList.add(
            "hidden"
        );
    }

}


// =========================================================
// BUTTONS
// =========================================================

function initializeButtons() {


    // -----------------------------------------
    // REGISTER COMPLAINT
    // -----------------------------------------

    const complaintButton =
        document.querySelector(
            "#registerComplaintButton"
        );


    if (complaintButton) {

        complaintButton.addEventListener(
            "click",
            openComplaint
        );
    }


    // -----------------------------------------
    // TRACK
    // -----------------------------------------

    const trackButton =
        document.querySelector(
            "#trackComplaintButton"
        );


    if (trackButton) {

        trackButton.addEventListener(
            "click",
            () => {

                const ward =
                    encodeURIComponent(
                        AppState.wardId || ""
                    );


                window.location.href =
                    `track.html?ward=${ward}`;
            }
        );
    }


    // -----------------------------------------
    // SOLVED
    // -----------------------------------------

    const solvedButton =
        document.querySelector(
            "#solvedProblemsButton"
        );


    if (solvedButton) {

        solvedButton.addEventListener(
            "click",
            () => {

                const ward =
                    encodeURIComponent(
                        AppState.wardId || ""
                    );


                window.location.href =
                    `track.html?ward=${ward}&status=solved`;
            }
        );
    }

}


// =========================================================
// OPEN COMPLAINT
// =========================================================

function openComplaint(event) {

    if (
        AppState.profile &&
        AppState.profile.complaintEnabled === false
    ) {

        event.preventDefault();

        renderComplaintStatus(false);

        return;
    }


    const ward =
        encodeURIComponent(
            AppState.wardId || ""
        );


    window.location.href =
        `complaint.html?ward=${ward}`;
}


// =========================================================
// MENU
// =========================================================

function initializeMenu() {

    const menuButton =
        document.querySelector(
            "#menuButton"
        );


    const sideMenu =
        document.querySelector(
            "#sideMenu"
        );


    const overlay =
        document.querySelector(
            "#menuOverlay"
        );


    const closeButton =
        document.querySelector(
            "#closeMenuButton"
        );


    if (!menuButton || !sideMenu) {
        return;
    }


    menuButton.addEventListener(
        "click",
        openMenu
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMenu
        );
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMenu
        );
    }


    // -----------------------------------------
    // HOME
    // -----------------------------------------

    const menuHome =
        document.querySelector("#menuHome");


    if (menuHome) {

        menuHome.addEventListener(
            "click",
            () => {

                closeMenu();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    }


    // -----------------------------------------
    // COMPLAINT
    // -----------------------------------------

    const menuComplaint =
        document.querySelector(
            "#menuComplaint"
        );


    if (menuComplaint) {

        menuComplaint.addEventListener(
            "click",
            () => {

                closeMenu();

                openComplaint({
                    preventDefault() {}
                });
            }
        );
    }


    // -----------------------------------------
    // TRACK
    // -----------------------------------------

    const menuTrack =
        document.querySelector("#menuTrack");


    if (menuTrack) {

        menuTrack.addEventListener(
            "click",
            () => {

                closeMenu();

                window.location.href =
                    `track.html?ward=${encodeURIComponent(
                        AppState.wardId || ""
                    )}`;
            }
        );
    }


    // -----------------------------------------
    // SOLVED
    // -----------------------------------------

    const menuSolved =
        document.querySelector("#menuSolved");


    if (menuSolved) {

        menuSolved.addEventListener(
            "click",
            () => {

                closeMenu();

                window.location.href =
                    `track.html?ward=${encodeURIComponent(
                        AppState.wardId || ""
                    )}&status=solved`;
            }
        );
    }

}


// =========================================================
// OPEN MENU
// =========================================================

function openMenu() {

    const sideMenu =
        document.querySelector(
            "#sideMenu"
        );


    const overlay =
        document.querySelector(
            "#menuOverlay"
        );


    if (sideMenu) {

        sideMenu.classList.add(
            "active"
        );

        sideMenu.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    if (overlay) {

        overlay.classList.remove(
            "hidden"
        );

        overlay.classList.add(
            "active"
        );
    }

}


// =========================================================
// CLOSE MENU
// =========================================================

function closeMenu() {

    const sideMenu =
        document.querySelector(
            "#sideMenu"
        );


    const overlay =
        document.querySelector(
            "#menuOverlay"
        );


    if (sideMenu) {

        sideMenu.classList.remove(
            "active"
        );

        sideMenu.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

        overlay.classList.add(
            "hidden"
        );
    }

}


// =========================================================
// LOADER
// =========================================================

function showLoader() {

    const loader =
        document.querySelector(
            "#appLoader"
        );


    const app =
        document.querySelector(
            "#app"
        );


    if (loader) {

        loader.style.display =
            "flex";
    }


    if (app) {

        app.classList.add(
            "hidden"
        );
    }

}


// =========================================================
// HIDE LOADER
// =========================================================

function hideLoader() {

    const loader =
        document.querySelector(
            "#appLoader"
        );


    if (loader) {

        loader.style.display =
            "none";
    }

}


// =========================================================
// SHOW APP
// =========================================================

function showApp() {

    const app =
        document.querySelector(
            "#app"
        );


    const error =
        document.querySelector(
            "#errorMessage"
        );


    if (app) {

        app.classList.remove(
            "hidden"
        );
    }


    if (error) {

        error.classList.add(
            "hidden"
        );
    }


    hideLoader();

}


// =========================================================
// NO WARD
// =========================================================

function showNoWardState() {

    hideLoader();


    const app =
        document.querySelector(
            "#app"
        );


    if (app) {

        app.classList.add(
            "hidden"
        );
    }


    showSystemError(
        "Ward information नहीं मिली। कृपया अपने वार्ड का सही QR code scan करें।"
    );

}


// =========================================================
// WARD NOT FOUND
// =========================================================

function showWardNotFound() {

    hideLoader();


    const app =
        document.querySelector(
            "#app"
        );


    if (app) {

        app.classList.add(
            "hidden"
        );
    }


    showSystemError(
        `Ward ${AppState.wardId} की जानकारी अभी उपलब्ध नहीं है।`
    );

}


// =========================================================
// SYSTEM ERROR
// =========================================================

function showSystemError(message) {

    console.error(
        "System Message:",
        message
    );


    hideLoader();


    const errorBox =
        document.querySelector(
            "#errorMessage"
        );


    const errorText =
        document.querySelector(
            "#errorText"
        );


    if (errorText) {

        errorText.textContent =
            message;
    }


    if (errorBox) {

        errorBox.classList.remove(
            "hidden"
        );
    }


    // -----------------------------------------
    // RELOAD
    // -----------------------------------------

    const reloadButton =
        document.querySelector(
            "#reloadButton"
        );


    if (
        reloadButton &&
        !reloadButton.dataset.bound
    ) {

        reloadButton.dataset.bound =
            "true";


        reloadButton.addEventListener(
            "click",
            () => {

                window.location.reload();
            }
        );
    }

}


// =========================================================
// IMAGE
// =========================================================

function setImage(
    selectors,
    source
) {

    if (!source) return;


    for (
        const selector of selectors
    ) {

        const elements =
            document.querySelectorAll(
                selector
            );


        if (!elements.length) {
            continue;
        }


        elements.forEach(
            element => {

                element.src =
                    source;


                element.onerror =
                    () => {

                        element.onerror =
                            null;


                        if (
                            selector.includes(
                                "profile"
                            ) ||
                            selector.includes(
                                "Photo"
                            )
                        ) {

                            element.src =
                                "assets/images/default-profile.png";

                        } else {

                            element.src =
                                "assets/images/default-logo.png";
                        }
                    };
            }
        );


        break;
    }

}


// =========================================================
// TEXT
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


    for (
        const selector of selectors
    ) {

        const elements =
            document.querySelectorAll(
                selector
            );


        if (!elements.length) {
            continue;
        }


        elements.forEach(
            element => {

                element.textContent =
                    value;
            }
        );


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
            .replace(
                /[^\d+]/g,
                ""
            );


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
            profile.wardNumber ||
            AppState.wardId ||
            ""
        } | Parshd`;

}


// =========================================================
// FOOTER YEAR
// =========================================================

function initializeFooter() {

    const year =
        document.querySelector(
            "#currentYear"
        );


    if (year) {

        year.textContent =
            new Date().getFullYear();
    }

}


// =========================================================
// GLOBAL APP API
// =========================================================

window.ParshdApp = {

    getState() {

        return {
            ...AppState
        };
    },


    reloadProfile() {

        return loadWardProfile();
    },


    closeMenu

};
