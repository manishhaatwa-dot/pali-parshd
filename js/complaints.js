// =========================================================
// PARSHD - COMPLAINT CONTROLLER
// File: js/complaints.js
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    uploadComplaintMedia
} from "./storage.js";

import {
    getCurrentLocation
} from "./location.js";


// =========================================================
// FIRESTORE PATHS
// =========================================================

// Ward profile:
// parshd / wards / data / {wardId}

const WARD_COLLECTION = [
    "parshd",
    "wards",
    "data"
];

// Complaints:
// parshd / complaints / data / {complaintId}
//
// IMPORTANT:
// "parshd/complaints/data/items" was INVALID because
// it had an even number of path segments.
// Therefore complaints are stored directly inside
// parshd/complaints/data.

const COMPLAINT_COLLECTION = [
    "parshd",
    "complaints",
    "data"
];


// =========================================================
// HELPERS
// =========================================================

function clean(value) {
    return String(value || "").trim();
}


function normalizeWard(value) {
    return clean(value).replace(/\s+/g, "");
}


function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}


function getFileExtension(file) {

    if (!file || !file.name) {
        return "";
    }

    const parts = file.name.split(".");

    if (parts.length < 2) {
        return "";
    }

    return parts.pop().toLowerCase();
}


function makeComplaintId() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (let i = 0; i < 10; i++) {
        result += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }

    return "PSH-" + result;
}


// =========================================================
// GET WARD
// =========================================================

export async function getWard(wardId) {

    const id = normalizeWard(wardId);

    if (!id) {
        throw new Error("Ward number नहीं मिला।");
    }

    const wardRef = doc(
        db,
        ...WARD_COLLECTION,
        id
    );

    const snap = await getDoc(wardRef);

    if (!snap.exists()) {
        throw new Error(
            "यह Ward अभी registered नहीं है।"
        );
    }

    return {
        id,
        ...snap.data()
    };
}


// =========================================================
// CREATE COMPLAINT
// =========================================================

