// =========================================================
// PARSHD - COMPLAINT MODULE
// File: js/complaints.js
// =========================================================

import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    captureLocation
} from "./location.js";

import {
    validateMedia,
    uploadComplaintMedia
} from "./storage.js";


// =========================================================
// FIRESTORE NAMESPACE
// =========================================================

const PARSHD_ROOT = "parshd";

const WARDS_COLLECTION = "wards";

const COMPLAINTS_COLLECTION = "complaints";


// =========================================================
// COMPLAINT STATUS
// =========================================================

export const COMPLAINT_STATUS = {

    NEW: "new",

    PENDING: "pending",

    SOLVED: "solved"

};


// =========================================================
// VALIDATE CITIZEN DATA
// =========================================================

export function validateCitizenData(data) {

    const name =
        String(data.name || "").trim();

    const phone =
        String(data.phone || "").trim();

    const address =
        String(data.address || "").trim();

    const complaint =
        String(data.complaint || "").trim();

    const citizenWard =
        String(data.wardNumber || "").trim();

    const qrWard =
        String(data.qrWard || "").trim();


    // -----------------------------------------
    // Name
    // -----------------------------------------

    if (!name) {

        return {
            valid: false,
            message: "कृपया अपना नाम दर्ज करें।"
        };

    }


    if (name.length < 2) {

        return {
            valid: false,
            message: "कृपया सही नाम दर्ज करें।"
        };

    }


    // -----------------------------------------
    // Phone
    // -----------------------------------------

    const cleanPhone =
        phone.replace(/\D/g, "");


    if (!/^\d{10}$/.test(cleanPhone)) {

        return {
            valid: false,
            message:
                "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।"
        };

    }


    // -----------------------------------------
    // Address
    // -----------------------------------------

    if (!address) {

        return {
            valid: false,
            message:
                "कृपया अपना पता दर्ज करें।"
        };

    }


    // -----------------------------------------
    // Complaint
    // -----------------------------------------

    if (!complaint) {

        return {
            valid: false,
            message:
                "कृपया शिकायत की जानकारी लिखें।"
        };

    }


    if (complaint.length < 5) {

        return {
            valid: false,
            message:
                "कृपया शिकायत की पूरी जानकारी लिखें।"
        };

    }


    // -----------------------------------------
    // Ward
    // -----------------------------------------

    if (!citizenWard) {

        return {
            valid: false,
            message:
                "कृपया Ward Number दर्ज करें।"
        };

    }


    if (!qrWard) {

        return {
            valid: false,
            message:
                "QR Ward की जानकारी उपलब्ध नहीं है।"
        };

    }


    // -----------------------------------------
    // Ward Match
    // -----------------------------------------

    if (
        normalizeWard(citizenWard) !==
        normalizeWard(qrWard)
    ) {

        return {
            valid: false,
            message:
                `यह QR Ward ${qrWard} के लिए है। ` +
                `कृपया Ward ${qrWard} ही दर्ज करें।`
        };

    }


    return {
        valid: true,
        message: ""
    };

}


// =========================================================
// CHECK WARD STATUS
// =========================================================

export async function getWardStatus(
    wardId
) {

    if (!wardId) {

        throw new Error(
            "Ward ID missing."
        );

    }


    const wardRef = doc(
        db,
        PARSHD_ROOT,
        WARDS_COLLECTION,
        "data",
        String(wardId)
    );


    const snapshot =
        await getDoc(wardRef);


    if (!snapshot.exists()) {

        return {
            exists: false,
            active: false,
            complaintEnabled: false
        };

    }


    const data =
        snapshot.data();


    return {

        exists: true,

        active:
            data.active === true,

        complaintEnabled:
            data.complaintEnabled === true,

        parshadId:
            data.parshadId || "",

        wardNumber:
            data.wardNumber || wardId

    };

}


// =========================================================
// CREATE COMPLAINT
// =========================================================

