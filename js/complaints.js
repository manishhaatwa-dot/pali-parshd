// =========================================================
// PARSHD - CITIZEN COMPLAINTS
// File: js/complaints.js
// =========================================================

import {
    db
} from "./firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    uploadComplaintMedia,
    validateComplaintMedia
} from "./storage.js";

import {
    getCurrentLocation
} from "./location.js";


// =========================================================
// FIRESTORE PATH
// =========================================================

const PARSHD_ROOT = "parshd";

const WARDS_PATH = [
    PARSHD_ROOT,
    "wards",
    "data"
];

const COMPLAINTS_PATH = [
    PARSHD_ROOT,
    "complaints",
    "data"
];


// =========================================================
// CREATE COMPLAINT
// =========================================================

async function createComplaint(data = {}) {

    // =====================================================
    // READ DATA
    // =====================================================

    const citizenName =
        String(
            data.citizenName || ""
        ).trim();

    const citizenPhone =
        String(
            data.citizenPhone || ""
        ).trim();

    const wardNumber =
        String(
            data.wardNumber || ""
        ).trim();

    const qrWard =
        String(
            data.qrWard || ""
        ).trim();

    const address =
        String(
            data.address || ""
        ).trim();

    const complaintText =
        String(
            data.complaintText || ""
        ).trim();

    const photos =
        Array.isArray(data.photos)
            ? data.photos
            : [];

    const video =
        data.video || null;

    let location =
        data.location || null;


    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!citizenName) {

        throw new Error(
            "कृपया अपना नाम दर्ज करें।"
        );

    }


    if (
        !/^[6-9]\d{9}$/.test(
            citizenPhone
        )
    ) {

        throw new Error(
            "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।"
        );

    }


    if (!wardNumber) {

        throw new Error(
            "Ward Number आवश्यक है।"
        );

    }


    if (!qrWard) {

        throw new Error(
            "QR Ward उपलब्ध नहीं है।"
        );

    }


    // =====================================================
    // WARD MATCH
    // =====================================================

    if (
        wardNumber.replace(/\s/g, "") !==
        qrWard.replace(/\s/g, "")
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


    if (address.length > 500) {

        throw new Error(
            "पता अधिकतम 500 characters का हो सकता है।"
        );

    }


    if (!complaintText) {

        throw new Error(
            "कृपया शिकायत की जानकारी दर्ज करें।"
        );

    }


    if (complaintText.length > 3000) {

        throw new Error(
            "शिकायत अधिकतम 3000 characters की हो सकती है।"
        );

    }


    // =====================================================
    // LOAD WARD
    // =====================================================

    const wardId =
        wardNumber;

    const wardRef =
        doc(
            db,
            ...WARDS_PATH,
            wardId
        );


    const wardSnapshot =
        await getDoc(
            wardRef
        );


    if (!wardSnapshot.exists()) {

        throw new Error(
            `Ward ${wardId} की जानकारी उपलब्ध नहीं है।`
        );

    }


    const ward =
        wardSnapshot.data();


    // =====================================================
    // WARD STATUS
    // =====================================================

    if (
        ward.active === false
    ) {

        throw new Error(
            "यह Ward अभी active नहीं है।"
        );

    }


    // =====================================================
    // COMPLAINT ENABLED
    // =====================================================

    if (
        ward.complaintEnabled === false
    ) {

        throw new Error(
            "इस Ward में अभी complaint registration बंद है।"
        );

    }


    // =====================================================
    // PARSHAD ID
    // =====================================================

    const parshadId =
        String(
            ward.parshadId || ""
        ).trim();


    if (!parshadId) {

        throw new Error(
            "इस Ward के लिए authorized Parshad उपलब्ध नहीं है।"
        );

    }


    // =====================================================
    // MEDIA VALIDATION
    // =====================================================

    try {

        if (
            typeof validateComplaintMedia ===
            "function"
        ) {

            await validateComplaintMedia({
                photos,
                video
            });

        }

    } catch (error) {

        throw new Error(
            error.message ||
            "Photo / video validation failed."
        );

    }


    // =====================================================
    // LOCATION
    // =====================================================

    if (!location) {

        try {

            location =
                await getCurrentLocation();

        } catch (error) {

            console.warn(
                "Location unavailable:",
                error
            );

            location = null;

        }

    }


    // =====================================================
    // CREATE COMPLAINT ID
    // =====================================================

    const complaintsCollection =
        collection(
            db,
            ...COMPLAINTS_PATH
        );


    const complaintRef =
        doc(
            complaintsCollection
        );


    const complaintId =
        complaintRef.id;


    // =====================================================
    // PUBLIC COMPLAINT ID
    // =====================================================

    const publicComplaintId =
        createPublicComplaintId(
            wardNumber
        );


    // =====================================================
    // COMPLAINT DATA
    // =====================================================

    const complaintData = {

        complaintId,

        publicComplaintId,

        parshadId,

        wardId,

        wardNumber,

        citizenName,

        citizenPhone,

        address,

        complaintText,

        location:
            location || null,

        media: {

            images: [],

            video: null

        },

        status: "new",

        createdAt:
            serverTimestamp(),

        solvedAt: null

    };


    // =====================================================
    // SAVE COMPLAINT
    // =====================================================

    await setDoc(
        complaintRef,
        complaintData
    );


    // =====================================================
    // MEDIA UPLOAD
    // =====================================================

    if (
        photos.length > 0 ||
        video
    ) {

        try {

            const media =
                await uploadComplaintMedia({

                    photos,

                    video,

                    parshadId,

                    complaintId

                });


            // ---------------------------------------------
            // SAVE MEDIA INFORMATION
            // ---------------------------------------------

            await setDoc(
                complaintRef,
                {
                    media
                },
                {
                    merge: true
                }
            );


        } catch (error) {

            console.error(
                "Complaint media upload error:",
                error
            );


            /*
             * Complaint document intentionally remains.
             * This prevents losing the citizen's complaint
             * if media upload fails.
             */

            throw new Error(
                "Complaint दर्ज हो गई, लेकिन photo/video upload नहीं हो सका। कृपया दोबारा कोशिश करें।"
            );

        }

    }


    // =====================================================
    // RETURN RESULT
    // =====================================================

    return {

        complaintId,

        publicComplaintId,

        parshadId,

        wardId,

        status: "new"

    };

}


