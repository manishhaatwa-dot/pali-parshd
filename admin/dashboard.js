// =========================================================
// PARSHD - DEMO ADMIN DASHBOARD
// File: admin/dashboard.js
// =========================================================

import {
    getDemoSession,
    demoLogout,
    requireDemoLogin
} from "./login.js";


// =========================================================
// REQUIRE LOGIN
// =========================================================

const session = requireDemoLogin();

if (!session) {
    throw new Error("Demo login required");
}


// =========================================================
// ELEMENTS
// =========================================================

const profileName =
    document.querySelector("#profileName");

const profileMeta =
    document.querySelector("#profileMeta");

const profileStatus =
    document.querySelector("#profileStatus");

const profilePhoto =
    document.querySelector("#profilePhoto");

const welcomeName =
    document.querySelector("#welcomeName");

const newCount =
    document.querySelector("#newCount");

const pendingCount =
    document.querySelector("#pendingCount");

const solvedCount =
    document.querySelector("#solvedCount");

const recentComplaints =
    document.querySelector("#recentComplaints");


// =========================================================
// LOAD ACCOUNT
// =========================================================

const account =
    JSON.parse(
        localStorage.getItem(
            "parshd_demo_account"
        ) || "null"
    );


// =========================================================
// LOAD PROFILE
// =========================================================

const profile =
    JSON.parse(
        localStorage.getItem(
            "parshd_demo_profile"
        ) || "null"
    );


// =========================================================
// USE PROFILE FIRST
// =========================================================