export async function createComplaint(data) {

    // -----------------------------------------------------
    // BASIC DATA
    // -----------------------------------------------------

    const citizenName =
        clean(data.citizenName);

    const citizenPhone =
        clean(data.citizenPhone);

    const wardNumber =
        normalizeWard(data.wardNumber);

    const qrWard =
        normalizeWard(
            data.qrWard ||
            data.wardId ||
            ""
        );

    const address =
        clean(data.address);

    const complaintText =
        clean(
            data.complaintText ||
            data.complaint ||
            ""
        );


    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!citizenName) {
        throw new Error(
            "कृपया अपना नाम दर्ज करें।"
        );
    }


    if (!isValidPhone(citizenPhone)) {
        throw new Error(
            "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।"
        );
    }


    if (!wardNumber) {
        throw new Error(
            "Ward Number दर्ज करें।"
        );
    }


    // QR Ward और entered Ward MUST match

    if (
        qrWard &&
        wardNumber !== qrWard
    ) {
        throw new Error(
            "Ward Number QR वाले Ward से match नहीं करता।"
        );
    }


    if (!address) {
        throw new Error(
            "कृपया अपना पता / स्थान दर्ज करें।"
        );
    }


    if (!complaintText) {
        throw new Error(
            "कृपया शिकायत की जानकारी दर्ज करें।"
        );
    }


    // -----------------------------------------------------
    // GET WARD PROFILE
    // -----------------------------------------------------

    const ward = await getWard(
        wardNumber
    );


    // -----------------------------------------------------
    // CHECK WARD STATUS
    // -----------------------------------------------------

    if (
        ward.active === false ||
        ward.status === "suspended"
    ) {
        throw new Error(
            "यह Ward portal अभी उपलब्ध नहीं है।"
        );
    }


    // -----------------------------------------------------
    // COMPLAINT REGISTRATION TOGGLE
    // -----------------------------------------------------

    if (
        ward.complaintEnabled === false
    ) {
        throw new Error(
            "Complaint registration is temporarily unavailable. Please try again after some time."
        );
    }


    // -----------------------------------------------------
    // FILES
    // -----------------------------------------------------

    const photos =
        Array.from(
            data.photos || []
        );

    const video =
        data.video || null;


    // Maximum 2 photos

    if (photos.length > 2) {
        throw new Error(
            "अधिकतम 2 photos upload कर सकते हैं।"
        );
    }


    // -----------------------------------------------------
    // PHOTO VALIDATION
    // -----------------------------------------------------

    const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    const maxImageSize =
        5 * 1024 * 1024;


    for (const photo of photos) {

        if (
            !allowedImageTypes.includes(
                photo.type
            )
        ) {
            throw new Error(
                "केवल JPG, PNG या WEBP image upload करें।"
            );
        }


        if (
            photo.size > maxImageSize
        ) {
            throw new Error(
                "हर photo अधिकतम 5 MB की हो सकती है।"
            );
        }
    }


    // -----------------------------------------------------
    // VIDEO VALIDATION
    // -----------------------------------------------------

    if (video) {

        const allowedVideoTypes = [
            "video/mp4",
            "video/webm",
            "video/quicktime"
        ];

        const maxVideoSize =
            25 * 1024 * 1024;


        if (
            !allowedVideoTypes.includes(
                video.type
            )
        ) {
            throw new Error(
                "केवल MP4, WEBM या MOV video upload करें।"
            );
        }


        if (
            video.size > maxVideoSize
        ) {
            throw new Error(
                "Video अधिकतम 25 MB की हो सकती है।"
            );
        }


        // -------------------------------------------------
        // VIDEO DURATION CHECK
        // -------------------------------------------------

        await validateVideoDuration(
            video
        );
    }


    // -----------------------------------------------------
    // GPS LOCATION
    // -----------------------------------------------------

    let location = null;

    try {

        location =
            await getCurrentLocation();

    } catch (error) {

        // GPS fail होने पर complaint block नहीं होगी.

        location = null;
    }


    // -----------------------------------------------------
    // CREATE COMPLAINT DOCUMENT REFERENCE
    // -----------------------------------------------------

    const complaintCollection =
        collection(
            db,
            ...COMPLAINT_COLLECTION
        );


    // Auto generated Firestore document ID

    const complaintRef =
        doc(
            complaintCollection
        );


    const complaintId =
        complaintRef.id;


    // -----------------------------------------------------
    // PUBLIC TRACK ID
    // -----------------------------------------------------

    const publicComplaintId =
        makeComplaintId();


    // -----------------------------------------------------
    // COMPLAINT DATA
    // -----------------------------------------------------

    const complaintData = {

        complaintId,

        publicComplaintId,

        parshadId:
            ward.parshadId ||
            ward.id ||
            wardNumber,

        wardId:
            ward.id ||
            wardNumber,

        wardNumber,

        citizenName,

        citizenPhone,

        address,

        complaintText,

        location,

        media: {
            images: [],
            video: null
        },

        status: "new",

        createdAt: new Date().toISOString(),

        solvedAt: null
    };


    // -----------------------------------------------------
    // SAVE COMPLAINT FIRST
    // -----------------------------------------------------

    await setDoc(
        complaintRef,
        complaintData
    );


    // -----------------------------------------------------
    // UPLOAD MEDIA
    // -----------------------------------------------------

    try {

        if (
            photos.length > 0 ||
            video
        ) {

            const media =
                await uploadComplaintMedia({

                    parshadId:
                        complaintData.parshadId,

                    complaintId,

                    photos,

                    video
                });


            // -------------------------------------------------
            // UPDATE MEDIA REFERENCES
            // -------------------------------------------------

            await setDoc(
                complaintRef,
                {
                    media: media || {
                        images: [],
                        video: null
                    }
                },
                {
                    merge: true
                }
            );


            complaintData.media =
                media || {
                    images: [],
                    video: null
                };
        }


    } catch (error) {

        console.error(
            "Media upload error:",
            error
        );

        /*
         * Complaint document intentionally remains.
         * इससे complaint data खोता नहीं है अगर
         * photo/video upload में temporary problem आए.
         */

        throw new Error(
            "शिकायत save हो गई, लेकिन photo/video upload नहीं हो पाया। कृपया बाद में media के साथ दोबारा try करें।"
        );
    }


    // -----------------------------------------------------
    // RESULT
    // -----------------------------------------------------

    return {

        success: true,

        complaintId,

        publicComplaintId,

        wardNumber,

        status: "new",

        location,

        media:
            complaintData.media
    };
}


// =========================================================
// VIDEO DURATION VALIDATION
// =========================================================

function validateVideoDuration(file) {

    return new Promise(
        (resolve, reject) => {

            const video =
                document.createElement(
                    "video"
                );

            const url =
                URL.createObjectURL(
                    file
                );


            video.preload = "metadata";


            video.onloadedmetadata =
                () => {

                    URL.revokeObjectURL(
                        url
                    );


                    const duration =
                        Number(
                            video.duration
                        );


                    if (
                        !Number.isFinite(
                            duration
                        )
                    ) {

                        reject(
                            new Error(
                                "Video duration पढ़ी नहीं जा सकी।"
                            )
                        );

                        return;
                    }


                    if (
                        duration > 15
                    ) {

                        reject(
                            new Error(
                                "Video अधिकतम 15 seconds की हो सकती है।"
                            )
                        );

                        return;
                    }


                    resolve(true);
                };


            video.onerror =
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                    reject(
                        new Error(
                            "Video file valid नहीं है।"
                        )
                    );
                };


            video.src = url;
        }
    );
}


// =========================================================
// GET COMPLAINT
// =========================================================

export async function getComplaint(
    complaintId
) {

    const id =
        clean(complaintId);


    if (!id) {
        throw new Error(
            "Complaint ID नहीं मिली।"
        );
    }


    const complaintCollection =
        collection(
            db,
            ...COMPLAINT_COLLECTION
        );


    // First try Firestore document ID

    const directRef =
        doc(
            complaintCollection,
            id
        );


    const snap =
        await getDoc(
            directRef
        );


    if (!snap.exists()) {

        throw new Error(
            "Complaint नहीं मिली।"
        );
    }


    return {

        id: snap.id,

        ...snap.data()
    };
}


// =========================================================
// EXPORTS
// =========================================================

export default {

    createComplaint,

    getComplaint,

    getWard
};