export async function createComplaint(
    formData
) {

    if (!formData) {

        throw new Error(
            "Complaint data missing."
        );

    }


    const qrWard =
        String(
            formData.qrWard || ""
        ).trim();


    // =====================================================
    // 1. CHECK WARD
    // =====================================================

    if (!qrWard) {

        throw new Error(
            "QR Ward information missing."
        );

    }


    // =====================================================
    // 2. CHECK WARD STATUS BEFORE MEDIA UPLOAD
    // =====================================================

    const wardStatus =
        await getWardStatus(
            qrWard
        );


    if (!wardStatus.exists) {

        throw new Error(
            "यह Ward अभी registered नहीं है।"
        );

    }


    if (!wardStatus.active) {

        throw new Error(
            "यह Ward अभी active नहीं है।"
        );

    }


    if (!wardStatus.complaintEnabled) {

        throw new Error(
            "Complaint registration अभी temporarily बंद है।"
        );

    }


    // =====================================================
    // 3. VALIDATE CITIZEN + WARD
    // =====================================================

    const citizenValidation =
        validateCitizenData({

            name:
                formData.name,

            phone:
                formData.phone,

            address:
                formData.address,

            complaint:
                formData.complaint,

            wardNumber:
                formData.wardNumber,

            qrWard:
                qrWard

        });


    if (!citizenValidation.valid) {

        throw new Error(
            citizenValidation.message
        );

    }


    // =====================================================
    // 4. VALIDATE MEDIA BEFORE FIRESTORE
    // =====================================================

    const images =
        formData.images || [];

    const video =
        formData.video || null;


    const mediaValidation =
        await validateMedia(
            images,
            video
        );


    if (!mediaValidation.valid) {

        throw new Error(
            mediaValidation.message
        );

    }


    // =====================================================
    // 5. CAPTURE GPS
    // =====================================================

    const location =
        await captureLocation();


    // =====================================================
    // 6. CREATE COMPLAINT DOCUMENT
    // =====================================================

    const complaintData = {

        // -----------------------------------------
        // Tenant / Ward
        // -----------------------------------------

        parshadId:
            wardStatus.parshadId,

        wardId:
            String(qrWard),

        wardNumber:
            String(formData.wardNumber),


        // -----------------------------------------
        // Citizen
        // -----------------------------------------

        citizenName:
            String(formData.name).trim(),

        citizenPhone:
            normalizePhone(
                formData.phone
            ),

        address:
            String(formData.address).trim(),


        // -----------------------------------------
        // Complaint
        // -----------------------------------------

        complaintText:
            String(formData.complaint).trim(),


        // -----------------------------------------
        // Location
        // -----------------------------------------

        location: {

            latitude:
                location.latitude,

            longitude:
                location.longitude,

            accuracy:
                location.accuracy,

            capturedAt:
                location.timestamp

        },


        // -----------------------------------------
        // Media
        // -----------------------------------------

        media: {

            images: [],

            video: null

        },


        // -----------------------------------------
        // Status
        // -----------------------------------------

        status:
            COMPLAINT_STATUS.NEW,

        createdAt:
            serverTimestamp(),

        solvedAt:
            null

    };


    // =====================================================
    // 7. SAVE COMPLAINT
    // =====================================================

    const complaintsRef =
        collection(
            db,
            PARSHD_ROOT,
            COMPLAINTS_COLLECTION,
            "data",
            "items"
        );


    const complaintRef =
        await addDoc(
            complaintsRef,
            complaintData
        );


    const complaintId =
        complaintRef.id;


    // =====================================================
    // 8. UPLOAD MEDIA
    // =====================================================

    let uploadedMedia = {

        images: [],

        video: null

    };


    try {

        if (
            images.length > 0 ||
            video
        ) {

            uploadedMedia =
                await uploadComplaintMedia(
                    images,
                    video,
                    wardStatus.parshadId,
                    complaintId
                );

        }


        // =================================================
        // 9. SAVE MEDIA REFERENCES
        // =================================================

        await updateComplaintMedia(
            complaintId,
            uploadedMedia
        );


    } catch (uploadError) {

        console.error(
            "Media upload failed:",
            uploadError
        );


        /*
         Complaint already exists.

         We do NOT silently pretend media was uploaded.
         The complaint remains recorded and can be
         handled by the backend/admin recovery process.
        */

        throw new Error(
            "Complaint save हो गई, लेकिन media upload में समस्या आई। कृपया complaint status check करें।"
        );

    }


    // =====================================================
    // 10. RETURN RESULT
    // =====================================================

    return {

        success: true,

        complaintId,

        wardId:
            qrWard,

        status:
            COMPLAINT_STATUS.NEW

    };

}


// =========================================================
// UPDATE MEDIA REFERENCES
// =========================================================

async function updateComplaintMedia(
    complaintId,
    media
) {

    /*
     Firestore update is imported dynamically so this
     module keeps the initial imports lightweight.
    */

    const {
        updateDoc
    } = await import(
        "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js"
    );


    const complaintRef =
        doc(
            db,
            PARSHD_ROOT,
            COMPLAINTS_COLLECTION,
            "data",
            "items",
            complaintId
        );


    await updateDoc(
        complaintRef,
        {

            "media.images":
                media.images || [],

            "media.video":
                media.video || null

        }
    );

}


// =========================================================
// GET COMPLAINT
// =========================================================

export async function getComplaint(
    complaintId
) {

    if (!complaintId) {
        return null;
    }


    const complaintRef =
        doc(
            db,
            PARSHD_ROOT,
            COMPLAINTS_COLLECTION,
            "data",
            "items",
            complaintId
        );


    const snapshot =
        await getDoc(
            complaintRef
        );


    if (!snapshot.exists()) {
        return null;
    }


    return {

        id:
            snapshot.id,

        ...snapshot.data()

    };

}


// =========================================================
// GET COMPLAINTS FOR PARSHAD
// =========================================================

export async function getParshadComplaints(
    parshadId,
    status = null
) {

    if (!parshadId) {

        throw new Error(
            "Parshad ID missing."
        );

    }


    const complaintsRef =
        collection(
            db,
            PARSHD_ROOT,
            COMPLAINTS_COLLECTION,
            "data",
            "items"
        );


    const conditions = [

        where(
            "parshadId",
            "==",
            parshadId
        ),

        orderBy(
            "createdAt",
            "desc"
        ),

        limit(100)

    ];


    if (status) {

        conditions.splice(
            1,
            0,
            where(
                "status",
                "==",
                status
            )
        );

    }


    const q =
        query(
            complaintsRef,
            ...conditions
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        complaint => ({

            id:
                complaint.id,

            ...complaint.data()

        })
    );

}


// =========================================================
// NORMALIZE WARD
// =========================================================

function normalizeWard(
    ward
) {

    return String(ward || "")
        .trim()
        .replace(/^0+/, "")
        .toLowerCase();

}


// =========================================================
// NORMALIZE PHONE
// =========================================================

function normalizePhone(
    phone
) {

    let value =
        String(phone || "")
            .replace(/\D/g, "");


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


    return value;

}


// =========================================================
// GLOBAL API
// =========================================================

window.ParshdComplaints = {

    validateCitizenData,

    getWardStatus,

    createComplaint,

    getComplaint,

    getParshadComplaints

};