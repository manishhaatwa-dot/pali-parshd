// =========================================================
// PARSHD - ADMIN DASHBOARD
// Firebase Parshad Dashboard
// =========================================================

import {
    requireParshadLogin,
    parshadLogout
} from "./login.js";

import {
    auth,
    db
} from "../js/firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const welcomeTitle =
    document.getElementById("welcomeTitle");

const profilePhoto =
    document.getElementById("profilePhoto");

const profileName =
    document.getElementById("profileName");

const profileMeta =
    document.getElementById("profileMeta");

const profileStatus =
    document.getElementById("profileStatus");

const newCount =
    document.getElementById("newCount");

const pendingCount =
    document.getElementById("pendingCount");

const solvedCount =
    document.getElementById("solvedCount");

const recentComplaints =
    document.getElementById("recentComplaints");

const dashboardLoading =
    document.getElementById("dashboardLoading");


// =========================================================
// CURRENT PARSHAD
// =========================================================

let currentUser = null;
let currentParshad = null;
let currentProfile = null;


// =========================================================
// COLLECTIONS
// =========================================================

const PARSHADS_COLLECTION = [
    "parshd",
    "parshads",
    "data"
];

const WARDS_COLLECTION = [
    "parshd",
    "wards",
    "data"
];

const COMPLAINTS_COLLECTION = [
    "parshd",
    "complaints",
    "data"
];


// =========================================================
// SHOW LOADING
// =========================================================

function showLoading() {

    if (!dashboardLoading) {
        return;
    }

    dashboardLoading.style.display = "flex";
}


// =========================================================
// HIDE LOADING
// =========================================================

function hideLoading() {

    if (!dashboardLoading) {
        return;
    }

    dashboardLoading.style.display = "none";
}


// =========================================================
// LOAD PARSHAD ACCOUNT
// =========================================================

async function loadParshadAccount(uid) {

    const parshadRef =
        doc(
            db,
            ...PARSHADS_COLLECTION,
            uid
        );

    const snapshot =
        await getDoc(parshadRef);

    if (!snapshot.exists()) {

        throw new Error(
            "Parshad account record not found."
        );
    }

    return snapshot.data();
}


// =========================================================
// LOAD WARD PROFILE
// =========================================================

