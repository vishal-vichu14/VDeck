const API_BASE_URL =
    "http://localhost:3000/api";


// --------------------------------------------------
// CHECK LOGIN
// --------------------------------------------------

const isLoggedIn =
    localStorage.getItem(
        "vdeckExhibitorLoggedIn"
    );

const storedExhibitor =
    localStorage.getItem(
        "vdeckExhibitor"
    );


if (
    isLoggedIn !== "true" ||
    !storedExhibitor
) {

    window.location.href = "index.html";

}


// --------------------------------------------------
// LOAD PROFILE
// --------------------------------------------------

const exhibitor =
    JSON.parse(storedExhibitor);


async function loadProfile() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/exhibitors/${exhibitor.exi_id}`
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Could not load profile."
            );

        }


        // --------------------------------------------------
        // UPDATE LOCAL STORAGE
        // --------------------------------------------------

        localStorage.setItem(
            "vdeckExhibitor",
            JSON.stringify(
                data.exhibitor
            )
        );


        displayProfile(
            data.exhibitor
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showMessage(
            error.message
        );

    }

}


// --------------------------------------------------
// DISPLAY PROFILE
// --------------------------------------------------

function displayProfile(
    exhibitor
) {


    // --------------------------------------------------
    // IDENTITY
    // --------------------------------------------------

    document.getElementById(
        "exhibitorName"
    ).textContent =
        exhibitor.exi_name || "-";


    document.getElementById(
        "exhibitorDesignation"
    ).textContent =
        exhibitor.exi_designation || "-";


    document.getElementById(
        "exhibitorOrganization"
    ).textContent =
        exhibitor.organization || "-";


    document.getElementById(
        "exhibitorEmail"
    ).textContent =
        exhibitor.exi_email || "-";


    document.getElementById(
        "exhibitorPhone"
    ).textContent =
        exhibitor.exi_phonenumber || "-";


    document.getElementById(
        "exhibitorLocation"
    ).textContent =
        exhibitor.exi_location || "-";


    document.getElementById(
        "exhibitorCode"
    ).textContent =
        exhibitor.exi_code || "-";


    // --------------------------------------------------
    // PROFILE INITIAL
    // --------------------------------------------------

    const initial =
        exhibitor.exi_name
            ? exhibitor.exi_name
                .charAt(0)
                .toUpperCase()
            : "V";


    document.getElementById(
        "profileInitial"
    ).textContent =
        initial;


    // --------------------------------------------------
    // EXHIBITOR PHOTO
    // --------------------------------------------------

    const photoContainer =
        document.getElementById(
            "profilePhotoContainer"
        );


    if (exhibitor.exi_photo) {

        const imageUrl =
            getFileUrl(
                exhibitor.exi_photo
            );


        photoContainer.innerHTML = `
            <img
                src="${imageUrl}"
                alt="Exhibitor Photo"
            >
        `;

    } else {

        photoContainer.innerHTML = `
            <span id="profileInitial">
                ${initial}
            </span>
        `;

    }


    // --------------------------------------------------
    // ORGANIZATION LOGO
    // --------------------------------------------------

    const logoContainer =
        document.getElementById(
            "organizationLogoContainer"
        );


    if (exhibitor.org_logo) {

        const logoUrl =
            getFileUrl(
                exhibitor.org_logo
            );


        logoContainer.innerHTML = `
            <img
                src="${logoUrl}"
                alt="Organization Logo"
            >
        `;

    } else {

        logoContainer.innerHTML = `
            <span>
                LOGO
            </span>
        `;

    }


    // --------------------------------------------------
    // DESCRIPTIONS
    // --------------------------------------------------

    document.getElementById(
        "exhibitorDescription"
    ).textContent =
        exhibitor.exi_description ||
        "No exhibitor description added yet.";


    document.getElementById(
        "organizationDescription"
    ).textContent =
        exhibitor.org_description ||
        "No organization description added yet.";


    // --------------------------------------------------
    // SOCIAL / CONTACT LINKS
    // --------------------------------------------------

    setupLink(
        "exhibitorWhatsapp",
        exhibitor.exi_whatsapp,
        "WhatsApp"
    );


    setupLink(
        "exhibitorWebsite",
        exhibitor.exi_website,
        "Website"
    );


    setupLink(
        "exhibitorLinkedin",
        exhibitor.exi_linkedin,
        "LinkedIn"
    );


    setupLink(
        "exhibitorFacebook",
        exhibitor.exi_facebook,
        "Facebook"
    );


    setupLink(
        "exhibitorInstagram",
        exhibitor.exi_instagram,
        "Instagram"
    );


    // --------------------------------------------------
    // BROCHURE
    // --------------------------------------------------

    const brochureLink =
        document.getElementById(
            "brochureLink"
        );


    if (exhibitor.exi_brochure) {

        brochureLink.href =
            getFileUrl(
                exhibitor.exi_brochure
            );

        brochureLink.style.display =
            "inline-flex";

    } else {

        brochureLink.style.display =
            "none";

    }


    // --------------------------------------------------
    // EVENT
    // --------------------------------------------------

    if (exhibitor.event) {

        document.getElementById(
            "eventName"
        ).textContent =
            exhibitor.event.eve_name || "-";


        document.getElementById(
            "eventLocation"
        ).textContent =
            exhibitor.event.eve_location || "-";

    } else {

        document.getElementById(
            "eventName"
        ).textContent =
            "No event assigned";


        document.getElementById(
            "eventLocation"
        ).textContent =
            "-";

    }

}


// --------------------------------------------------
// FILE URL
// --------------------------------------------------

function getFileUrl(
    filePath
) {

    if (!filePath) {
        return "";
    }


    if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://")
    ) {

        return filePath;

    }


    return `http://localhost:3000${filePath}`;

}


// --------------------------------------------------
// SOCIAL LINK SETUP
// --------------------------------------------------

function setupLink(
    elementId,
    value,
    label
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!value) {

        element.textContent =
            "Not added";

        element.removeAttribute(
            "href"
        );

        element.classList.add(
            "disabled-link"
        );

        return;

    }


    let url =
        value.trim();


    // WhatsApp number
    if (
        elementId ===
        "exhibitorWhatsapp"
    ) {

        url =
            `https://wa.me/${url.replace(/\D/g, "")}`;

    }

    // Website / social links
    else {

        if (
            !url.startsWith("http://") &&
            !url.startsWith("https://")
        ) {

            url =
                `https://${url}`;

        }

    }


    element.href =
        url;

    element.textContent =
        value;

    element.classList.remove(
        "disabled-link"
    );

}


// --------------------------------------------------
// EDIT PROFILE
// --------------------------------------------------

document.getElementById(
    "editProfileBtn"
).addEventListener(
    "click",
    function () {

        window.location.href =
            "complete-profile.html";

    }
);


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "vdeckExhibitorLoggedIn"
        );

        localStorage.removeItem(
            "vdeckExhibitor"
        );


        window.location.href =
            "index.html";

    }
);


// --------------------------------------------------
// MESSAGE
// --------------------------------------------------

function showMessage(
    message
) {

    const element =
        document.getElementById(
            "profileMessage"
        );


    element.textContent =
        message;

}


// --------------------------------------------------
// START
// --------------------------------------------------

loadProfile();