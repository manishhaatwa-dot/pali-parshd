// =========================================================
// PARSHD - ADMIN DASHBOARD
// File: admin/dashboard.js
// =========================================================

import {
    getDemoSession,
    demoLogout,
    requireDemoLogin
} from "./login.js";

import { db } from "../js/firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// =========================================================
// LOGIN CHECK
// =========================================================

const session = requireDemoLogin();

if (!session) {
    throw new Error("Demo login required");
}


// =========================================================
// FIRESTORE
// =========================================================

const COMPLAINTS_COLLECTION = [
    "parshd",
    "complaints",
    "data"
];


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
// LOAD ACCOUNT
// =========================================================

function getAccount() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "parshd_demo_account"
            ) || "null"
        );

    } catch (error) {

        console.error(
            "Account data error:",
            error
        );

        return null;
    }
}


// =========================================================
// LOAD PROFILE
// =========================================================

function getProfile() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "parshd_demo_profile"
            ) || "null"
        );

    } catch (error) {

        console.error(
            "Profile data error:",
            error
        );

        return null;
    }
}


// =========================================================
// CURRENT PROFILE
// =========================================================

function getCurrentProfile() {

    const account =
        getAccount();

    const profile =
        getProfile();


    return {

        name:
            profile?.name ||
            account?.name ||
            "Parshad",

        designation:
            profile?.designation ||
            "Ward Parshad",

        ward:
            profile?.ward ||
            account?.ward ||
            "",

        area:
            profile?.area ||
            account?.area ||
            "",

        phone:
            profile?.phone ||
            account?.mobile ||
            "",

        profilePhoto:
            profile?.profilePhoto ||
            "../assets/images/default-profile.png",

        partyLogo:
            profile?.partyLogo ||
            "../assets/images/default-logo.png",

        complaintEnabled:
            profile?.complaintEnabled !== false

    };
}


// =========================================================
// RENDER PROFILE
// =========================================================

function renderProfile() {

    const current =
        getCurrentProfile();


    if (welcomeTitle) {

        welcomeTitle.textContent =
            `Welcome, ${current.name}`;

    }


    if (profileName) {

        profileName.textContent =
            current.name;

    }


    if (profilePhoto) {

        profilePhoto.src =
            current.profilePhoto;

        profilePhoto.alt =
            current.name;


        profilePhoto.onerror =
            function () {

                this.onerror = null;

                this.src =
                    "../assets/images/default-profile.png";

            };

    }


    if (profileMeta) {

        const meta = [];


        if (current.ward) {

            meta.push(
                `Ward ${current.ward}`
            );

        }


        if (current.area) {

            meta.push(
                current.area
            );

        }


        if (current.phone) {

            meta.push(
                current.phone
            );

        }


        profileMeta.textContent =
            meta.join(" • ");

    }


    if (profileStatus) {

        profileStatus.textContent =
            current.complaintEnabled
                ? "Active"
                : "Complaints OFF";

    }

}


// =========================================================
// LOAD REAL FIRESTORE COMPLAINTS
// =========================================================

async function getComplaints() {

    try {

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


    } catch (error) {

        console.error(
            "Firestore complaints error:",
            error
        );


        throw error;

    }

}


// =========================================================
// WARD FILTER
// =========================================================

function getWardComplaints(
    complaints
) {

    const current =
        getCurrentProfile();


    if (!current.ward) {

        return [];

    }


    const currentWard =
        String(
            current.ward
        ).trim();


    return complaints.filter(
        complaint => {

            const complaintWard =
                String(
                    complaint.wardNumber ||
                    complaint.wardId ||
                    complaint.ward ||
                    ""
                ).trim();


            return (
                complaintWard ===
                currentWard
            );

        }
    );

}


// =========================================================
// UPDATE STATISTICS
// =========================================================