async function loadWardProfile(ward) {

    if (!ward) {
        return null;
    }

    const wardId =
        String(ward).trim();

    const wardRef =
        doc(
            db,
            ...WARDS_COLLECTION,
            wardId
        );

    const snapshot =
        await getDoc(wardRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}


// =========================================================
// LOAD COMPLAINTS
// =========================================================

async function getComplaints() {

    const complaintsRef =
        collection(
            db,
            ...COMPLAINTS_COLLECTION
        );

    const snapshot =
        await getDocs(
            complaintsRef
        );

    const complaints = [];

    snapshot.forEach(
        documentSnapshot => {

            complaints.push({

                id:
                    documentSnapshot.id,

                ...documentSnapshot.data()

            });

        }
    );

    return complaints;
}


// =========================================================
// FILTER CURRENT PARSHAD COMPLAINTS
// =========================================================

function getMyComplaints(complaints) {

    if (!currentUser) {
        return [];
    }

    const uid =
        currentUser.uid;

    return complaints.filter(
        complaint => {

            return String(
                complaint.parshadId || ""
            ) === String(uid);

        }
    );
}


// =========================================================
// RENDER PROFILE
// =========================================================

function renderProfile() {

    const parshad =
        currentParshad || {};

    const profile =
        currentProfile || {};

    const name =
        profile.name ||
        parshad.name ||
        "Parshad";

    const designation =
        profile.designation ||
        "Ward Parshad";

    const ward =
        profile.wardNumber ||
        profile.wardId ||
        parshad.ward ||
        "";

    const area =
        profile.areaName ||
        parshad.area ||
        "";

    const phone =
        profile.phone ||
        parshad.mobile ||
        "";

    const photo =
        profile.profilePhoto ||
        "../assets/images/default-profile.png";

    const complaintEnabled =
        profile.complaintEnabled !== false;


    // -----------------------------------------
    // WELCOME
    // -----------------------------------------

    if (welcomeTitle) {

        welcomeTitle.textContent =
            `Welcome, ${name}`;

    }


    // -----------------------------------------
    // NAME
    // -----------------------------------------

    if (profileName) {

        profileName.textContent =
            name;

    }


    // -----------------------------------------
    // PHOTO
    // -----------------------------------------

    if (profilePhoto) {

        profilePhoto.src =
            photo;

        profilePhoto.alt =
            name;

        profilePhoto.onerror =
            function () {

                this.onerror = null;

                this.src =
                    "../assets/images/default-profile.png";

            };

    }


    // -----------------------------------------
    // META
    // -----------------------------------------

    if (profileMeta) {

        const meta = [];

        if (designation) {
            meta.push(designation);
        }

        if (ward) {
            meta.push(`Ward ${ward}`);
        }

        if (area) {
            meta.push(area);
        }

        if (phone) {
            meta.push(phone);
        }

        profileMeta.textContent =
            meta.join(" • ");

    }


    // -----------------------------------------
    // STATUS
    // -----------------------------------------

    if (profileStatus) {

        profileStatus.textContent =
            complaintEnabled
                ? "Active"
                : "Complaints OFF";

    }

}


// =========================================================
// UPDATE STATISTICS
// =========================================================

function updateStatistics(complaints) {

    let newTotal = 0;
    let pendingTotal = 0;
    let solvedTotal = 0;

    complaints.forEach(
        complaint => {

            const status =
                String(
                    complaint.status || "new"
                ).toLowerCase();

            if (status === "new") {

                newTotal++;

            }

            else if (status === "pending") {

                pendingTotal++;

            }

            else if (status === "solved") {

                solvedTotal++;

            }

        }
    );


    if (newCount) {
        newCount.textContent =
            newTotal;
    }

    if (pendingCount) {
        pendingCount.textContent =
            pendingTotal;
    }

    if (solvedCount) {
        solvedCount.textContent =
            solvedTotal;
    }

}


// =========================================================
// RECENT COMPLAINTS
// =========================================================

function renderRecentComplaints(complaints) {

    if (!recentComplaints) {
        return;
    }

    if (!complaints.length) {

        recentComplaints.innerHTML = `

            <div class="empty-state">

                <div style="
                    font-size:32px;
                    margin-bottom:10px;
                ">
                    📋
                </div>

                <strong style="
                    display:block;
                    margin-bottom:5px;
                    color:#374151;
                ">
                    अभी कोई complaint नहीं है
                </strong>

                <span>
                    नई citizen complaints यहाँ दिखाई देंगी।
                </span>

            </div>

        `;

        return;
    }


    const sorted =
        [...complaints].sort(
            (a, b) => {

                return (
                    getTime(b.createdAt) -
                    getTime(a.createdAt)
                );

            }
        );


    const recent =
        sorted.slice(0, 5);


    recentComplaints.innerHTML =
        recent
            .map(createComplaintHTML)
            .join("");

}


// =========================================================
// COMPLAINT CARD
// =========================================================

function createComplaintHTML(complaint) {

    const name =
        complaint.citizenName ||
        "Citizen";

    const text =
        complaint.complaintText ||
        "Complaint";

    const status =
        String(
            complaint.status || "new"
        ).toLowerCase();

    const statusText =
        status === "new"
            ? "New"
            : status === "pending"
                ? "Pending"
                : status === "solved"
                    ? "Solved"
                    : status;

    const date =
        formatDate(
            complaint.createdAt
        );

    const complaintId =
        complaint.publicComplaintId ||
        complaint.complaintId ||
        complaint.id ||
        "";

    const media =
        complaint.media || {};

    const imageCount =
        Array.isArray(media.images)
            ? media.images.length
            : 0;

    const hasVideo =
        !!media.video;

    let mediaText = "";

    if (
        imageCount > 0 &&
        hasVideo
    ) {

        mediaText =
            `📷 ${imageCount} • 🎥 1`;

    }

    else if (
        imageCount > 0
    ) {

        mediaText =
            `📷 ${imageCount}`;

    }

    else if (
        hasVideo
    ) {

        mediaText =
            "🎥 1";

    }


    return `

        <div style="
            padding:17px 20px;
            border-bottom:1px solid #eef2f7;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:15px;
        ">

            <div style="
                min-width:0;
                flex:1;
            ">

                <strong style="
                    display:block;
                    font-size:14px;
                    color:#111827;
                    margin-bottom:4px;
                ">
                    ${escapeHTML(name)}
                </strong>

                <span style="
                    display:block;
                    font-size:13px;
                    color:#64748b;
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    max-width:700px;
                ">
                    ${escapeHTML(text)}
                </span>

                <small style="
                    display:block;
                    margin-top:5px;
                    color:#94a3b8;
                    font-size:11px;
                ">

                    ${escapeHTML(complaintId)}

                    •

                    ${escapeHTML(date)}

                    ${
                        mediaText
                            ? ` • ${escapeHTML(mediaText)}`
                            : ""
                    }

                </small>

            </div>

            <span style="
                flex-shrink:0;
                padding:5px 9px;
                border-radius:999px;
                font-size:11px;
                font-weight:700;
                background:${
                    status === "solved"
                        ? "#ecfdf5"
                        : status === "pending"
                            ? "#fff7ed"
                            : "#eff6ff"
                };
                color:${
                    status === "solved"
                        ? "#047857"
                        : status === "pending"
                            ? "#c2410c"
                            : "#2563eb"
                };
            ">
                ${escapeHTML(statusText)}
            </span>

        </div>

    `;

}


// =========================================================
// DATE HELPERS
// =========================================================

function getTime(value) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toDate === "function"
    ) {

        return value
            .toDate()
            .getTime();

    }

    const time =
        new Date(value).getTime();

    return Number.isFinite(time)
        ? time
        : 0;

}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    try {

        let date;

        if (
            typeof value.toDate === "function"
        ) {

            date =
                value.toDate();

        }

        else {

            date =
                new Date(value);

        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";

        }

        return date.toLocaleString(
            "hi-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    }

    catch {

        return "-";

    }

}


// =========================================================
// NAVIGATION
// =========================================================

function setupNavigation() {

    const complaintsButton =
        document.getElementById(
            "complaintsButton"
        );

    if (complaintsButton) {

        complaintsButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "complaints.html";

            }
        );

    }


    const profileButton =
        document.getElementById(
            "profileActionButton"
        );

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "profile.html";

            }
        );

    }


    const editProfileButton =
        document.getElementById(
            "editProfileButton"
        );

    if (editProfileButton) {

        editProfileButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "profile.html";

            }
        );

    }


    const qrButton =
        document.getElementById(
            "qrButton"
        );

    if (qrButton) {

        qrButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "profile.html#wardQR";

            }
        );

    }


    const settingsButton =
        document.getElementById(
            "settingsButton"
        );

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "profile.html#complaintSettings";

            }
        );

    }


    // -----------------------------------------
    // VIEW PUBLIC PORTAL
    // -----------------------------------------

    const portalButton =
        document.getElementById(
            "viewPortalButton"
        );

    if (portalButton) {

        portalButton.addEventListener(
            "click",
            () => {

                const ward =
                    currentProfile?.wardNumber ||
                    currentProfile?.wardId ||
                    currentParshad?.ward ||
                    "";

                if (!ward) {

                    alert(
                        "पहले Profile में Ward Number save करें।"
                    );

                    return;
                }

                const url =
                    `${window.location.origin}/?ward=${encodeURIComponent(
                        ward
                    )}`;

                window.open(
                    url,
                    "_blank"
                );

            }
        );

    }


    // -----------------------------------------
    // VIEW ALL COMPLAINTS
    // -----------------------------------------

    const viewAllButton =
        document.getElementById(
            "viewAllComplaintsButton"
        );

    if (viewAllButton) {

        viewAllButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "complaints.html";

            }
        );

    }


    // -----------------------------------------
    // LOGOUT
    // -----------------------------------------

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    await parshadLogout();

                }

                catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                }

            }
        );

    }


    // -----------------------------------------
    // STAT CARDS
    // -----------------------------------------

    document
        .querySelectorAll(".stat-card")
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const status =
                            card.dataset.status;

                        if (status) {

                            window.location.href =
                                `complaints.html?status=${encodeURIComponent(
                                    status
                                )}`;

                        }

                    }
                );

            }
        );

}


