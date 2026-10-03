// =========================================================
// PARSHD - STORAGE MODULE
// File: js/storage.js
// =========================================================

import { storage } from "./firebase-config.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";


// =========================================================
// STORAGE CONFIGURATION
// =========================================================

const STORAGE_ROOT = "parshd";

const MAX_IMAGES = 2;

const MAX_VIDEOS = 1;

const MAX_VIDEO_DURATION = 15; // seconds

// Individual file limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB

const MAX_VIDEO_SIZE = 25 * 1024 * 1024;  // 25 MB


// =========================================================
// ALLOWED TYPES
// =========================================================

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
];

const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime"
];


// =========================================================
// VALIDATE IMAGE
// =========================================================

export function validateImage(file) {

    if (!file) {
        return {
            valid: false,
            message: "Image file नहीं मिली।"
        };
    }


    if (
        !ALLOWED_IMAGE_TYPES.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "केवल JPG, PNG या WEBP image upload करें।"
        };

    }


    if (
        file.size > MAX_IMAGE_SIZE
    ) {

        return {
            valid: false,
            message:
                "एक image का maximum size 5 MB है।"
        };

    }


    return {
        valid: true,
        message: ""
    };

}


// =========================================================
// VALIDATE VIDEO FILE
// =========================================================

export function validateVideo(file) {

    if (!file) {
        return {
            valid: false,
            message: "Video file नहीं मिली।"
        };
    }


    if (
        !ALLOWED_VIDEO_TYPES.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "केवल MP4, WebM या MOV video upload करें।"
        };

    }


    if (
        file.size > MAX_VIDEO_SIZE
    ) {

        return {
            valid: false,
            message:
                "Video का maximum size 25 MB है।"
        };

    }


    return {
        valid: true,
        message: ""
    };

}


// =========================================================
// GET VIDEO DURATION
// =========================================================

export function getVideoDuration(file) {

    return new Promise((resolve, reject) => {

        if (!file) {

            reject(
                new Error(
                    "Video file नहीं मिली।"
                )
            );

            return;
        }


        const video =
            document.createElement("video");

        const objectURL =
            URL.createObjectURL(file);


        video.preload = "metadata";

        video.onloadedmetadata = () => {

            const duration =
                video.duration;

            URL.revokeObjectURL(
                objectURL
            );

            resolve(duration);

        };


        video.onerror = () => {

            URL.revokeObjectURL(
                objectURL
            );

            reject(
                new Error(
                    "Video duration read नहीं हो सकी।"
                )
            );

        };


        video.src = objectURL;

    });

}


// =========================================================
// VALIDATE VIDEO INCLUDING DURATION
// =========================================================

export async function validateVideoComplete(
    file
) {

    const basicValidation =
        validateVideo(file);


    if (!basicValidation.valid) {
        return basicValidation;
    }


    try {

        const duration =
            await getVideoDuration(file);


        if (
            duration >
            MAX_VIDEO_DURATION
        ) {

            return {
                valid: false,
                message:
                    "Video maximum 15 seconds का हो सकता है।"
            };

        }


        return {
            valid: true,
            message: "",
            duration
        };

    } catch (error) {

        console.error(
            "Video validation error:",
            error
        );


        return {
            valid: false,
            message:
                "Video verify नहीं हो सका। दूसरा video try करें।"
        };

    }

}


// =========================================================
// VALIDATE MEDIA COLLECTION
// =========================================================

export async function validateMedia(
    images = [],
    video = null
) {

    const imageFiles =
        Array.from(images || []);


    // -----------------------------------------
    // Image count
    // -----------------------------------------

    if (
        imageFiles.length >
        MAX_IMAGES
    ) {

        return {
            valid: false,
            message:
                "Maximum 2 photos upload कर सकते हैं।"
        };

    }


    // -----------------------------------------
    // Validate images
    // -----------------------------------------

    for (
        const image of imageFiles
    ) {

        const result =
            validateImage(image);


        if (!result.valid) {
            return result;
        }

    }


    // -----------------------------------------
    // Validate video
    // -----------------------------------------

    if (video) {

        const result =
            await validateVideoComplete(
                video
            );


        if (!result.valid) {
            return result;
        }

    }


    return {
        valid: true,
        message: ""
    };

}


// =========================================================
// UPLOAD SINGLE IMAGE
// =========================================================

