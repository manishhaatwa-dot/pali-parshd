// =========================================================
// PARSHD - ADMIN COMPLAINTS CONTROLLER
// File: admin/complaints.js
// =========================================================

import {
    auth,
    db
} from "../js/firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    requireParshadLogin,
    getParshadRecord
} from "./login.js";


// =========================================================
// FIRESTORE PATH
// =========================================================

const COMPLAINTS_PATH = [
    "parshd",
    "complaints",
    "data"
];


// =========================================================
// STATE
// =========================================================

const State = {

    user: null,

    account: null,

    complaints: [],

    filter: "all",

    loading: false

};


// =========================================================
// PAGE START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            const allowed =
                await requireParshadLogin(
                    "./index.html"
                );


            if (!allowed) {
                return;
            }


            State.user =
                auth.currentUser;


            if (!State.user) {

                window.location.href =
                    "./index.html";

                return;

            }


            // -----------------------------------------
            // LOAD PARSHAD ACCOUNT
            // -----------------------------------------

            State.account =
                await getParshadRecord(
                    State.user.uid
                );


            if (
                !State.account ||
                State.account.status !== "approved" ||
                State.account.approved !== true
            ) {

                alert(
                    "Parshad account approved नहीं है।"
                );


                window.location.href =
                    "./index.html";

                return;

            }


            // -----------------------------------------
            // INITIALIZE UI
            // -----------------------------------------

            initializeFilters();

            initializeModal();

            await loadComplaints();


        } catch (error) {

            console.error(
                "Admin complaints error:",
                error
            );


            showPageMessage(
                "Complaints load नहीं हो सकीं। कृपया page refresh करें।"
            );

        }

    }
);


// =========================================================
// LOAD COMPLAINTS
// =========================================================

async function loadComplaints() {

    State.loading = true;

    showLoading();


    try {

        const complaintsRef =
            collection(
                db,
                ...COMPLAINTS_PATH
            );


        const snapshot =
            await getDocs(
                complaintsRef
            );


        const ward =
            normalizeWard(
                State.account.ward
            );


        const complaints = [];


        snapshot.forEach(
            snapshotDoc => {

                const data =
                    snapshotDoc.data();


                // -------------------------------------
                // ONLY CURRENT PARSHAD'S WARD
                // -------------------------------------

                const complaintWard =
                    normalizeWard(
                        data.wardNumber ||
                        data.wardId ||
                        ""
                    );


                if (
                    complaintWard !== ward
                ) {

                    return;

                }


                complaints.push({

                    id:
                        snapshotDoc.id,

                    ...data

                });

            }
        );


        // -----------------------------------------
        // SORT NEWEST FIRST
        // -----------------------------------------

        complaints.sort(
            (a, b) => {

                const aTime =
                    getTimeValue(
                        a.createdAt
                    );


                const bTime =
                    getTimeValue(
                        b.createdAt
                    );


                return bTime - aTime;

            }
        );


        State.complaints =
            complaints;


        console.log(
            "Parshad complaints:",
            State.complaints
        );


        updateCounts();

        renderComplaints();


    } catch (error) {

        console.error(
            "Complaints load error:",
            error
        );


        showPageMessage(
            "Complaints load नहीं हो सकीं।"
        );

    } finally {

        State.loading = false;

    }

}


// =========================================================
// FILTERS
// =========================================================

function initializeFilters() {

    const filterButtons =
        document.querySelectorAll(
            "[data-filter]"
        );


    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    State.filter =
                        button.dataset.filter ||
                        "all";


                    filterButtons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    renderComplaints();

                }
            );

        }
    );


    // -----------------------------------------
    // COMMON ID FALLBACKS
    // -----------------------------------------

    bindFilter(
        "#allComplaints",
        "all"
    );

    bindFilter(
        "#allFilter",
        "all"
    );

    bindFilter(
        "#newComplaints",
        "new"
    );

    bindFilter(
        "#newFilter",
        "new"
    );

    bindFilter(
        "#pendingComplaints",
        "pending"
    );

    bindFilter(
        "#pendingFilter",
        "pending"
    );

    bindFilter(
        "#solvedComplaints",
        "solved"
    );

    bindFilter(
        "#solvedFilter",
        "solved"
    );

}