// =========================================================
// HTML SECURITY
// =========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// LOAD DASHBOARD
// =========================================================

async function loadDashboard() {

    try {

        showLoading();


        // -----------------------------------------
        // CURRENT USER
        // -----------------------------------------

        if (!currentUser) {

            throw new Error(
                "Firebase user not available."
            );

        }


        // -----------------------------------------
        // PARSHAD ACCOUNT
        // -----------------------------------------

        currentParshad =
            await loadParshadAccount(
                currentUser.uid
            );


        // -----------------------------------------
        // APPROVAL SAFETY CHECK
        // -----------------------------------------

        if (
            currentParshad.status !==
                "approved"
            ||
            currentParshad.approved !==
                true
        ) {

            await parshadLogout();

            return;

        }


        // -----------------------------------------
        // WARD PROFILE
        // -----------------------------------------

        currentProfile =
            await loadWardProfile(
                currentParshad.ward
            );


        // -----------------------------------------
        // RENDER PROFILE
        // -----------------------------------------

        renderProfile();


        // -----------------------------------------
        // COMPLAINTS
        // -----------------------------------------

        const allComplaints =
            await getComplaints();

        const myComplaints =
            getMyComplaints(
                allComplaints
            );


        console.log(
            "Current Parshad:",
            currentParshad
        );

        console.log(
            "Current Ward Profile:",
            currentProfile
        );

        console.log(
            "My Complaints:",
            myComplaints
        );


        // -----------------------------------------
        // STATS
        // -----------------------------------------

        updateStatistics(
            myComplaints
        );


        // -----------------------------------------
        // RECENT
        // -----------------------------------------

        renderRecentComplaints(
            myComplaints
        );

    }

    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        if (recentComplaints) {

            recentComplaints.innerHTML = `

                <div class="empty-state">

                    <div style="
                        font-size:32px;
                        margin-bottom:10px;
                    ">
                        ⚠️
                    </div>

                    <strong style="
                        display:block;
                        margin-bottom:5px;
                        color:#b91c1c;
                    ">
                        Dashboard load नहीं हो सका
                    </strong>

                    <span>
                        Page refresh करके दोबारा try करें।
                    </span>

                </div>

            `;

        }

    }

    finally {

        hideLoading();

    }

}


// =========================================================
// AUTH INITIALIZATION
// =========================================================

async function initializeDashboard() {

    try {

        showLoading();


        // Firebase login + email verification
        // + Manager approval check

        const allowed =
            await requireParshadLogin(
                "./index.html"
            );


        if (!allowed) {

            return;

        }


        // requireParshadLogin() ke baad
        // current Firebase session directly milega.

        currentUser =
            auth.currentUser;


        if (!currentUser) {

            window.location.replace(
                "./index.html"
            );

            return;

        }


        // Dashboard load

        await loadDashboard();

    }

    catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );


        if (recentComplaints) {

            recentComplaints.innerHTML = `

                <div class="empty-state">

                    <div style="
                        font-size:32px;
                        margin-bottom:10px;
                    ">
                        ⚠️
                    </div>

                    <strong style="
                        display:block;
                        margin-bottom:5px;
                        color:#b91c1c;
                    ">
                        Dashboard load नहीं हो सका
                    </strong>

                    <span>
                        Console में error check करें।
                    </span>

                </div>

            `;

        }

    }

    finally {

        hideLoading();

    }

}


// =========================================================
// INITIALIZE
// =========================================================

setupNavigation();

initializeDashboard();