function updateStatistics(
    complaints
) {

    let newTotal = 0;

    let pendingTotal = 0;

    let solvedTotal = 0;


    complaints.forEach(
        complaint => {

            const status =
                String(
                    complaint.status ||
                    "new"
                ).toLowerCase();


            if (status === "new") {

                newTotal++;

            } else if (
                status === "pending"
            ) {

                pendingTotal++;

            } else if (
                status === "solved"
            ) {

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

function renderRecentComplaints(
    complaints
) {

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


    // Newest first

    const sorted =
        [...complaints].sort(
            (a, b) => {

                const dateA =
                    getTime(
                        a.createdAt
                    );


                const dateB =
                    getTime(
                        b.createdAt
                    );


                return dateB - dateA;

            }
        );


    const recent =
        sorted.slice(0, 5);


    recentComplaints.innerHTML =
        recent
            .map(
                createComplaintHTML
            )
            .join("");

}


// =========================================================
// COMPLAINT CARD
// =========================================================

function createComplaintHTML(
    complaint
) {

    const name =
        complaint.citizenName ||
        "Citizen";


    const text =
        complaint.complaintText ||
        "Complaint";


    const status =
        String(
            complaint.status ||
            "new"
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
        Array.isArray(
            media.images
        )
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

    } else if (
        imageCount > 0
    ) {

        mediaText =
            `📷 ${imageCount}`;

    } else if (
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

                    ${escapeHTML(
                        complaintId
                    )}

                    • 

                    ${escapeHTML(
                        date
                    )}

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
// DATE
// =========================================================

function getTime(
    value
) {

    if (!value) {
        return 0;
    }


    const time =
        new Date(
            value
        ).getTime();


    return Number.isFinite(time)
        ? time
        : 0;

}


function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    try {

        const date =
            new Date(
                value
            );


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

    } catch {

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
    // VIEW PORTAL
    // -----------------------------------------

    const portalButton =
        document.getElementById(
            "viewPortalButton"
        );


    if (portalButton) {

        portalButton.addEventListener(
            "click",
            () => {

                const current =
                    getCurrentProfile();


                if (!current.ward) {

                    alert(
                        "पहले Profile में Ward Number save करें।"
                    );

                    return;

                }


                const base =
                    window.location.origin +
                    window.location.pathname
                        .split("/admin/")[0];


                const url =
                    `${base}/?ward=${encodeURIComponent(
                        current.ward
                    )}`;


                window.open(
                    url,
                    "_blank"
                );

            }
        );

    }


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


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                demoLogout();

            }
        );

    }


    // -----------------------------------------
    // STAT CARDS
    // -----------------------------------------

    document
        .querySelectorAll(
            ".stat-card"
        )
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

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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
// LOAD DASHBOARD DATA
// =========================================================

async function loadDashboard() {

    try {

        renderProfile();


        if (dashboardLoading) {

            dashboardLoading.style.display =
                "block";

        }


        const allComplaints =
            await getComplaints();


        const wardComplaints =
            getWardComplaints(
                allComplaints
            );


        console.log(
            "All Firestore complaints:",
            allComplaints
        );


        console.log(
            "Current Ward complaints:",
            wardComplaints
        );


        updateStatistics(
            wardComplaints
        );


        renderRecentComplaints(
            wardComplaints
        );


    } catch (error) {

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
                        Complaints load नहीं हो सकीं
                    </strong>

                    <span>
                        कृपया page refresh करके दोबारा try करें।
                    </span>

                </div>

            `;

        }

    } finally {

        hideLoading();

    }

}


// =========================================================
// HIDE LOADING
// =========================================================

function hideLoading() {

    if (!dashboardLoading) {
        return;
    }


    dashboardLoading.style.display =
        "none";

}


// =========================================================
// INITIALIZE
// =========================================================

setupNavigation();

loadDashboard();


// =========================================================
// PAGE RETURN / REFRESH
// =========================================================

window.addEventListener(
    "pageshow",
    () => {

        loadDashboard();

    }
);
