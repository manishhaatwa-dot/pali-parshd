// =========================================================
// PARSHD - PROFILE MODULE
// File: js/profile.js
// =========================================================

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// =========================================================
// PARSHD FIRESTORE NAMESPACE
// =========================================================

const PARSHD_COLLECTION = "parshd";
const WARDS_COLLECTION = "wards";


// =========================================================
// GET WARD ID
// =========================================================

export function getCurrentWardId() {

    const pathParts =
        window.location.pathname
            .split("/")
            .filter(Boolean);

    const wardIndex =
        pathParts.indexOf("ward");

    if (
        wardIndex !== -1 &&
        pathParts[wardIndex + 1]
    ) {
        return decodeURIComponent(
            pathParts[wardIndex + 1]
        );
    }


    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("ward");
}


// =========================================================
// GET PUBLIC WARD PROFILE
// =========================================================

export async function getWardProfile(wardId) {

    if (!wardId) {
        throw new Error(
            "Ward ID is required."
        );
    }


    const profileRef = doc(
        db,
        PARSHD_COLLECTION,
        WARDS_COLLECTION,
        "data",
        wardId
    );


    const snapshot =
        await getDoc(profileRef);


    if (!snapshot.exists()) {
        return null;
    }


    const data = snapshot.data();


    /*
     Only return fields which are intended
     to be publicly displayed.

     Private/admin information should never
     be exposed by this module.
    */

    return {

        parshadId:
            data.parshadId || "",

        name:
            data.name || "",

        wardNumber:
            data.wardNumber || wardId,

        areaName:
            data.areaName || "",

        designation:
            data.designation || "Ward Parshad",

        profilePhoto:
            data.profilePhoto || "",

        partyLogo:
            data.partyLogo || "",

        phone:
            data.phone || "",

        whatsapp:
            data.whatsapp || "",

        about:
            data.about || "",

        complaintEnabled:
            data.complaintEnabled !== false,

        active:
            data.active === true

    };

}


// =========================================================
// CHECK WHETHER WARD IS ACTIVE
// =========================================================

export async function isWardActive(wardId) {

    const profile =
        await getWardProfile(wardId);


    if (!profile) {
        return false;
    }


    return profile.active === true;
}


// =========================================================
// CHECK COMPLAINT REGISTRATION
// =========================================================

export async function isComplaintEnabled(wardId) {

    const profile =
        await getWardProfile(wardId);


    if (!profile) {
        return false;
    }


    return profile.active === true &&
           profile.complaintEnabled === true;
}


// =========================================================
// FORMAT PHONE
// =========================================================

export function formatIndianPhone(phone) {

    if (!phone) {
        return "";
    }


    let value =
        String(phone)
            .replace(/[^\d]/g, "");


    if (
        value.length === 10
    ) {
        return "+91" + value;
    }


    if (
        value.startsWith("91") &&
        value.length === 12
    ) {
        return "+" + value;
    }


    return phone;
}


// =========================================================
// CREATE CALL LINK
// =========================================================

export function getCallLink(phone) {

    const number =
        formatIndianPhone(phone);

    if (!number) {
        return "";
    }

    return `tel:${number}`;
}


// =========================================================
// CREATE WHATSAPP LINK
// =========================================================

export function getWhatsAppLink(
    phone,
    message = ""
) {

    const number =
        formatIndianPhone(phone)
            .replace("+", "");

    if (!number) {
        return "";
    }


    const encodedMessage =
        encodeURIComponent(message);


    return encodedMessage

        ? `https://wa.me/${number}?text=${encodedMessage}`

        : `https://wa.me/${number}`;
}


// =========================================================
// APPLY PROFILE TO PAGE
// =========================================================

export function applyProfileToPage(
    profile
) {

    if (!profile) {
        return;
    }


    // -----------------------------------------
    // Profile photo
    // -----------------------------------------

    setImage(
        "#profilePhoto",
        profile.profilePhoto,
        "assets/images/default-profile.png"
    );


    // -----------------------------------------
    // Party logo
    // -----------------------------------------

    setImage(
        "#partyLogo",
        profile.partyLogo,
        "assets/images/default-logo.png"
    );


    // -----------------------------------------
    // Name
    // -----------------------------------------

    setText(
        "#parshadName",
        profile.name
    );


    // -----------------------------------------
    // Ward
    // -----------------------------------------

    setText(
        "#wardNumber",
        profile.wardNumber
            ? `वार्ड नंबर ${profile.wardNumber}`
            : ""
    );


    // -----------------------------------------
    // Area
    // -----------------------------------------

    setText(
        "#areaName",
        profile.areaName
    );


    // -----------------------------------------
    // Designation
    // -----------------------------------------

    setText(
        "#designation",
        profile.designation
    );


    // -----------------------------------------
    // About
    // -----------------------------------------

    setText(
        "#aboutText",
        profile.about
    );


    // -----------------------------------------
    // Call
    // -----------------------------------------

    setLink(
        "#callButton",
        getCallLink(profile.phone)
    );


    // -----------------------------------------
    // WhatsApp
    // -----------------------------------------

    setLink(
        "#whatsappButton",
        getWhatsAppLink(
            profile.whatsapp ||
            profile.phone
        )
    );

}


// =========================================================
// TEXT HELPER
// =========================================================

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(selector);


    if (!element) {
        return;
    }


    element.textContent =
        value || "";

}


// =========================================================
// IMAGE HELPER
// =========================================================

function setImage(
    selector,
    source,
    fallback
) {

    const element =
        document.querySelector(selector);


    if (!element) {
        return;
    }


    element.src =
        source || fallback;


    element.onerror = () => {

        element.onerror = null;

        element.src =
            fallback;

    };

}


// =========================================================
// LINK HELPER
// =========================================================

function setLink(
    selector,
    href
) {

    const element =
        document.querySelector(selector);


    if (!element) {
        return;
    }


    if (!href) {

        element.style.display =
            "none";

        return;
    }


    element.href =
        href;

    element.style.display =
        "";

}


// =========================================================
// LOAD AND APPLY CURRENT PROFILE
// =========================================================

export async function loadCurrentProfile() {

    const wardId =
        getCurrentWardId();


    if (!wardId) {

        console.warn(
            "Ward ID not found."
        );

        return null;
    }


    const profile =
        await getWardProfile(
            wardId
        );


    if (!profile) {

        console.warn(
            "Ward profile not found:",
            wardId
        );

        return null;
    }


    applyProfileToPage(
        profile
    );


    return profile;
}


// =========================================================
// GLOBAL PROFILE API
// =========================================================

window.ParshdProfile = {

    getCurrentWardId,

    getWardProfile,

    isWardActive,

    isComplaintEnabled,

    formatIndianPhone,

    getCallLink,

    getWhatsAppLink,

    applyProfileToPage,

    loadCurrentProfile

};