const currentProfile = {

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


// =========================================================
// RENDER PROFILE
// =========================================================

function renderProfile() {

    // -----------------------------------------
    // Welcome
    // -----------------------------------------

    if (welcomeName) {

        welcomeName.textContent =
            currentProfile.name;

    }


    // -----------------------------------------
    // Profile name
    // -----------------------------------------

    if (profileName) {

        profileName.textContent =
            currentProfile.name;

    }


    // -----------------------------------------
    // Profile meta
    // -----------------------------------------

    if (profileMeta) {

        const parts = [];


        if (currentProfile.ward) {

            parts.push(
                `Ward ${currentProfile.ward}`
            );

        }


        if (currentProfile.area) {

            parts.push(
                currentProfile.area
            );

        }


        if (currentProfile.phone) {

            parts.push(
                currentProfile.phone
            );

        }


        profileMeta.textContent =
            parts.join(" • ");

    }


    // -----------------------------------------
    // Status
    // -----------------------------------------

    if (profileStatus) {

        profileStatus.textContent =
            "Active";

    }


    // -----------------------------------------
    // Profile Photo
    // -----------------------------------------

    if (profilePhoto) {

        profilePhoto.src =
            currentProfile.profilePhoto;


        profilePhoto.onerror =
            () => {

                profilePhoto.onerror =
                    null;

                profilePhoto.src =
                    "../assets/images/default-profile.png";
            };

    }

}


// =========================================================
// LOAD COMPLAINTS
// =========================================================

function loadComplaints() {

    let complaints = [];


    try {

        const saved =
            localStorage.getItem(
                "parshd_demo_complaints"
            );


        if (saved) {

            complaints =
                JSON.parse(saved);

        }

    } catch (error) {

        console.error(
            "Complaint loading error:",
            error
        );

        complaints = [];

    }


    // -----------------------------------------
    // Ward filter
    // -----------------------------------------

    complaints =
        complaints.filter(
            complaint => {

                if (
                    !currentProfile.ward
                ) {

                    return true;
                }


                return String(
                    complaint.wardNumber ||
                    complaint.ward ||
                    ""
                ) === String(
                    currentProfile.ward
                );

            }
        );


    // -----------------------------------------
    // Counts
    // -----------------------------------------

    const newComplaints =
        complaints.filter(
            complaint =>
                (complaint.status || "new")
                === "new"
        );


    const pendingComplaints =
        complaints.filter(
            complaint =>
                complaint.status
                === "pending"
        );


    const solvedComplaints =
        complaints.filter(
            complaint =>
                complaint.status
                === "solved"
        );


    if (newCount) {

        newCount.textContent =
            newComplaints.length;

    }


    if (pendingCount) {

        pendingCount.textContent =
            pendingComplaints.length;

    }


    if (solvedCount) {

        solvedCount.textContent =
            solvedComplaints.length;

    }


    // -----------------------------------------
    // Recent
    // -----------------------------------------

    renderRecentComplaints(
        complaints
    );

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

                <div class="empty-icon">
                    📋
                </div>

                <strong>
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
        [...complaints]
            .sort(
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
            )
            .slice(0, 5);


    recentComplaints.innerHTML =
        sorted
            .map(
                complaint =>
                    createRecentComplaint(
                        complaint
                    )
            )
            .join("");

}


// =========================================================
// RECENT COMPLAINT CARD
// =========================================================

function createRecentComplaint(
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

        <div class="recent-complaint">

            <div class="recent-left">

                <strong>
                    ${escapeHtml(name)}
                </strong>

                <span>
                    ${escapeHtml(text)}
                </span>

                <small>
                    ${escapeHtml(date)}
                </small>

            </div>


            <span
                class="dashboard-status status-${status}"
            >
                ${statusText}
            </span>

        </div>

    `;

}


// =========================================================
// NAVIGATION
// =========================================================

function setupNavigation() {


    // -----------------------------------------
    // Complaints
    // -----------------------------------------

    const complaintsButton =
        document.querySelector(
            "#complaintsButton"
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
    // Profile
    // -----------------------------------------

    const profileButton =
        document.querySelector(
            "#profileButton"
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
    // Edit Profile
    // -----------------------------------------

    const editProfileButton =
        document.querySelector(
            "#editProfileButton"
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
    // Ward QR
    // -----------------------------------------

    const qrButton =
        document.querySelector(
            "#qrButton"
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
    // Complaint Settings
    // -----------------------------------------

    const settingsButton =
        document.querySelector(
            "#settingsButton"
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
    // Portal
    // -----------------------------------------

    const portalButton =
        document.querySelector(
            "#portalButton"
        );


    if (portalButton) {

        const ward =
            currentProfile.ward;


        if (ward) {

            portalButton.addEventListener(
                "click",
                () => {

                    const base =
                        window.location.origin +
                        window.location.pathname
                            .split("/admin/")[0];


                    window.open(
                        `${base}/ward/${encodeURIComponent(ward)}`,
                        "_blank"
                    );

                }
            );

        }

    }


    // -----------------------------------------
    // View All
    // -----------------------------------------

    const viewAllButton =
        document.querySelector(
            "#viewAllComplaints"
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
    // Logout
    // -----------------------------------------

    const logoutButton =
        document.querySelector(
            "#logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                demoLogout();

            }
        );

    }

}


// =========================================================
// DATE FORMAT
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
// HTML SECURITY
// =========================================================

function escapeHtml(
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

loadComplaints();

setupNavigation();


// =========================================================
// REFRESH PROFILE WHEN RETURNING TO DASHBOARD
// =========================================================

window.addEventListener(
    "pageshow",
    () => {

        const freshProfile =
            JSON.parse(
                localStorage.getItem(
                    "parshd_demo_profile"
                ) || "null"
            );


        if (freshProfile) {

            currentProfile.name =
                freshProfile.name ||
                currentProfile.name;


            currentProfile.ward =
                freshProfile.ward ||
                currentProfile.ward;


            currentProfile.area =
                freshProfile.area ||
                currentProfile.area;


            currentProfile.phone =
                freshProfile.phone ||
                currentProfile.phone;


            currentProfile.profilePhoto =
                freshProfile.profilePhoto ||
                currentProfile.profilePhoto;


            currentProfile.partyLogo =
                freshProfile.partyLogo ||
                currentProfile.partyLogo;


            currentProfile.complaintEnabled =
                freshProfile.complaintEnabled !== false;


            renderProfile();

            loadComplaints();

        }

    }
);