// =========================================================
// BIND FILTER
// =========================================================

function bindFilter(
    selector,
    filter
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {
        return;
    }


    element.addEventListener(
        "click",
        () => {

            State.filter =
                filter;


            document
                .querySelectorAll(
                    "[data-filter]"
                )
                .forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


            element.classList.add(
                "active"
            );


            renderComplaints();

        }
    );

}


// =========================================================
// RENDER COMPLAINTS
// =========================================================

function renderComplaints() {

    const container =
        findComplaintsContainer();


    if (!container) {

        console.warn(
            "Complaint container not found."
        );

        return;

    }


    let complaints =
        State.complaints;


    // -----------------------------------------
    // FILTER
    // -----------------------------------------

    if (
        State.filter !== "all"
    ) {

        complaints =
            complaints.filter(
                complaint =>
                    complaint.status ===
                    State.filter
            );

    }


    // -----------------------------------------
    // EMPTY
    // -----------------------------------------

    if (
        complaints.length === 0
    ) {

        container.innerHTML = `

            <div class="complaint-empty">

                <div
                    style="
                        font-size:42px;
                        margin-bottom:10px;
                    "
                >
                    📭
                </div>

                <h3>
                    कोई complaint नहीं मिली
                </h3>

                <p>
                    इस category में अभी कोई शिकायत उपलब्ध नहीं है।
                </p>

            </div>

        `;

        return;

    }


    // -----------------------------------------
    // CARDS
    // -----------------------------------------

    container.innerHTML =
        complaints
            .map(
                complaint =>
                    createComplaintCard(
                        complaint
                    )
            )
            .join("");


    // -----------------------------------------
    // CARD EVENTS
    // -----------------------------------------

    container
        .querySelectorAll(
            "[data-complaint-open]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const id =
                            element.dataset.complaintOpen;


                        const complaint =
                            State.complaints.find(
                                item =>
                                    item.id === id
                            );


                        if (complaint) {

                            showComplaintDetails(
                                complaint
                            );

                        }

                    }
                );

            }
        );


    // -----------------------------------------
    // STATUS BUTTONS
    // -----------------------------------------

    container
        .querySelectorAll(
            "[data-status-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.stopPropagation();


                        const id =
                            button.dataset.complaintId;


                        const status =
                            button.dataset.statusAction;


                        await changeComplaintStatus(
                            id,
                            status
                        );

                    }
                );

            }
        );

}


// =========================================================
// CREATE COMPLAINT CARD
// =========================================================

function createComplaintCard(
    complaint
) {

    const status =
        complaint.status || "new";


    const statusText =
        getStatusText(
            status
        );


    const created =
        formatDate(
            complaint.createdAt
        );


    const publicId =
        escapeHTML(
            complaint.publicComplaintId ||
            complaint.complaintId ||
            complaint.id
        );


    const name =
        escapeHTML(
            complaint.citizenName ||
            "Citizen"
        );


    const phone =
        escapeHTML(
            complaint.citizenPhone ||
            ""
        );


    const text =
        escapeHTML(
            complaint.complaintText ||
            ""
        );


    const ward =
        escapeHTML(
            complaint.wardNumber ||
            complaint.wardId ||
            State.account.ward ||
            ""
        );


    const mediaCount =
        getMediaCount(
            complaint.media
        );


    return `

        <article
            class="complaint-card"
            data-complaint-open="${escapeAttr(
                complaint.id
            )}"
            style="
                cursor:pointer;
                padding:18px;
                margin-bottom:14px;
                border:1px solid #e5e7eb;
                border-radius:16px;
                background:#fff;
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

                <div>

                    <strong
                        style="
                            font-size:17px;
                        "
                    >
                        ${name}
                    </strong>

                    <div
                        style="
                            margin-top:4px;
                            opacity:.7;
                            font-size:13px;
                        "
                    >
                        ${publicId}
                    </div>

                </div>


                <span
                    style="
                        padding:6px 10px;
                        border-radius:20px;
                        background:${getStatusBackground(status)};
                        color:${getStatusColor(status)};
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    ${statusText}
                </span>

            </div>


            <div
                style="
                    margin-top:12px;
                    line-height:1.55;
                "
            >
                ${text}
            </div>


            <div
                style="
                    margin-top:12px;
                    font-size:13px;
                    opacity:.7;
                "
            >

                Ward ${ward}
                ${phone ? ` • ${phone}` : ""}
                • ${created}

            </div>


            ${
                mediaCount > 0
                ? `
                    <div
                        style="
                            margin-top:10px;
                            font-size:13px;
                            font-weight:700;
                        "
                    >
                        📎 ${mediaCount} media attached
                    </div>
                `
                : ""
            }


            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-top:15px;
                "
            >

                ${
                    status !== "pending"
                    ? `
                        <button
                            type="button"
                            data-status-action="pending"
                            data-complaint-id="${escapeAttr(
                                complaint.id
                            )}"
                            style="
                                padding:8px 12px;
                                border:1px solid #d1d5db;
                                border-radius:9px;
                                background:#fff;
                                cursor:pointer;
                            "
                        >
                            Pending
                        </button>
                    `
                    : ""
                }


                ${
                    status !== "solved"
                    ? `
                        <button
                            type="button"
                            data-status-action="solved"
                            data-complaint-id="${escapeAttr(
                                complaint.id
                            )}"
                            style="
                                padding:8px 12px;
                                border:0;
                                border-radius:9px;
                                background:#16a34a;
                                color:#fff;
                                cursor:pointer;
                            "
                        >
                            Solved
                        </button>
                    `
                    : ""
                }

            </div>

        </article>

    `;

}


