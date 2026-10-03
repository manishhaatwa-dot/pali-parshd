<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, viewport-fit=cover"
    >

    <meta name="theme-color" content="#ffffff">

    <title>Profile Settings | Parshd</title>

    <style>
        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
            background: #ffffff;
        }

        body {
            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Roboto,
                Arial,
                sans-serif;

            color: #111827;

            padding:
                env(safe-area-inset-top)
                env(safe-area-inset-right)
                env(safe-area-inset-bottom)
                env(safe-area-inset-left);
        }

        .page {
            min-height: 100vh;
            min-height: 100dvh;
            background: #ffffff;
        }

        .header {
            position: sticky;
            top: 0;
            z-index: 10;

            width: 100%;

            border-bottom: 1px solid #e5e7eb;

            background: #ffffff;
        }

        .header-inner {
            width: 100%;
            max-width: 900px;

            min-height: 65px;

            margin: auto;

            padding: 10px 18px;

            display: flex;
            align-items: center;
            gap: 12px;
        }

        .back-button {
            width: 40px;
            height: 40px;

            border: 1px solid #e5e7eb;
            border-radius: 9px;

            background: #ffffff;

            font-size: 20px;

            cursor: pointer;
        }

        .header-title {
            margin: 0;

            font-size: 19px;
            font-weight: 700;
        }

        .main {
            width: 100%;
            max-width: 900px;

            margin: auto;

            padding: 25px 18px 45px;
        }

        .section {
            width: 100%;

            margin-bottom: 22px;

            padding: 20px;

            border: 1px solid #e5e7eb;
            border-radius: 15px;

            background: #ffffff;
        }

        .section-title {
            margin: 0 0 5px;

            font-size: 18px;
            font-weight: 700;
        }

        .section-description {
            margin: 0 0 20px;

            color: #6b7280;

            font-size: 13px;
            line-height: 1.5;
        }

        .photo-area {
            display: flex;
            align-items: center;
            gap: 18px;

            margin-bottom: 20px;
        }

        .profile-preview {
            width: 90px;
            height: 90px;

            border-radius: 50%;

            object-fit: cover;

            border: 1px solid #e5e7eb;

            background: #f9fafb;
        }

        .photo-controls {
            min-width: 0;
        }

        .file-input {
            width: 100%;

            font-size: 13px;
        }

        .photo-note {
            margin: 6px 0 0;

            color: #9ca3af;

            font-size: 11px;
        }

        .form-grid {
            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 16px;
        }

        .form-group {
            width: 100%;
        }

        .full {
            grid-column: 1 / -1;
        }

        label {
            display: block;

            margin-bottom: 7px;

            font-size: 14px;
            font-weight: 600;

            color: #374151;
        }

        input,
        textarea,
        select {
            width: 100%;

            border: 1px solid #d1d5db;
            border-radius: 10px;

            outline: none;

            background: #ffffff;

            color: #111827;

            font-family: inherit;
            font-size: 16px;
        }

        input,
        select {
            height: 48px;

            padding: 0 13px;
        }

        textarea {
            min-height: 115px;

            padding: 12px 13px;

            resize: vertical;

            line-height: 1.5;
        }

        input:focus,
        textarea:focus,
        select:focus {
            border-color: #111827;

            box-shadow:
                0 0 0 3px rgba(17, 24, 39, 0.07);
        }

        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 15px;
        }

        .toggle-info {
            min-width: 0;
        }

        .toggle-title {
            margin: 0;

            font-size: 15px;
            font-weight: 700;
        }

        .toggle-description {
            margin: 5px 0 0;

            color: #6b7280;

            font-size: 12px;
            line-height: 1.45;
        }

        .switch {
            position: relative;

            width: 52px;
            height: 30px;

            flex-shrink: 0;
        }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            inset: 0;

            border-radius: 30px;

            background: #d1d5db;

            cursor: pointer;

            transition: 0.2s;
        }

        .slider::before {
            content: "";

            position: absolute;

            width: 24px;
            height: 24px;

            left: 3px;
            top: 3px;

            border-radius: 50%;

            background: #ffffff;

            transition: 0.2s;

            box-shadow:
                0 1px 4px rgba(0, 0, 0, 0.18);
        }

        .switch input:checked + .slider {
            background: #111827;
        }

        .switch input:checked + .slider::before {
            transform: translateX(22px);
        }

        .save-button {
            width: 100%;

            min-height: 51px;

            border: 0;
            border-radius: 10px;

            background: #111827;
            color: #ffffff;

            font-size: 16px;
            font-weight: 700;

            cursor: pointer;
        }

        .save-button:disabled {
            opacity: 0.6;
        }

        .message {
            display: none;

            margin-top: 15px;

            padding: 11px;

            border-radius: 9px;

            text-align: center;

            font-size: 14px;
        }

        .message.show {
            display: block;
        }

        .message.success {
            background: #f0fdf4;
            color: #15803d;
        }

        .message.error {
            background: #fef2f2;
            color: #b91c1c;
        }

        @media (max-width: 650px) {

            .main {
                padding:
                    20px 13px 35px;
            }

            .section {
                padding: 17px;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .full {
                grid-column: auto;
            }

            .photo-area {
                align-items: flex-start;
            }
        }

        @media (max-width: 400px) {

            .profile-preview {
                width: 75px;
                height: 75px;
            }

            .toggle-row {
                align-items: flex-start;
            }
        }
    </style>
</head>

<body>

<div class="page">

    <header class="header">

        <div class="header-inner">

            <button
                type="button"
                id="backButton"
                class="back-button"
            >
                ←
            </button>

            <h1 class="header-title">
                Profile Settings
            </h1>

        </div>

    </header>


    <main class="main">

        <!-- PROFILE PHOTO -->

        <section class="section">

            <h2 class="section-title">
                Profile Photo
            </h2>

            <p class="section-description">
                Public profile par dikhne wali photo.
            </p>


            <div class="photo-area">

                <img
                    id="profilePreview"
                    src="../assets/images/default-profile.png"
                    alt="Profile Preview"
                    class="profile-preview"
                >

                <div class="photo-controls">

                    <input
                        type="file"
                        id="profilePhotoInput"
                        class="file-input"
                        accept="image/*"
                    >

                    <p class="photo-note">
                        JPG, PNG ya WebP
                    </p>

                </div>

            </div>

        </section>


        <!-- BASIC DETAILS -->

        <section class="section">

            <h2 class="section-title">
                Basic Details
            </h2>

            <p class="section-description">
                Ye details citizen ke ward portal par dikhengi.
            </p>


            <div class="form-grid">

                <div class="form-group">

                    <label for="name">
                        Parshad Name
                    </label>

                    <input
                        type="text"
                        id="name"
                        placeholder="Full name"
                    >

                </div>


                <div class="form-group">

                    <label for="designation">
                        Designation
                    </label>

                    <input
                        type="text"
                        id="designation"
                        placeholder="Example: Ward Parshad"
                    >

                </div>


                <div class="form-group">

                    <label for="ward">
                        Ward Number
                    </label>

                    <input
                        type="text"
                        id="ward"
                        inputmode="numeric"
                        placeholder="Ward number"
                    >

                </div>


                <div class="form-group">

                    <label for="area">
                        Area / Ward Name
                    </label>

                    <input
                        type="text"
                        id="area"
                        placeholder="Area name"
                    >

                </div>


                <div class="form-group">

                    <label for="phone">
                        Phone
                    </label>

                    <input
                        type="tel"
                        id="phone"
                        inputmode="tel"
                        maxlength="10"
                        placeholder="Mobile number"
                    >

                </div>


                <div class="form-group">

                    <label for="whatsapp">
                        WhatsApp
                    </label>

                    <input
                        type="tel"
                        id="whatsapp"
                        inputmode="tel"
                        maxlength="10"
                        placeholder="WhatsApp number"
                    >

                </div>


                <div class="form-group full">

                    <label for="party">
                        Party / Organization
                    </label>

                    <input
                        type="text"
                        id="party"
                        placeholder="Party or organization name"
                    >

                </div>


                <div class="form-group full">

                    <label for="about">
                        About
                    </label>

                    <textarea
                        id="about"
                        placeholder="Apne baare mein short information..."
                    ></textarea>

                </div>

            </div>

        </section>


        <!-- PARTY LOGO -->

        <section class="section">

            <h2 class="section-title">
                Party / Organization Logo
            </h2>

            <p class="section-description">
                Public profile par logo dikhane ke liye.
            </p>

            <input
                type="file"
                id="logoInput"
                class="file-input"
                accept="image/*"
            >

        </section>


        <!-- COMPLAINT SETTINGS -->

        <section
            class="section"
            id="complaint-settings"
        >

            <h2 class="section-title">
                Complaint Settings
            </h2>

            <p class="section-description">
                Citizen complaint registration ko control karein.
            </p>


            <div class="toggle-row">

                <div class="toggle-info">

                    <p class="toggle-title">
                        Complaint Registration
                    </p>

                    <p class="toggle-description">
                        ON hone par citizens complaint submit kar sakenge.
                        OFF hone par new complaint registration temporarily band rahega.
                    </p>

                </div>


                <label class="switch">

                    <input
                        type="checkbox"
                        id="complaintEnabled"
                        checked
                    >

                    <span class="slider"></span>

                </label>

            </div>

        </section>


        <button
            type="button"
            id="saveButton"
            class="save-button"
        >
            Save Profile
        </button>


        <div
            id="message"
            class="message"
        ></div>

    </main>

</div>


<script>

const ACCOUNT_KEY =
    "parshd_demo_account";


const account =
    JSON.parse(
        localStorage.getItem(
            ACCOUNT_KEY
        ) || "null"
    );


if (!account) {

    window.location.href =
        "./index.html";

    throw new Error(
        "Demo account not found"
    );
}


// =====================================
// ELEMENTS
// =====================================

const nameInput =
    document.getElementById("name");

const designationInput =
    document.getElementById("designation");

const wardInput =
    document.getElementById("ward");

const areaInput =
    document.getElementById("area");

const phoneInput =
    document.getElementById("phone");

const whatsappInput =
    document.getElementById("whatsapp");

const partyInput =
    document.getElementById("party");

const aboutInput =
    document.getElementById("about");

const complaintEnabled =
    document.getElementById(
        "complaintEnabled"
    );

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );

