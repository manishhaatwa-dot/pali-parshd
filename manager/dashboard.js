// =====================================================
// PARSHD MASTER MANAGER DASHBOARD
// =====================================================

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    auth,
    db
} from "../js/firebase-config.js";


// =====================================================
// MASTER MANAGER UID
// =====================================================

const MANAGER_UID =
    "bgsjA85tL7Ws4YZl9HBBkUms5lY2";


// =====================================================
// ELEMENTS
// =====================================================

const totalCount =
    document.getElementById("totalCount");

const pendingCount =
    document.getElementById("pendingCount");

const approvedCount =
    document.getElementById("approvedCount");

const rejectedCount =
    document.getElementById("rejectedCount");


const pendingLabel =
    document.getElementById("pendingLabel");

const approvedLabel =
    document.getElementById("approvedLabel");

const rejectedLabel =
    document.getElementById("rejectedLabel");


const pendingContent =
    document.getElementById("pendingContent");

const approvedContent =
    document.getElementById("approvedContent");

const rejectedContent =
    document.getElementById("rejectedContent");


const logoutButton =
    document.getElementById("logoutButton");


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }


    try {

        let date;


        if (
            value &&
            typeof value.toDate === "function"
        ) {

            date =
                value.toDate();

        } else {

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


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch (error) {

        return "-";
    }
}


// =====================================================
// AUTH CHECK
// =====================================================

function requireManager() {

    return new Promise(
        (resolve) => {

            onAuthStateChanged(
                auth,
                async (user) => {

                    if (!user) {

                        window.location.href =
                            "./index.html";

                        resolve(false);

                        return;
                    }


                    if (
                        user.uid !==
                        MANAGER_UID
                    ) {

                        await signOut(auth);

                        window.location.href =
                            "./index.html";

                        resolve(false);

                        return;
                    }


                    resolve(true);
                }
            );
        }
    );
}


// =====================================================
// LOAD PARSHADS
// =====================================================

async function loadParshads() {

    pendingContent.innerHTML =
        `<div class="loading">
            Loading registrations...
        </div>`;

    approvedContent.innerHTML =
        `<div class="loading">
            Loading approved Parshads...
        </div>`;

    rejectedContent.innerHTML =
        `<div class="loading">
            Loading rejected registrations...
        </div>`;


    try {

        const parshadsRef =
            collection(
                db,
                "parshd",
                "parshads",
                "data"
            );


        const snapshot =
            await getDocs(
                parshadsRef
            );


        const parshads = [];


        snapshot.forEach(
            (documentSnapshot) => {

                parshads.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        // =============================================
        // STATUS FILTER
        // =============================================

        const pending =
            parshads.filter(
                item =>
                    item.status ===
                    "pending"
            );


        const approved =
            parshads.filter(
                item =>
                    item.status ===
                    "approved"
            );


        const rejected =
            parshads.filter(
                item =>
                    item.status ===
                    "rejected"
            );


        // =============================================
        // COUNTS
        // =============================================

        totalCount.textContent =
            parshads.length;

        pendingCount.textContent =
            pending.length;

        approvedCount.textContent =
            approved.length;

        rejectedCount.textContent =
            rejected.length;


        pendingLabel.textContent =
            `${pending.length} request${
                pending.length === 1
                    ? ""
                    : "s"
            }`;


        approvedLabel.textContent =
            `${approved.length} parshad${
                approved.length === 1
                    ? ""
                    : "s"
            }`;


        rejectedLabel.textContent =
            `${rejected.length} request${
                rejected.length === 1
                    ? ""
                    : "s"
            }`;


        // =============================================
        // RENDER
        // =============================================

        renderPending(
            pending
        );

        renderApproved(
            approved
        );

        renderRejected(
            rejected
        );


    } catch (error) {

        console.error(
            "Load Parshads error:",
            error
        );


        const message =
            `<div class="empty">
                Data load नहीं हो सका।
                <br>
                <small>
                    ${escapeHTML(
                        error.message
                    )}
                </small>
            </div>`;


        pendingContent.innerHTML =
            message;

        approvedContent.innerHTML =
            message;

        rejectedContent.innerHTML =
            message;
    }
}


// =====================================================
// PENDING TABLE
// =====================================================

function renderPending(items) {

    if (!items.length) {

        pendingContent.innerHTML =
            `<div class="empty">
                अभी कोई pending registration नहीं है।
            </div>`;

        return;
    }


    let rows = "";


    items.forEach(
        item => {

            rows += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.email
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.mobile
                            || item.phone
                            || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.ward
                            || item.wardNumber
                            || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.area
                            || item.areaName
                            || "-"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            item.createdAt
                        )}
                    </td>

                    <td>

                        <div class="actions">

                            <button
                                class="action-btn view-btn"
                                data-action="view"
                                data-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                View
                            </button>

                            <button
                                class="action-btn approve-btn"
                                data-action="approve"
                                data-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                Approve
                            </button>

                            <button
                                class="action-btn reject-btn"
                                data-action="reject"
                                data-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                Reject
                            </button>

                        </div>

                    </td>

                </tr>
            `;
        }
    );


    pendingContent.innerHTML = `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Ward</th>
                        <th>Area</th>
                        <th>Registered</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


// =====================================================
// APPROVED TABLE
// =====================================================

function renderApproved(items) {

    if (!items.length) {

        approvedContent.innerHTML =
            `<div class="empty">
                अभी कोई approved Parshad नहीं है।
            </div>`;

        return;
    }


    let rows = "";


    items.forEach(
        item => {

            rows += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.email
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.mobile
                            || item.phone
                            || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.ward
                            || item.wardNumber
                            || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.area
                            || item.areaName
                            || "-"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            item.approvedAt
                        )}
                    </td>

                    <td>

                        <span class="status approved">
                            Approved
                        </span>

                    </td>

                </tr>
            `;
        }
    );


    approvedContent.innerHTML = `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Ward</th>
                        <th>Area</th>
                        <th>Approved</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


// =====================================================
// REJECTED TABLE
// =====================================================

function renderRejected(items) {

    if (!items.length) {

        rejectedContent.innerHTML =
            `<div class="empty">
                अभी कोई rejected registration नहीं है।
            </div>`;

        return;
    }


    let rows = "";


    items.forEach(
        item => {

            rows += `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.email
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.mobile
                            || item.phone
                            || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.ward
                            || item.wardNumber
                            || "-"
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            item.rejectedAt
                        )}
                    </td>

                    <td>

                        <span class="status rejected">
                            Rejected
                        </span>

                    </td>

                </tr>
            `;
        }
    );


    rejectedContent.innerHTML = `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Ward</th>
                        <th>Rejected</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


// =====================================================
// VIEW PARSHAD
// =====================================================

async function viewParshad(id) {

    try {

        const parshadsRef =
            collection(
                db,
                "parshd",
                "parshads",
                "data"
            );


        const snapshot =
            await getDocs(
                parshadsRef
            );


        let selected = null;


        snapshot.forEach(
            item => {

                if (
                    item.id === id
                ) {

                    selected = {
                        id: item.id,
                        ...item.data()
                    };
                }
            }
        );


        if (!selected) {

            alert(
                "Registration नहीं मिली।"
            );

            return;
        }


        const details = [

            `Name: ${
                selected.name || "-"
            }`,

            `Email: ${
                selected.email || "-"
            }`,

            `Mobile: ${
                selected.mobile ||
                selected.phone ||
                "-"
            }`,

            `Ward: ${
                selected.ward ||
                selected.wardNumber ||
                "-"
            }`,

            `Area: ${
                selected.area ||
                selected.areaName ||
                "-"
            }`,

            `Status: ${
                selected.status || "-"
            }`

        ].join("\n");


        alert(details);


    } catch (error) {

        console.error(error);

        alert(
            "Details load नहीं हो सके।"
        );
    }
}


// =====================================================
// APPROVE
// =====================================================

async function approveParshad(id) {

    const confirmApprove =
        confirm(
            "क्या इस Parshad registration को approve करना है?"
        );


    if (!confirmApprove) {
        return;
    }


    try {

        const parshadRef =
            doc(
                db,
                "parshd",
                "parshads",
                "data",
                id
            );


        await updateDoc(
            parshadRef,
            {

                status:
                    "approved",

                approved:
                    true,

                approvedAt:
                    serverTimestamp(),

                rejectedAt:
                    null

            }
        );


        alert(
            "Parshad successfully approved."
        );


        await loadParshads();


    } catch (error) {

        console.error(
            "Approve error:",
            error
        );


        alert(
            "Approve नहीं हो सका:\n" +
            error.message
        );
    }
}


// =====================================================
// REJECT
// =====================================================

async function rejectParshad(id) {

    const confirmReject =
        confirm(
            "क्या इस Parshad registration को reject करना है?"
        );


    if (!confirmReject) {
        return;
    }


    try {

        const parshadRef =
            doc(
                db,
                "parshd",
                "parshads",
                "data",
                id
            );


        await updateDoc(
            parshadRef,
            {

                status:
                    "rejected",

                approved:
                    false,

                rejectedAt:
                    serverTimestamp(),

                approvedAt:
                    null

            }
        );


        alert(
            "Registration rejected."
        );


        await loadParshads();


    } catch (error) {

        console.error(
            "Reject error:",
            error
        );


        alert(
            "Reject नहीं हो सका:\n" +
            error.message
        );
    }
}


// =====================================================
// ACTION BUTTONS
// =====================================================

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.action;

        const id =
            button.dataset.id;


        if (!id) {
            return;
        }


        if (
            action ===
            "view"
        ) {

            await viewParshad(id);

        } else if (
            action ===
            "approve"
        ) {

            await approveParshad(id);

        } else if (
            action ===
            "reject"
        ) {

            await rejectParshad(id);
        }
    }
);


// =====================================================
// LOGOUT
// =====================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "./index.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }
        }
    );
}


// =====================================================
// START DASHBOARD
// =====================================================

const managerAuthorized =
    await requireManager();


if (managerAuthorized) {

    await loadParshads();
}