// =========================================================
// SHOW COMPLAINT DETAILS
// =========================================================

function showComplaintDetails(
    complaint
) {

    const modal =
        document.querySelector(
            "#complaintModal"
        );


    const content =
        document.querySelector(
            "#complaintModalContent"
        );


    // -----------------------------------------
    // EXISTING MODAL
    // -----------------------------------------

    if (
        modal &&
        content
    ) {

        content.innerHTML =
            buildDetailsHTML(
                complaint
            );


        modal.classList.remove(
            "hidden"
        );


        modal.style.display =
            "flex";


        bindModalActions(
            complaint
        );


        return;

    }


    // -----------------------------------------
    // FALLBACK MODAL
    // -----------------------------------------

    let fallback =
        document.querySelector(
            "#parshdComplaintFallbackModal"
        );


    if (!fallback) {

        fallback =
            document.createElement(
                "div"
            );


        fallback.id =
            "parshdComplaintFallbackModal";


        fallback.style.cssText = `

            position:fixed;
            inset:0;
            background:rgba(0,0,0,.55);
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:15px;
            box-sizing:border-box;

        `;


        document.body.appendChild(
            fallback
        );

    }


    fallback.innerHTML = `

        <div
            style="
                width:min(700px,100%);
                max-height:90vh;
                overflow:auto;
                background:#fff;
                border-radius:18px;
                padding:20px;
                box-sizing:border-box;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:15px;
                "
            >

                <h2
                    style="
                        margin:0;
                    "
                >
                    Complaint Details
                </h2>

                <button
                    id="fallbackCloseComplaint"
                    type="button"
                    style="
                        border:0;
                        background:#f1f5f9;
                        border-radius:8px;
                        padding:8px 12px;
                        cursor:pointer;
                    "
                >
                    ✕
                </button>

            </div>


            <div id="fallbackComplaintContent">

                ${buildDetailsHTML(complaint)}

            </div>

        </div>

    `;


    fallback.style.display =
        "flex";


    const close =
        document.querySelector(
            "#fallbackCloseComplaint"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeFallbackModal
        );

    }


    bindModalActions(
        complaint
    );

}


// =========================================================
// BUILD DETAILS
// =========================================================