const logoInput =
    document.getElementById(
        "logoInput"
    );

const profilePreview =
    document.getElementById(
        "profilePreview"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );

const message =
    document.getElementById(
        "message"
    );


// =====================================
// LOAD EXISTING DATA
// =====================================

nameInput.value =
    account.name || "";

designationInput.value =
    account.designation || "";

wardInput.value =
    account.ward || "";

areaInput.value =
    account.area || "";

phoneInput.value =
    account.phone ||
    account.mobile ||
    "";

whatsappInput.value =
    account.whatsapp || "";

partyInput.value =
    account.party || "";

aboutInput.value =
    account.about || "";

complaintEnabled.checked =
    account.complaintEnabled !== false;


if (account.profilePhoto) {

    profilePreview.src =
        account.profilePhoto;
}


// =====================================
// IMAGE PREVIEW
// =====================================

profilePhotoInput.addEventListener(
    "change",
    () => {

        const file =
            profilePhotoInput.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            showMessage(
                "Profile photo ke liye image select karein.",
                "error"
            );

            profilePhotoInput.value = "";

            return;
        }


        const reader =
            new FileReader();

        reader.onload = () => {

            profilePreview.src =
                reader.result;
        };

        reader.readAsDataURL(file);
    }
);


// =====================================
// SAVE
// =====================================

