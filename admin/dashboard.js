// =========================================================
// PARSHD - ADMIN DASHBOARD
// File: admin/dashboard.js
// =========================================================

import {
    getDemoSession,
    demoLogout,
    requireDemoLogin
} from "./login.js";


// =========================================================
// LOGIN CHECK
// =========================================================

const session = requireDemoLogin();

if (!session) {
    throw new Error("Demo login required");
}


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
// CURRENT DATA
// =========================================================

let account =
    getAccount();

let profile =
    getProfile();


// =========================================================
// BUILD CURRENT PROFILE
// =========================================================

function getCurrentProfile() {

    account =
        getAccount();

    profile =
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


    console.log(
        "Dashboard Profile:",
        current
    );


    // -----------------------------------------
    // WELCOME
    // -----------------------------------------

    if (welcomeTitle) {

        welcomeTitle.textContent =
            `Welcome, ${current.name}`;

    }


    // -----------------------------------------
    // PROFILE NAME
    // -----------------------------------------

    if (profileName) {

        profileName.textContent =
            current.name;

    }


    // -----------------------------------------
    // PROFILE PHOTO
    // -----------------------------------------

    if (profilePhoto) {

        const photo =
            current.profilePhoto;


        console.log(
            "Dashboard photo:",
            photo
        );


        if (photo) {

            profilePhoto.src =
                photo;

        }


        profilePhoto.alt =
            current.name;


        profilePhoto.onerror =
            function () {

                console.warn(
                    "Profile image failed:",
                    this.src
                );


                this.onerror =
                    null;


                this.src =
                    "../assets/images/default-profile.png";

            };

    }


    // -----------------------------------------
    // PROFILE META
    // -----------------------------------------

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


    // -----------------------------------------
    // STATUS
    // -----------------------------------------

    if (profileStatus) {

        profileStatus.textContent =
            "Active";

    }

}


// =========================================================
// LOAD COMPLAINTS
// =========================================================

function getComplaints() {

    try {

        const saved =
            localStorage.getItem(
                "parshd_demo_complaints"
            );


        if (!saved) {

            return [];

        }


        const data =
            JSON.parse(saved);


        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Complaint data error:",
            error
        );

        return [];

    }

}


// =========================================================
// WARD FILTER
// =========================================================

function getWardComplaints() {

    const current =
        getCurrentProfile();


    const complaints =
        getComplaints();


    if (!current.ward) {

        return complaints;

    }


    return complaints.filter(
        complaint => {

            const complaintWard =
                complaint.wardNumber ||
                complaint.ward ||
                "";


            return String(
                complaintWard
            ) === String(
                current.ward
            );

        }
    );

}


// =========================================================
// UPDATE STATISTICS
// =========================================================

function updateStatistics() {

    const complaints =
        getWardComplaints();


    let newTotal = 0;
    let pendingTotal = 0;
    let solvedTotal = 0;


    complaints.forEach(
        complaint => {

            const status =
                complaint.status ||
                "new";


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

function renderRecentComplaints() {

    if (!recentComplaints) {
        return;
    }


    const complaints =
        getWardComplaints();


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
                    new Date(
                        a.createdAt || 0
                    ).getTime();


                const dateB =
                    new Date(
                        b.createdAt || 0
                    ).getTime();


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
// COMPLAINT HTML
// =========================================================

function createComplaintHTML(
    complaint
) {

    const name =
        complaint.citizenName ||
        complaint.name ||
        "Citizen";


    const text =
        complaint.complaintText ||
        complaint.complaint ||
        "Complaint";


    const status =
        complaint.status ||
        "new";


    const statusText =
        status === "new"
            ? "New"
            : status === "pending"
                ? "Pending"
                : "Solved";


    const date =
        formatDate(
            complaint.createdAt
        );


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
                    ${escapeHTML(date)}
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
                ${statusText}
            </span>

        </div>

    `;

}


// =========================================================
// DATE
// =========================================================

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    try {

        return new Date(
            value
        ).toLocaleString(
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


    // -----------------------------------------
    // COMPLAINTS
    // -----------------------------------------

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


    // -----------------------------------------
    // PROFILE
    // -----------------------------------------

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


    // -----------------------------------------
    // EDIT PROFILE
    // -----------------------------------------

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


    // -----------------------------------------
    // QR
    // -----------------------------------------

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


    // -----------------------------------------
    // SETTINGS
    // -----------------------------------------

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
                    `${base}/ward/${encodeURIComponent(
                        current.ward
                    )}`;


                window.open(
                    url,
                    "_blank"
                );

            }
        );

    }


    // -----------------------------------------
    // VIEW ALL
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
// INITIALIZE
// =========================================================

renderProfile();

updateStatistics();

renderRecentComplaints();

setupNavigation();

hideLoading();


// =========================================================
// REFRESH WHEN PAGE RETURNS
// =========================================================

window.addEventListener(
    "pageshow",
    () => {

        renderProfile();

        updateStatistics();

        renderRecentComplaints();

    }
);