function buildDetailsHTML(
    complaint
) {

    const location =
        complaint.location;


    const media =
        complaint.media || {};


    const images =
        Array.isArray(media.images)
            ? media.images
            : [];


    const video =
        media.video || null;


    const imageHTML =
        images.length
            ? images
                .map(
                    image => {

                        const url =
                            getMediaURL(
                                image
                            );


                        if (!url) {
                            return "";
                        }


                        return `

                            <a
                                href="${escapeAttr(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src="${escapeAttr(url)}"
                                    alt="Complaint photo"
                                    style="
                                        width:120px;
                                        height:100px;
                                        object-fit:cover;
                                        border-radius:10px;
                                        border:1px solid #ddd;
                                    "
                                >
                            </a>

                        `;

                    }
                )
                .join("")
            : `
                <p style="opacity:.65;">
                    कोई photo उपलब्ध नहीं है।
                </p>
            `;


    const videoURL =
        getMediaURL(
            video
        );


    const videoHTML =
        videoURL
            ? `

                <video
                    controls
                    preload="metadata"
                    style="
                        width:100%;
                        max-height:400px;
                        border-radius:12px;
                        margin-top:10px;
                    "
                >
                    <source
                        src="${escapeAttr(videoURL)}"
                        type="${escapeAttr(
                            video.contentType ||
                            "video/mp4"
                        )}"
                    >
                </video>

                <div
                    style="
                        margin-top:6px;
                        font-size:12px;
                        opacity:.65;
                    "
                >
                    Video खोलने के लिए play दबाएँ।
                </div>

            `
            : `
                <p style="opacity:.65;">
                    कोई video उपलब्ध नहीं है।
                </p>
            `;


    let locationHTML =
        `
            <p style="opacity:.65;">
                Location उपलब्ध नहीं है।
            </p>
        `;


    if (
        location &&
        Number.isFinite(
            Number(location.latitude)
        ) &&
        Number.isFinite(
            Number(location.longitude)
        )
    ) {

        const latitude =
            Number(
                location.latitude
            );


        const longitude =
            Number(
                location.longitude
            );


        const mapURL =
            `https://www.google.com/maps?q=${latitude},${longitude}`;


        locationHTML = `

            <div>

                <div>
                    Latitude:
                    <strong>
                        ${latitude}
                    </strong>
                </div>

                <div>
                    Longitude:
                    <strong>
                        ${longitude}
                    </strong>
                </div>

                <a
                    href="${mapURL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        display:inline-block;
                        margin-top:8px;
                        padding:8px 12px;
                        border-radius:8px;
                        background:#2563eb;
                        color:#fff;
                        text-decoration:none;
                    "
                >
                    📍 Map पर देखें
                </a>

            </div>

        `;

    }


    return `

        <div
            style="
                line-height:1.6;
            "
        >

            <div
                style="
                    padding:12px;
                    border-radius:10px;
                    background:#f8fafc;
                    margin-bottom:12px;
                "
            >

                <strong>
                    Complaint ID
                </strong>

                <div>
                    ${escapeHTML(
                        complaint.publicComplaintId ||
                        complaint.complaintId ||
                        complaint.id ||
                        "—"
                    )}
                </div>

            </div>


            <p>
                <strong>नाम:</strong>
                ${escapeHTML(
                    complaint.citizenName || "—"
                )}
            </p>


            <p>
                <strong>मोबाइल:</strong>
                ${escapeHTML(
                    complaint.citizenPhone || "—"
                )}
            </p>


            <p>
                <strong>Ward:</strong>
                ${escapeHTML(
                    complaint.wardNumber ||
                    complaint.wardId ||
                    "—"
                )}
            </p>


            <p>
                <strong>पता:</strong>
                ${escapeHTML(
                    complaint.address || "—"
                )}
            </p>


            <p>
                <strong>स्थिति:</strong>
                ${getStatusText(
                    complaint.status
                )}
            </p>


            <p>
                <strong>शिकायत:</strong>
            </p>

            <div
                style="
                    padding:12px;
                    border-radius:10px;
                    background:#f8fafc;
                    white-space:pre-wrap;
                "
            >
                ${escapeHTML(
                    complaint.complaintText || "—"
                )}
            </div>


            <p>
                <strong>दर्ज समय:</strong>
                ${formatDate(
                    complaint.createdAt
                )}
            </p>


            ${
                complaint.solvedAt
                ? `
                    <p>
                        <strong>Solved time:</strong>
                        ${formatDate(
                            complaint.solvedAt
                        )}
                    </p>
                `
                : ""
            }


            <hr
                style="
                    border:0;
                    border-top:1px solid #e5e7eb;
                    margin:18px 0;
                "
            >


            <h3>
                📍 Location
            </h3>

            ${locationHTML}


            <hr
                style="
                    border:0;
                    border-top:1px solid #e5e7eb;
                    margin:18px 0;
                "
            >


            <h3>
                📷 Photos
            </h3>

            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:10px;
                "
            >
                ${imageHTML}
            </div>


            <h3
                style="
                    margin-top:20px;
                "
            >
                🎥 Video
            </h3>

            ${videoHTML}


            <div
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-top:20px;
                "
            >

                ${
                    complaint.status !== "pending"
                    ? `
                        <button
                            type="button"
                            data-modal-status="pending"
                            data-complaint-id="${escapeAttr(
                                complaint.id
                            )}"
                            style="
                                padding:10px 14px;
                                border:1px solid #ddd;
                                border-radius:9px;
                                background:#fff;
                                cursor:pointer;
                            "
                        >
                            Pending
                        </button>
                    `
                    : ""
                }


                ${
                    complaint.status !== "solved"
                    ? `
                        <button
                            type="button"
                            data-modal-status="solved"
                            data-complaint-id="${escapeAttr(
                                complaint.id
                            )}"
                            style="
                                padding:10px 14px;
                                border:0;
                                border-radius:9px;
                                background:#16a34a;
                                color:#fff;
                                cursor:pointer;
                            "
                        >
                            Solved
                        </button>
                    `
                    : ""
                }

            </div>

        </div>

    `;

}


