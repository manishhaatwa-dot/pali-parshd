// =========================================================
// PARSHD - QR / WARD ROUTING MODULE
// File: js/qr.js
// =========================================================


// =========================================================
// GET CURRENT WARD ID
// =========================================================

export function getWardId() {

    const path =
        window.location.pathname;

    const parts =
        path
            .split("/")
            .filter(Boolean);


    // -----------------------------------------
    // /ward/44
    // -----------------------------------------

    const wardIndex =
        parts.indexOf("ward");


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

    const params =
        new URLSearchParams(
            window.location.search
        );


    const ward =
        params.get("ward");


    if (ward) {
        return ward.trim();
    }


    return null;
}


// =========================================================
// NORMALIZE WARD
// =========================================================

export function normalizeWard(
    ward
) {

    return String(ward || "")
        .trim()
        .replace(/^0+/, "");

}


// =========================================================
// CREATE WARD URL
// =========================================================

export function createWardURL(
    wardId
) {

    if (!wardId) {
        return "";
    }


    const cleanWard =
        normalizeWard(
            wardId
        );


    const origin =
        window.location.origin;


    return (
        `${origin}/ward/` +
        encodeURIComponent(
            cleanWard
        )
    );

}


// =========================================================
// CREATE COMPLAINT URL
// =========================================================

export function createComplaintURL(
    wardId
) {

    if (!wardId) {
        return "";
    }


    return (
        `complaint.html?ward=` +
        encodeURIComponent(
            normalizeWard(wardId)
        )
    );

}


// =========================================================
// CREATE TRACK URL
// =========================================================

export function createTrackURL(
    wardId,
    complaintId = ""
) {

    if (!wardId) {
        return "";
    }


    let url =
        `track.html?ward=` +
        encodeURIComponent(
            normalizeWard(wardId)
        );


    if (complaintId) {

        url +=
            `&id=` +
            encodeURIComponent(
                complaintId
            );

    }


    return url;

}


// =========================================================
// CHECK WARD MATCH
// =========================================================

export function isWardMatch(
    qrWard,
    enteredWard
) {

    return (
        normalizeWard(qrWard) ===
        normalizeWard(enteredWard)
    );

}


// =========================================================
// BUILD QR DATA
// =========================================================

export function getQRData(
    wardId
) {

    const url =
        createWardURL(
            wardId
        );


    return {

        wardId:
            normalizeWard(wardId),

        url

    };

}


// =========================================================
// SET WARD LINKS ON CURRENT PAGE
// =========================================================

export function initializeWardLinks() {

    const wardId =
        getWardId();


    if (!wardId) {
        return null;
    }


    // -----------------------------------------
    // Complaint buttons
    // -----------------------------------------

    const complaintURL =
        createComplaintURL(
            wardId
        );


    document
        .querySelectorAll(
            "[data-complaint-link]"
        )
        .forEach(
            element => {

                element.href =
                    complaintURL;

            }
        );


    // -----------------------------------------
    // Track buttons
    // -----------------------------------------

    const trackURL =
        createTrackURL(
            wardId
        );


    document
        .querySelectorAll(
            "[data-track-link]"
        )
        .forEach(
            element => {

                element.href =
                    trackURL;

            }
        );


    // -----------------------------------------
    // Ward display
    // -----------------------------------------

    document
        .querySelectorAll(
            "[data-current-ward]"
        )
        .forEach(
            element => {

                element.textContent =
                    wardId;

            }
        );


    return wardId;

}


// =========================================================
// AUTO INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeWardLinks();

    }
);


// =========================================================
// GLOBAL API
// =========================================================

window.ParshdQR = {

    getWardId,

    normalizeWard,

    createWardURL,

    createComplaintURL,

    createTrackURL,

    isWardMatch,

    getQRData,

    initializeWardLinks

};