saveButton.addEventListener(
    "click",
    () => {

        const name =
            nameInput.value.trim();

        const ward =
            wardInput.value.trim();

        const area =
            areaInput.value.trim();


        if (!name || !ward || !area) {

            showMessage(
                "Name, Ward Number और Area भरना जरूरी है।",
                "error"
            );

            return;
        }


        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";


        account.name =
            name;

        account.designation =
            designationInput.value.trim();

        account.ward =
            ward;

        account.area =
            area;

        account.phone =
            phoneInput.value.trim();

        account.whatsapp =
            whatsappInput.value.trim();

        account.party =
            partyInput.value.trim();

        account.about =
            aboutInput.value.trim();

        account.complaintEnabled =
            complaintEnabled.checked;

        account.updatedAt =
            Date.now();


        // Profile image demo storage
        if (
            profilePreview.src &&
            profilePreview.src.startsWith("data:")
        ) {

            account.profilePhoto =
                profilePreview.src;
        }


        // Logo
        const logoFile =
            logoInput.files[0];

        if (logoFile) {

            const reader =
                new FileReader();

            reader.onload = () => {

                account.partyLogo =
                    reader.result;

                finishSave();
            };

            reader.readAsDataURL(
                logoFile
            );

        } else {

            finishSave();
        }

    }
);


function finishSave() {

    localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify(account)
    );


    showMessage(
        "Profile successfully save हो गई।",
        "success"
    );


    saveButton.disabled = false;

    saveButton.textContent =
        "Save Profile";
}


// =====================================
// MESSAGE
// =====================================

function showMessage(
    text,
    type
) {

    message.textContent =
        text;

    message.className =
        `message show ${type}`;
}


// =====================================
// BACK
// =====================================

document
    .getElementById("backButton")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "./dashboard.html";

        }
    );

</script>

</body>
</html>