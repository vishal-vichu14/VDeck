// =====================================================
// VDECK — COMPLETE PROFILE
// EXHIBITOR PORTAL
// =====================================================


// =====================================================
// API
// =====================================================

const API_BASE_URL =
    "http://localhost:3000/api";


// =====================================================
// GET LOGGED-IN EXHIBITOR
// =====================================================

const storedExhibitor =
    localStorage.getItem(
        "vdeckExhibitor"
    );


// =====================================================
// CHECK LOGIN
// =====================================================

if (!storedExhibitor) {

    window.location.href =
        "index.html";

} else {

    try {

        const exhibitor =
            JSON.parse(
                storedExhibitor
            );

        console.log(
            "Local exhibitor:",
            exhibitor
        );

        loadLatestExhibitorData(
            exhibitor.exi_id
        );

    } catch (error) {

        console.error(
            "Invalid exhibitor session:",
            error
        );

        localStorage.removeItem(
            "vdeckExhibitor"
        );

        localStorage.removeItem(
            "vdeckExhibitorLoggedIn"
        );

        window.location.href =
            "index.html";
    }
}


// =====================================================
// GET LATEST EXHIBITOR FROM BACKEND
// =====================================================

async function loadLatestExhibitorData(
    exi_id
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/exhibitors/${exi_id}`
            );


        const data =
            await response.json();


        console.log(
            "Latest exhibitor from backend:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load exhibitor profile."
            );
        }


        // -------------------------------------------------
        // GET EXHIBITOR OBJECT
        // -------------------------------------------------

        const exhibitor =
            data.exhibitor ||
            data;


        console.log(
            "Exhibitor object:",
            exhibitor
        );


        // -------------------------------------------------
        // SAVE LATEST DATA
        // -------------------------------------------------

        localStorage.setItem(
            "vdeckExhibitor",
            JSON.stringify(
                exhibitor
            )
        );


        // -------------------------------------------------
        // LOAD PAGE
        // -------------------------------------------------

        loadExhibitorData(
            exhibitor
        );

    } catch (error) {

        console.error(
            "Error loading exhibitor:",
            error
        );


        showMessage(
            error.message ||
            "Could not load your profile.",
            "error"
        );
    }
}


// =====================================================
// LOAD EXHIBITOR DATA INTO PAGE
// =====================================================

function loadExhibitorData(
    exhibitor
) {

    console.log(
        "Loading exhibitor data:",
        exhibitor
    );


    // =================================================
    // VERIFIED INFORMATION
    // =================================================

    setValue(
        "exiName",
        exhibitor.exi_name
    );


    setValue(
        "organization",
        exhibitor.organization
    );


    setValue(
        "exiDesignation",
        exhibitor.exi_designation
    );


    setValue(
        "exiPhone",
        exhibitor.exi_phonenumber
    );


    setValue(
        "exiEmail",
        exhibitor.exi_email
    );


    setValue(
        "exiLocation",
        exhibitor.exi_location
    );


    setValue(
        "exiCode",
        exhibitor.exi_code
    );


    // =================================================
    // EVENT
    // =================================================

    let eventName = "";
    let eventLocation = "";


    // -------------------------------------------------
    // CASE 1
    // Nested event object
    // -------------------------------------------------

    if (
        exhibitor.event &&
        typeof exhibitor.event === "object"
    ) {

        eventName =
            exhibitor.event.eve_name ||
            "";

        eventLocation =
            exhibitor.event.eve_location ||
            "";
    }


    // -------------------------------------------------
    // CASE 2
    // Flat event fields
    // -------------------------------------------------

    if (!eventName) {

        eventName =
            exhibitor.eve_name ||
            "";
    }


    if (!eventLocation) {

        eventLocation =
            exhibitor.eve_location ||
            "";
    }


    // -------------------------------------------------
    // DISPLAY EVENT
    // -------------------------------------------------

    setText(
        "eventName",
        eventName ||
        "Event information unavailable"
    );


    setText(
        "eventLocation",
        eventLocation ||
        "Location unavailable"
    );


    // =================================================
    // PROFILE INFORMATION
    // =================================================

    setValue(
        "exiDescription",
        exhibitor.exi_description
    );


    setValue(
        "orgDescription",
        exhibitor.org_description
    );


    setValue(
        "exiWhatsapp",
        exhibitor.exi_whatsapp
    );


    setValue(
        "exiWebsite",
        exhibitor.exi_website
    );


    setValue(
        "exiLinkedin",
        exhibitor.exi_linkedin
    );


    setValue(
        "exiFacebook",
        exhibitor.exi_facebook
    );


    setValue(
        "exiInstagram",
        exhibitor.exi_instagram
    );


    // =================================================
    // EXISTING FILES
    // =================================================

    showExistingFile(
        "exiPhoto",
        exhibitor.exi_photo,
        "Profile photo already uploaded."
    );


    showExistingFile(
        "orgLogo",
        exhibitor.org_logo,
        "Organization logo already uploaded."
    );


    showExistingFile(
        "exiBrochure",
        exhibitor.exi_brochure,
        "Organization brochure already uploaded."
    );
}


// =====================================================
// SET INPUT VALUE
// =====================================================

function setValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    if (
        value !== null &&
        value !== undefined &&
        value !== ""
    ) {

        element.value =
            value;

    } else {

        element.value =
            "";
    }
}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        value || "";
}


// =====================================================
// EXISTING FILE MESSAGE
// =====================================================

function showExistingFile(
    inputId,
    filePath,
    message
) {

    if (!filePath) {
        return;
    }


    const input =
        document.getElementById(
            inputId
        );


    if (!input) {
        return;
    }


    const parent =
        input.parentElement;


    // -------------------------------------------------
    // Prevent duplicate message
    // -------------------------------------------------

    if (
        parent.querySelector(
            ".existing-file"
        )
    ) {

        return;
    }


    const existingText =
        document.createElement(
            "div"
        );


    existingText.className =
        "existing-file";


    existingText.textContent =
        message;


    parent.appendChild(
        existingText
    );
}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "profileMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        "profile-message";


    if (type) {

        messageElement.classList.add(
            type
        );
    }
}


// =====================================================
// NEXT BUTTON
// =====================================================

const nextBtn =
    document.getElementById(
        "nextBtn"
    );


nextBtn.addEventListener(
    "click",
    async function () {

        // =================================================
        // GET CURRENT EXHIBITOR
        // =================================================

        const stored =
            localStorage.getItem(
                "vdeckExhibitor"
            );


        if (!stored) {

            showMessage(
                "Session expired. Please login again.",
                "error"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "index.html";

                },
                1200
            );


            return;
        }


        let exhibitor;


        try {

            exhibitor =
                JSON.parse(
                    stored
                );

        } catch (error) {

            showMessage(
                "Invalid session. Please login again.",
                "error"
            );


            return;
        }


        // =================================================
        // CHECK EXHIBITOR ID
        // =================================================

        if (!exhibitor.exi_id) {

            showMessage(
                "Exhibitor ID is missing.",
                "error"
            );


            return;
        }


        // =================================================
        // DISABLE BUTTON
        // =================================================

        nextBtn.disabled =
            true;


        nextBtn.textContent =
            "SAVING...";


        showMessage(
            "",
            ""
        );


        // =================================================
        // CREATE FORMDATA
        // =================================================

        const formData =
            new FormData();


        // =================================================
        // TEXT DATA
        // =================================================

        formData.append(
            "exi_description",
            document.getElementById(
                "exiDescription"
            ).value.trim()
        );


        formData.append(
            "org_description",
            document.getElementById(
                "orgDescription"
            ).value.trim()
        );


        formData.append(
            "exi_whatsapp",
            document.getElementById(
                "exiWhatsapp"
            ).value.trim()
        );


        formData.append(
            "exi_website",
            document.getElementById(
                "exiWebsite"
            ).value.trim()
        );


        formData.append(
            "exi_linkedin",
            document.getElementById(
                "exiLinkedin"
            ).value.trim()
        );


        formData.append(
            "exi_facebook",
            document.getElementById(
                "exiFacebook"
            ).value.trim()
        );


        formData.append(
            "exi_instagram",
            document.getElementById(
                "exiInstagram"
            ).value.trim()
        );


        // =================================================
        // PROFILE PHOTO
        // =================================================

        const photoInput =
            document.getElementById(
                "exiPhoto"
            );


        if (
            photoInput.files &&
            photoInput.files.length > 0
        ) {

            formData.append(
                "exi_photo",
                photoInput.files[0]
            );
        }


        // =================================================
        // ORGANIZATION LOGO
        // =================================================

        const logoInput =
            document.getElementById(
                "orgLogo"
            );


        if (
            logoInput.files &&
            logoInput.files.length > 0
        ) {

            formData.append(
                "org_logo",
                logoInput.files[0]
            );
        }


        // =================================================
        // BROCHURE
        // =================================================

        const brochureInput =
            document.getElementById(
                "exiBrochure"
            );


        if (
            brochureInput.files &&
            brochureInput.files.length > 0
        ) {

            formData.append(
                "exi_brochure",
                brochureInput.files[0]
            );
        }


        // =================================================
        // SEND TO BACKEND
        // =================================================

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/exhibitors/${exhibitor.exi_id}`,
                    {
                        method: "PUT",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Could not update profile."
                );
            }


            // =================================================
            // SAVE UPDATED EXHIBITOR
            // =================================================

            if (data.exhibitor) {

                localStorage.setItem(
                    "vdeckExhibitor",
                    JSON.stringify(
                        data.exhibitor
                    )
                );
            }


            // =================================================
            // MARK PROFILE AS COMPLETED
            // =================================================

            localStorage.setItem(
                "vdeckExhibitorProfileCompleted",
                "true"
            );


            // =================================================
            // SUCCESS
            // =================================================

            showMessage(
                "Profile saved successfully.",
                "success"
            );


            nextBtn.textContent =
                "DONE ✓";


            // =================================================
            // GO TO MY PROFILE
            // =================================================

            setTimeout(
                function () {

                    window.location.href =
                        "home.html";

                },
                800
            );


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            showMessage(
                error.message ||
                "Something went wrong while saving your profile.",
                "error"
            );


            nextBtn.disabled =
                false;


            nextBtn.textContent =
                "NEXT →";
        }
    }
);