// =========================================================
// PUBLIC COMPLAINT ID
// =========================================================

function createPublicComplaintId(
    wardNumber
) {

    const now =
        new Date();


    const year =
        now.getFullYear()
            .toString()
            .slice(-2);


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return (
        "P" +
        String(wardNumber) +
        "-" +
        year +
        month +
        day +
        "-" +
        random
    );

}


// =========================================================
// GET COMPLAINT
// =========================================================

async function getComplaint(
    complaintId
) {

    const value =
        String(
            complaintId || ""
        ).trim();


    if (!value) {

        return null;

    }


    // =====================================================
    // DIRECT DOCUMENT ID
    // =====================================================

    const directRef =
        doc(
            db,
            ...COMPLAINTS_PATH,
            value
        );


    const directSnapshot =
        await getDoc(
            directRef
        );


    if (
        directSnapshot.exists()
    ) {

        return {

            id:
                directSnapshot.id,

            ...directSnapshot.data()

        };

    }


    // =====================================================
    // PUBLIC ID SEARCH
    // =====================================================

    /*
     * Public ID search intentionally omitted here
     * because the current Firestore setup does not need
     * an open collection query from the citizen page.
     *
     * Direct complaint document lookup remains supported.
     */

    return null;

}


// =========================================================
// EXPORT
// =========================================================

export {

    createComplaint,

    getComplaint

};


// =========================================================
// GLOBAL API
// =========================================================

window.ParshdComplaints = {

    createComplaint,

    getComplaint

};