export async function uploadImage(
    file,
    parshadId,
    complaintId,
    index = 1
) {

    const validation =
        validateImage(file);


    if (!validation.valid) {

        throw new Error(
            validation.message
        );

    }


    if (!parshadId) {
        throw new Error(
            "Parshad ID missing."
        );
    }


    if (!complaintId) {
        throw new Error(
            "Complaint ID missing."
        );
    }


    const extension =
        getExtension(file.name);


    const filePath =
        `${STORAGE_ROOT}/` +
        `${sanitizePath(parshadId)}/` +
        `complaints/` +
        `${sanitizePath(complaintId)}/` +
        `images/` +
        `image_${index}.${extension}`;


    const storageRef =
        ref(
            storage,
            filePath
        );


    const metadata = {

        contentType:
            file.type,

        customMetadata: {

            parshadId:
                String(parshadId),

            complaintId:
                String(complaintId),

            mediaType:
                "image"

        }

    };


    const snapshot =
        await uploadBytes(
            storageRef,
            file,
            metadata
        );


    const downloadURL =
        await getDownloadURL(
            snapshot.ref
        );


    return {

        type: "image",

        name: file.name,

        path: filePath,

        url: downloadURL,

        size: file.size,

        contentType: file.type

    };

}


// =========================================================
// UPLOAD VIDEO
// =========================================================

export async function uploadVideo(
    file,
    parshadId,
    complaintId
) {

    const validation =
        await validateVideoComplete(
            file
        );


    if (!validation.valid) {

        throw new Error(
            validation.message
        );

    }


    if (!parshadId) {
        throw new Error(
            "Parshad ID missing."
        );
    }


    if (!complaintId) {
        throw new Error(
            "Complaint ID missing."
        );
    }


    const extension =
        getExtension(file.name);


    const filePath =
        `${STORAGE_ROOT}/` +
        `${sanitizePath(parshadId)}/` +
        `complaints/` +
        `${sanitizePath(complaintId)}/` +
        `video/` +
        `complaint_video.${extension}`;


    const storageRef =
        ref(
            storage,
            filePath
        );


    const metadata = {

        contentType:
            file.type,

        customMetadata: {

            parshadId:
                String(parshadId),

            complaintId:
                String(complaintId),

            mediaType:
                "video",

            maxDuration:
                String(MAX_VIDEO_DURATION)

        }

    };


    const snapshot =
        await uploadBytes(
            storageRef,
            file,
            metadata
        );


    const downloadURL =
        await getDownloadURL(
            snapshot.ref
        );


    return {

        type: "video",

        name: file.name,

        path: filePath,

        url: downloadURL,

        size: file.size,

        contentType: file.type,

        duration:
            validation.duration || null

    };

}


// =========================================================
// UPLOAD ALL COMPLAINT MEDIA
// =========================================================

export async function uploadComplaintMedia(
    images,
    video,
    parshadId,
    complaintId
) {

    const imageFiles =
        Array.from(images || []);


    const validation =
        await validateMedia(
            imageFiles,
            video
        );


    if (!validation.valid) {

        throw new Error(
            validation.message
        );

    }


    const uploadedImages = [];


    // -----------------------------------------
    // Upload images
    // -----------------------------------------

    for (
        let index = 0;
        index < imageFiles.length;
        index++
    ) {

        const result =
            await uploadImage(
                imageFiles[index],
                parshadId,
                complaintId,
                index + 1
            );


        uploadedImages.push(
            result
        );

    }


    // -----------------------------------------
    // Upload video
    // -----------------------------------------

    let uploadedVideo = null;


    if (video) {

        uploadedVideo =
            await uploadVideo(
                video,
                parshadId,
                complaintId
            );

    }


    return {

        images:
            uploadedImages,

        video:
            uploadedVideo

    };

}


// =========================================================
// GET FILE EXTENSION
// =========================================================

function getExtension(
    filename
) {

    if (!filename) {
        return "file";
    }


    const parts =
        filename.split(".");


    if (parts.length < 2) {
        return "file";
    }


    return parts
        .pop()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

}


// =========================================================
// SANITIZE STORAGE PATH
// =========================================================

function sanitizePath(
    value
) {

    return String(value)
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");

}


// =========================================================
// STORAGE LIMITS
// =========================================================

export function getStorageLimits() {

    return {

        maxImages:
            MAX_IMAGES,

        maxVideos:
            MAX_VIDEOS,

        maxVideoDuration:
            MAX_VIDEO_DURATION,

        maxImageSize:
            MAX_IMAGE_SIZE,

        maxVideoSize:
            MAX_VIDEO_SIZE

    };

}


// =========================================================
// GLOBAL STORAGE API
// =========================================================

window.ParshdStorage = {

    validateImage,

    validateVideo,

    validateVideoComplete,

    validateMedia,

    uploadImage,

    uploadVideo,

    uploadComplaintMedia,

    getVideoDuration,

    getStorageLimits

};