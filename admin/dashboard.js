import {
    getDemoSession,
    demoLogout,
    requireDemoLogin
} from "./login.js";


// =====================================
// LOGIN CHECK
// =====================================

if (!requireDemoLogin()) {
    throw new Error("Demo login required");
}


// =====================================
// ELEMENTS
// =====================================

const profileName =
    document.getElementById("profileName");

const profileMeta =
    document.getElementById("profileMeta");

const profilePhoto =
    document.getElementById("profilePhoto");

const profileStatus =
    document.getElementById("profileStatus");

const welcomeTitle =
    document.getElementById("welcomeTitle");

const newCount =
    document.getElementById("newCount");

const pendingCount =
    document.getElementById("pendingCount");

const solvedCount =
    document.getElementById("solvedCount");

const recentComplaints =
    document.getElementById("recentComplaints");

const loading =
    document.getElementById("dashboardLoading");


// =====================================
// DEMO ACCOUNT
// =====================================

function getAccount() {

    try {

        const saved =
            localStorage.getItem(
                "parshd_demo_account"
            );

        return saved
            ? JSON.parse(saved)
            : null;

    } catch (error) {

        console.error(
            "Account read error:",
            error
        );

        return null;
    }
}


const account = getAccount();

const session =
    getDemoSession();


// =====================================
// ACCOUNT CHECK
// =====================================

if (!account || !session) {

    window.location.href =
        "./index.html";

    throw new Error(
        "Demo account/session missing"
    );
}


// =====================================
// PROFILE DATA
// =====================================

function loadProfile() {

    const name =
        account.name || "Parshad";

    const ward =
        account.ward || "-";

    const area =
        account.area || "Ward Area";

    const mobile =
        account.mobile || "";


    profileName.textContent =
        name;


    profileMeta.textContent =
        `Ward ${ward} • ${area}` +
        (mobile ? ` • ${mobile}` : "");


    welcomeTitle.textContent =
        `Welcome, ${name}`;


    profileStatus.textContent =
        account.status === "active"
            ? "Active"
            : "Inactive";


    if (account.profilePhoto) {

        profilePhoto.src =
            account.profilePhoto;

    }


    // Complaint registration status

    if (
        account.complaintEnabled === false
    ) {

        profileStatus.textContent =
            "Complaints OFF";

    }
}


// =====================================
// DEMO COMPLAINTS
// =====================================

function getComplaints() {

    try {

        const saved =
            localStorage.getItem(
                "parshd_demo_complaints"
            );

        if (!saved) {
            return [];
        }

        const complaints =
            JSON.parse(saved);

        if (!Array.isArray(complaints)) {
            return [];
        }

        return complaints.filter(
            complaint =>
                complaint.parshadId ===
                account.parshadId
        );

    } catch (error) {

        console.error(error);

        return [];
    }
}


// =====================================
// COMPLAINT COUNTS
// =====================================

function loadComplaintStats() {

    const complaints =
        getComplaints();


    let newTotal = 0;
    let pendingTotal = 0;
    let solvedTotal = 0;


    complaints.forEach(
        complaint => {

            if (
                complaint.status === "new"
            ) {

                newTotal++;

            } else if (
                complaint.status === "pending"
            ) {

                pendingTotal++;

            } else if (
                complaint.status === "solved"
            ) {

                solvedTotal++;
            }

        }
    );


    newCount.textContent =
        newTotal;

    pendingCount.textContent =
        pendingTotal;

    solvedCount.textContent =
        solvedTotal;
}


// =====================================
// RECENT COMPLAINTS
// =====================================

function loadRecentComplaints() {

    const complaints =
        getComplaints();


    if (!complaints.length) {

        recentComplaints.innerHTML = `
            <div class="empty-state">
                अभी कोई complaint नहीं है।
            </div>
        `;

        return;
    }


    const recent =
        complaints
            .sort(
                (a, b) =>
                    (b.createdAt || 0) -
                    (a.createdAt || 0)
            )
            .slice(0, 5);


    recentComplaints.innerHTML =
        recent.map(
            complaint => {

                const status =
                    complaint.status || "new";

                const text =
                    complaint.complaintText ||
                    complaint.text ||
                    "Complaint";


                const date =
                    complaint.createdAt
                        ? new Date(
                            complaint.createdAt
                          ).toLocaleDateString(
                            "hi-IN"
                          )
                        : "";


                return `
                    <div
                        style="
                            padding:16px 20px;
                            border-bottom:1px solid #e5e7eb;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                gap:12px;
                                align-items:flex-start;
                            "
                        >

                            <div
                                style="
                                    min-width:0;
                                "
                            >

                                <div
                                    style="
                                        font-weight:700;
                                        font-size:14px;
                                        margin-bottom:5px;
                                    "
                                >
                                    ${escapeHTML(
                                        complaint.citizenName ||
                                        "Citizen"
                                    )}
                                </div>

                                <div
                                    style="
                                        color:#6b7280;
                                        font-size:13px;
                                        line-height:1.45;
                                    "
                                >
                                    ${escapeHTML(
                                        text
                                    )}
                                </div>

                            </div>


                            <span
                                style="
                                    flex-shrink:0;
                                    font-size:11px;
                                    font-weight:700;
                                    padding:5px 8px;
                                    border-radius:999px;
                                    background:#f3f4f6;
                                "
                            >
                                ${formatStatus(status)}
                            </span>

                        </div>


                        <div
                            style="
                                margin-top:8px;
                                color:#9ca3af;
                                font-size:11px;
                            "
                        >
                            ${date}
                        </div>

                    </div>
                `;

            }
        )
        .join("");
}


// =====================================
// SAFE HTML
// =====================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================
// STATUS TEXT
// =====================================

function formatStatus(status) {

    if (status === "new") {
        return "New";
    }

    if (status === "pending") {
        return "Pending";
    }

    if (status === "solved") {
        return "Solved";
    }

    return "New";
}


// =====================================
// BUTTONS
// =====================================

document
    .getElementById("logoutButton")
    ?.addEventListener(
        "click",
        () => {

            demoLogout();

        }
    );


document
    .getElementById("viewPortalButton")
    ?.addEventListener(
        "click",
        () => {

            const ward =
                encodeURIComponent(
                    account.ward || ""
                );

            window.location.href =
                `../index.html?ward=${ward}`;

        }
    );


document
    .getElementById("editProfileButton")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./profile.html";

        }
    );


document
    .getElementById("profileActionButton")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./profile.html";

        }
    );


document
    .getElementById("complaintsButton")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./complaints.html";

        }
    );


document
    .getElementById("viewAllComplaintsButton")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./complaints.html";

        }
    );


document
    .getElementById("qrButton")
    ?.addEventListener(
        "click",
        () => {

            const ward =
                encodeURIComponent(
                    account.ward || ""
                );

            window.location.href =
                `../index.html?ward=${ward}`;

        }
    );


document
    .getElementById("settingsButton")
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./profile.html#complaint-settings";

        }
    );


// =====================================
// STAT CARD CLICK
// =====================================

document
    .querySelectorAll(".stat-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const status =
                    card.dataset.status || "";

                window.location.href =
                    `./complaints.html?status=${encodeURIComponent(
                        status
                    )}`;

            }
        );

    });


// =====================================
// INITIALIZE
// =====================================

function initializeDashboard() {

    loadProfile();

    loadComplaintStats();

    loadRecentComplaints();


    if (loading) {

        loading.style.display =
            "none";
    }
}


initializeDashboard();