// =========================================================
// MODAL ACTIONS
// =========================================================

function initializeModal() {

    const closeButtons =
        document.querySelectorAll(
            "[data-close-modal]"
        );


    closeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                closeAllModals
            );

        }
    );

}


// =========================================================
// BIND MODAL ACTIONS
// =========================================================

function bindModalActions(
    complaint
) {

    document
        .querySelectorAll(
            "[data-modal-status]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const status =
                            button.dataset.modalStatus;


                        await changeComplaintStatus(
                            complaint.id,
                            status
                        );


                        closeAllModals();

                    }
                );

            }
        );

}


// =========================================================
// CHANGE STATUS
// =========================================================

async function changeComplaintStatus(
    complaintId,
    newStatus
) {

    if (
        ![
            "new",
            "pending",
            "solved"
        ].includes(
            newStatus
        )
    ) {

        return;

    }


    const complaint =
        State.complaints.find(
            item =>
                item.id === complaintId
        );


    if (!complaint) {

        alert(
            "Complaint नहीं मिली।"
        );

        return;

    }


    try {

        const complaintRef =
            doc(
                db,
                ...COMPLAINTS_PATH,
                complaintId
            );


        const updateData = {

            status:
                newStatus

        };


        if (
            newStatus === "solved"
        ) {

            updateData.solvedAt =
                serverTimestamp();

        } else {

            updateData.solvedAt =
                null;

        }


        await updateDoc(
            complaintRef,
            updateData
        );


        // -----------------------------------------
        // LOCAL STATE
        // -----------------------------------------

        complaint.status =
            newStatus;


        if (
            newStatus === "solved"
        ) {

            complaint.solvedAt =
                new Date();

        } else {

            complaint.solvedAt =
                null;

        }


        updateCounts();

        renderComplaints();


        console.log(
            "Complaint status updated:",
            complaintId,
            newStatus
        );


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "Complaint status update नहीं हो सका।"
        );

    }

}


// =========================================================
// COUNTS
// =========================================================

function updateCounts() {

    const all =
        State.complaints.length;


    const newCount =
        State.complaints.filter(
            item =>
                item.status === "new"
        ).length;


    const pendingCount =
        State.complaints.filter(
            item =>
                item.status === "pending"
        ).length;


    const solvedCount =
        State.complaints.filter(
            item =>
                item.status === "solved"
        ).length;


    setCount(
        [
            "#allCount",
            "#totalComplaints",
            "[data-count='all']"
        ],
        all
    );


    setCount(
        [
            "#newCount",
            "[data-count='new']"
        ],
        newCount
    );


    setCount(
        [
            "#pendingCount",
            "[data-count='pending']"
        ],
        pendingCount
    );


    setCount(
        [
            "#solvedCount",
            "[data-count='solved']"
        ],
        solvedCount
    );

}


// =========================================================
// SET COUNT
// =========================================================

function setCount(
    selectors,
    value
) {

    for (
        const selector of selectors
    ) {

        const elements =
            document.querySelectorAll(
                selector
            );


        if (
            elements.length === 0
        ) {

            continue;

        }


        elements.forEach(
            element => {

                element.textContent =
                    String(value);

            }
        );


        return;

    }

}


// =========================================================
// FIND CONTAINER
// =========================================================

function findComplaintsContainer() {

    const selectors = [

        "#complaintsList",

        "#complaintsContainer",

        "#complaintList",

        "#complaints",

        ".complaints-list",

        ".complaints-container"

    ];


    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            return element;

        }

    }


    return null;

}


// =========================================================
// LOADING
// =========================================================

function showLoading() {

    const container =
        findComplaintsContainer();


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div
            style="
                text-align:center;
                padding:40px 20px;
                opacity:.7;
            "
        >

            <div
                style="
                    font-size:30px;
                    margin-bottom:10px;
                "
            >
                ⏳
            </div>

            Complaints load हो रही हैं...

        </div>

    `;

}


// =========================================================
// PAGE MESSAGE
// =========================================================

function showPageMessage(
    message
) {

    const container =
        findComplaintsContainer();


    if (!container) {

        alert(message);

        return;

    }


    container.innerHTML = `

        <div
            style="
                padding:20px;
                border-radius:12px;
                background:#fef2f2;
                color:#b91c1c;
                text-align:center;
            "
        >
            ${escapeHTML(message)}
        </div>

    `;

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeFallbackModal() {

    const modal =
        document.querySelector(
            "#parshdComplaintFallbackModal"
        );


    if (modal) {

        modal.remove();

    }

}


// =========================================================
// CLOSE ALL MODALS
// =========================================================

function closeAllModals() {

    const modal =
        document.querySelector(
            "#complaintModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );


        modal.style.display =
            "none";

    }


    closeFallbackModal();

}


// =========================================================
// MEDIA URL
// =========================================================

function getMediaURL(
    media
) {

    if (!media) {
        return "";
    }


    if (
        typeof media === "string"
    ) {

        return media;

    }


    return (
        media.url ||
        media.downloadURL ||
        media.downloadUrl ||
        ""
    );

}


// =========================================================
// MEDIA COUNT
// =========================================================

function getMediaCount(
    media
) {

    if (!media) {
        return 0;
    }


    const images =
        Array.isArray(media.images)
            ? media.images.length
            : 0;


    const video =
        media.video
            ? 1
            : 0;


    return images + video;

}


// =========================================================
// STATUS TEXT
// =========================================================

function getStatusText(
    status
) {

    switch (status) {

        case "new":
            return "New";

        case "pending":
            return "Pending";

        case "solved":
            return "Solved";

        default:
            return "New";

    }

}


// =========================================================
// STATUS COLORS
// =========================================================

function getStatusColor(
    status
) {

    switch (status) {

        case "new":
            return "#1d4ed8";

        case "pending":
            return "#b45309";

        case "solved":
            return "#15803d";

        default:
            return "#1d4ed8";

    }

}


function getStatusBackground(
    status
) {

    switch (status) {

        case "new":
            return "#dbeafe";

        case "pending":
            return "#fef3c7";

        case "solved":
            return "#dcfce7";

        default:
            return "#dbeafe";

    }

}


// =========================================================
// DATE
// =========================================================

function getTimeValue(
    timestamp
) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    if (
        typeof timestamp === "string"
    ) {

        const time =
            new Date(
                timestamp
            ).getTime();


        return Number.isFinite(time)
            ? time
            : 0;

    }


    return 0;

}


function formatDate(
    timestamp
) {

    const time =
        getTimeValue(
            timestamp
        );


    if (!time) {
        return "—";
    }


    try {

        return new Intl.DateTimeFormat(
            "hi-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(
            new Date(time)
        );

    } catch {

        return new Date(
            time
        ).toLocaleString();

    }

}


// =========================================================
// NORMALIZE WARD
// =========================================================

function normalizeWard(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /^0+/,
            ""
        );

}


// =========================================================
// HTML ESCAPE
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


function escapeAttr(
    value
) {

    return escapeHTML(
        value
    );

}


// =========================================================
// GLOBAL API
// =========================================================

window.ParshdAdminComplaints = {

    reload:
        loadComplaints,

    getState() {

        return {
            ...State,
            complaints:
                [...State.complaints]
        };

    },

    changeStatus:
        changeComplaintStatus

};
