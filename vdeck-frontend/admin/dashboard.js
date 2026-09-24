const API_BASE_URL = "http://localhost:3000/api";


// =========================================
// ADMIN SESSION
// =========================================

const isLoggedIn =
    localStorage.getItem("vdeckAdminLoggedIn");

if (isLoggedIn !== "true") {

    window.location.href = "index.html";

}


// =========================================
// ADMIN EMAIL
// =========================================

const adminEmail =
    localStorage.getItem("vdeckAdminEmail") ||
    "admin@vdeck.com";

document.getElementById("adminEmail").textContent =
    adminEmail;


// =========================================
// GLOBAL DATA
// =========================================

let organizations = [];
let events = [];
let exhibitors = [];

let selectedExhibitorEventId = "";


// =========================================
// ELEMENTS
// =========================================

const sidebar =
    document.getElementById("sidebar");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// =========================================
// NAVIGATION
// =========================================

const navItems =
    document.querySelectorAll(".nav-item");

const sections = {
    overview:
        document.getElementById("overviewSection"),

    organizations:
        document.getElementById("organizationsSection"),

    events:
        document.getElementById("eventsSection"),

    exhibitors:
        document.getElementById("exhibitorsSection")
};


function showSection(sectionName) {

    Object.values(sections).forEach(section => {

        section.classList.remove("active-section");

    });


    navItems.forEach(item => {

        item.classList.remove("active");

    });


    if (sections[sectionName]) {

        sections[sectionName]
            .classList.add("active-section");

    }


    const activeNav =
        document.querySelector(
            `.nav-item[data-section="${sectionName}"]`
        );


    if (activeNav) {

        activeNav.classList.add("active");

    }


    if (sectionName === "organizations") {

        loadOrganizations();

    }


    if (sectionName === "events") {

        loadOrganizations();
        loadEvents();

    }


    if (sectionName === "exhibitors") {

        loadEvents();

    }


    sidebar.classList.remove("mobile-open");

}


navItems.forEach(item => {

    item.addEventListener("click", () => {

        showSection(
            item.dataset.section
        );

    });

});


// =========================================
// QUICK ACTIONS
// =========================================

document
    .querySelectorAll(".quick-action")
    .forEach(button => {

        button.addEventListener("click", () => {

            showSection(
                button.dataset.go
            );

        });

    });


// =========================================
// MOBILE MENU
// =========================================

mobileMenuBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "mobile-open"
        );

    }
);


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "vdeckAdminLoggedIn"
        );

        localStorage.removeItem(
            "vdeckAdminEmail"
        );

        window.location.href =
            "index.html";

    }
);


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =========================================
// API HELPER
// =========================================

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(url, options);


    let data = {};

    try {

        data =
            await response.json();

    } catch (error) {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            "Request failed"
        );

    }


    return data;

}


// =========================================
// ORGANIZATIONS
// =========================================

const organizationFormContainer =
    document.getElementById(
        "organizationFormContainer"
    );

const organizationForm =
    document.getElementById(
        "organizationForm"
    );

const organizationName =
    document.getElementById(
        "organizationName"
    );

const organizationLocation =
    document.getElementById(
        "organizationLocation"
    );

const organizationMessage =
    document.getElementById(
        "organizationMessage"
    );

const organizationsTableBody =
    document.getElementById(
        "organizationsTableBody"
    );


document
    .getElementById(
        "showOrganizationFormBtn"
    )
    .addEventListener(
        "click",
        () => {

            organizationFormContainer
                .classList.toggle("hidden");

            organizationMessage.textContent =
                "";

        }
    );


document
    .getElementById(
        "cancelOrganizationBtn"
    )
    .addEventListener(
        "click",
        () => {

            organizationForm.reset();

            organizationFormContainer
                .classList.add("hidden");

            organizationMessage.textContent =
                "";

        }
    );


async function loadOrganizations() {

    try {

        const data =
            await apiRequest(
                `${API_BASE_URL}/organizations`
            );


        if (Array.isArray(data)) {

            organizations = data;

        } else {

            organizations =
                data.organizations || [];

        }


        renderOrganizations();

        populateOrganizationDropdown();

    } catch (error) {

        console.error(
            "Load organizations error:",
            error
        );

        organizationsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">
                    Unable to load organizations.
                </td>
            </tr>
        `;

    }

}


function renderOrganizations() {

    if (!organizations.length) {

        organizationsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">
                    No organizations found.
                </td>
            </tr>
        `;

        return;

    }


    organizationsTableBody.innerHTML =
        organizations.map(org => {

            const verified =
                org.org_verified === true;


            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                org.org_name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            org.orgn_location ||
                            "—"
                        )}
                    </td>

                    <td>

                        ${
                            verified

                            ? `
                                <span class="verified-badge">
                                    ✓ VDeck Verified
                                </span>
                            `

                            : `
                                <span class="unverified-badge">
                                    Unverified
                                </span>
                            `
                        }

                    </td>

                    <td>

                        ${
                            verified

                            ? `
                                <span class="verified-text">
                                    Verified
                                </span>
                            `

                            : `
                                <button
                                    class="verify-btn"
                                    data-org-id="${escapeHTML(
                                        org.orgn_id
                                    )}">

                                    Verify Organization

                                </button>
                            `
                        }

                    </td>

                </tr>
            `;

        }).join("");


    document
        .querySelectorAll(".verify-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    verifyOrganization(
                        button.dataset.orgId
                    );

                }
            );

        });

}


organizationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            organizationName.value.trim();

        const location =
            organizationLocation.value.trim();


        if (!name) {

            showMessage(
                organizationMessage,
                "Organization name is required.",
                "error"
            );

            return;

        }


        try {

            const data =
                await apiRequest(
                    `${API_BASE_URL}/organizations`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                org_name: name,
                                orgn_location:
                                    location,
                                org_verified:
                                    false
                            })
                    }
                );


            showMessage(
                organizationMessage,
                data.message ||
                "Organization created successfully.",
                "success"
            );


            organizationForm.reset();

            await loadOrganizations();


        } catch (error) {

            showMessage(
                organizationMessage,
                error.message,
                "error"
            );

        }

    }
);


async function verifyOrganization(
    organizationId
) {

    const confirmed =
        confirm(
            "Are you sure you want to verify this organization?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const data =
            await apiRequest(
                `${API_BASE_URL}/organizations/${organizationId}/verify`,
                {
                    method: "PUT"
                }
            );


        alert(
            data.message ||
            "Organization verified successfully."
        );


        await loadOrganizations();


    } catch (error) {

        alert(
            error.message ||
            "Unable to verify organization."
        );

    }

}


document
    .getElementById(
        "refreshOrganizationsBtn"
    )
    .addEventListener(
        "click",
        loadOrganizations
    );


// =========================================
// EVENT MANAGEMENT
// =========================================

const eventFormContainer =
    document.getElementById(
        "eventFormContainer"
    );

const eventForm =
    document.getElementById(
        "eventForm"
    );

const eventOrganization =
    document.getElementById(
        "eventOrganization"
    );

const eventOrganizationStatus =
    document.getElementById(
        "eventOrganizationStatus"
    );

const eventsTableBody =
    document.getElementById(
        "eventsTableBody"
    );

const eventMessage =
    document.getElementById(
        "eventMessage"
    );


document
    .getElementById(
        "showEventFormBtn"
    )
    .addEventListener(
        "click",
        () => {

            eventFormContainer
                .classList.toggle("hidden");

            eventMessage.textContent =
                "";

            populateOrganizationDropdown();

        }
    );


document
    .getElementById(
        "cancelEventBtn"
    )
    .addEventListener(
        "click",
        () => {

            eventForm.reset();

            eventFormContainer
                .classList.add("hidden");

            eventOrganizationStatus.textContent =
                "";

            eventMessage.textContent =
                "";

        }
    );


function populateOrganizationDropdown() {

    if (!eventOrganization) {

        return;

    }


    const currentValue =
        eventOrganization.value;


    eventOrganization.innerHTML = `
        <option value="">
            Select Organization
        </option>
    `;


    organizations.forEach(org => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            org.orgn_id;


        option.textContent =
            org.org_name +
            (
                org.org_verified
                    ? " ✓ VDeck Verified"
                    : " — Unverified"
            );


        eventOrganization
            .appendChild(option);

    });


    eventOrganization.value =
        currentValue || "";

}


eventOrganization.addEventListener(
    "change",
    () => {

        const selected =
            organizations.find(
                org =>
                    org.orgn_id ===
                    eventOrganization.value
            );


        if (!selected) {

            eventOrganizationStatus.textContent =
                "";

            return;

        }


        if (selected.org_verified) {

            eventOrganizationStatus.textContent =
                "✓ VDeck Verified organization";

            eventOrganizationStatus.className =
                "verified-status";

        } else {

            eventOrganizationStatus.textContent =
                "⚠ This organization is not yet verified.";

            eventOrganizationStatus.className =
                "unverified-status";

        }

    }
);


async function loadEvents() {

    try {

        const data =
            await apiRequest(
                `${API_BASE_URL}/events`
            );


        if (Array.isArray(data)) {

            events = data;

        } else {

            events =
                data.events || [];

        }


        renderEvents();

        populateExhibitorEventDropdown();


    } catch (error) {

        console.error(
            "Load events error:",
            error
        );


        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">
                    Unable to load events.
                </td>
            </tr>
        `;

    }

}


function getOrganizationName(
    organizationId
) {

    const organization =
        organizations.find(
            org =>
                org.orgn_id ===
                organizationId
        );


    return organization
        ? organization.org_name
        : "Unknown";

}


function formatEventDate(value) {

    if (!value) {

        return "—";

    }


    return String(value)
        .slice(0, 10);

}


function renderEvents() {

    if (!events.length) {

        eventsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">
                    No events found.
                </td>
            </tr>
        `;

        return;

    }


    eventsTableBody.innerHTML =
        events.map(event => {

            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHTML(
                                event.eve_name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            getOrganizationName(
                                event.orgn_id
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            event.eve_location ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatEventDate(
                                event.eve_start
                            )
                        )}

                        &nbsp;—&nbsp;

                        ${escapeHTML(
                            formatEventDate(
                                event.eve_end
                            )
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


eventForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            document
                .getElementById("eventName")
                .value
                .trim();


        const organizationId =
            eventOrganization.value;


        const location =
            document
                .getElementById("eventLocation")
                .value
                .trim();


        const startDate =
            document
                .getElementById("eventStart")
                .value;


        const endDate =
            document
                .getElementById("eventEnd")
                .value;


        if (!name ||
            !organizationId ||
            !startDate ||
            !endDate) {

            showMessage(
                eventMessage,
                "Please complete all required fields.",
                "error"
            );

            return;

        }


        if (endDate < startDate) {

            showMessage(
                eventMessage,
                "End date cannot be before start date.",
                "error"
            );

            return;

        }


        try {

            const data =
                await apiRequest(
                    `${API_BASE_URL}/events`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                eve_name:
                                    name,

                                orgn_id:
                                    organizationId,

                                eve_location:
                                    location,

                                eve_start:
                                    startDate,

                                eve_end:
                                    endDate

                            })
                    }
                );


            showMessage(
                eventMessage,
                data.message ||
                "Event created successfully.",
                "success"
            );


            eventForm.reset();

            await loadEvents();


        } catch (error) {

            showMessage(
                eventMessage,
                error.message,
                "error"
            );

        }

    }
);


document
    .getElementById(
        "refreshEventsBtn"
    )
    .addEventListener(
        "click",
        async () => {

            await loadOrganizations();
            await loadEvents();

        }
    );


// =========================================
// EXHIBITOR MANAGEMENT
// =========================================

const exhibitorEventSelect =
    document.getElementById(
        "exhibitorEventSelect"
    );

const selectedEventInfo =
    document.getElementById(
        "selectedEventInfo"
    );

const selectedEventName =
    document.getElementById(
        "selectedEventName"
    );

const selectedEventOrganization =
    document.getElementById(
        "selectedEventOrganization"
    );

const selectedEventLocation =
    document.getElementById(
        "selectedEventLocation"
    );

const exhibitorFile =
    document.getElementById(
        "exhibitorFile"
    );

const selectedFileName =
    document.getElementById(
        "selectedFileName"
    );

const importExhibitorsBtn =
    document.getElementById(
        "importExhibitorsBtn"
    );

const exhibitorImportMessage =
    document.getElementById(
        "exhibitorImportMessage"
    );

const exhibitorsTableBody =
    document.getElementById(
        "exhibitorsTableBody"
    );

const exhibitorCountText =
    document.getElementById(
        "exhibitorCountText"
    );

const refreshExhibitorsBtn =
    document.getElementById(
        "refreshExhibitorsBtn"
    );


// =========================================
// POPULATE EVENT DROPDOWN
// =========================================

function populateExhibitorEventDropdown() {

    if (!exhibitorEventSelect) {

        return;

    }


    const currentValue =
        selectedExhibitorEventId ||
        exhibitorEventSelect.value;


    exhibitorEventSelect.innerHTML = `
        <option value="">
            Select Event
        </option>
    `;


    events.forEach(event => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            event.eve_id;


        option.textContent =
            event.eve_name;


        exhibitorEventSelect
            .appendChild(option);

    });


    if (currentValue) {

        exhibitorEventSelect.value =
            currentValue;

    }

}


// =========================================
// EVENT SELECTION
// =========================================

exhibitorEventSelect.addEventListener(
    "change",
    async () => {

        selectedExhibitorEventId =
            exhibitorEventSelect.value;


        const selectedEvent =
            events.find(
                event =>
                    event.eve_id ===
                    selectedExhibitorEventId
            );


        exhibitorImportMessage.textContent =
            "";


        if (!selectedEvent) {

            selectedEventInfo
                .classList.add("hidden");

            refreshExhibitorsBtn.disabled =
                true;

            importExhibitorsBtn.disabled =
                true;

            exhibitorsTableBody.innerHTML = "";

            exhibitorCountText.textContent =
                "Select an event to view exhibitors.";

            return;

        }


        selectedEventInfo
            .classList.remove("hidden");


        selectedEventName.textContent =
            selectedEvent.eve_name ||
            "—";


        selectedEventOrganization.textContent =
            getOrganizationName(
                selectedEvent.orgn_id
            );


        selectedEventLocation.textContent =
            selectedEvent.eve_location ||
            "—";


        refreshExhibitorsBtn.disabled =
            false;


        updateImportButton();


        await loadExhibitors(
            selectedExhibitorEventId
        );

    }
);


// =========================================
// FILE SELECTION
// =========================================

exhibitorFile.addEventListener(
    "change",
    () => {

        if (
            exhibitorFile.files &&
            exhibitorFile.files.length > 0
        ) {

            selectedFileName.textContent =
                exhibitorFile.files[0].name;

        } else {

            selectedFileName.textContent =
                "No file selected";

        }


        updateImportButton();

    }
);


function updateImportButton() {

    const hasEvent =
        Boolean(
            selectedExhibitorEventId
        );


    const hasFile =
        Boolean(
            exhibitorFile.files &&
            exhibitorFile.files.length > 0
        );


    importExhibitorsBtn.disabled =
        !(hasEvent && hasFile);

}


// =========================================
// IMPORT EXHIBITORS
// =========================================

importExhibitorsBtn.addEventListener(
    "click",
    async () => {

        if (!selectedExhibitorEventId) {

            showMessage(
                exhibitorImportMessage,
                "Please select an event first.",
                "error"
            );

            return;

        }


        if (
            !exhibitorFile.files ||
            !exhibitorFile.files.length
        ) {

            showMessage(
                exhibitorImportMessage,
                "Please choose an Excel or CSV file.",
                "error"
            );

            return;

        }


        const file =
            exhibitorFile.files[0];


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "event_id",
            selectedExhibitorEventId
        );


        importExhibitorsBtn.disabled =
            true;


        importExhibitorsBtn.textContent =
            "Importing...";


        exhibitorImportMessage.textContent =
            "";


        try {

            const data =
                await apiRequest(
                    `${API_BASE_URL}/exhibitors/import`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            showMessage(
                exhibitorImportMessage,
                data.message ||
                "Exhibitors imported successfully.",
                "success"
            );


            exhibitorFile.value =
                "";


            selectedFileName.textContent =
                "No file selected";


            await loadExhibitors(
                selectedExhibitorEventId
            );


        } catch (error) {

            showMessage(
                exhibitorImportMessage,
                error.message ||
                "Unable to import exhibitors.",
                "error"
            );

        } finally {

            importExhibitorsBtn.textContent =
                "Import Exhibitors";


            updateImportButton();

        }

    }
);


// =========================================
// LOAD EXHIBITORS
// =========================================

async function loadExhibitors(
    eventId
) {

    if (!eventId) {

        return;

    }


    try {

        const data =
            await apiRequest(
                `${API_BASE_URL}/exhibitors/event/${eventId}`
            );


        if (Array.isArray(data)) {

            exhibitors = data;

        } else {

            exhibitors =
                data.exhibitors || [];

        }


        renderExhibitors();


    } catch (error) {

        console.error(
            "Load exhibitors error:",
            error
        );


        exhibitors = [];


        exhibitorsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    Unable to load exhibitors.
                </td>
            </tr>
        `;


        exhibitorCountText.textContent =
            "Unable to load exhibitors.";

    }

}


// =========================================
// RENDER EXHIBITORS
// =========================================

function renderExhibitors() {

    if (!exhibitors.length) {

        exhibitorsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">
                    No exhibitors have been imported
                    for this event yet.
                </td>
            </tr>
        `;

        exhibitorCountText.textContent =
            "0 exhibitors imported.";

        return;
    }


    exhibitorCountText.textContent =
        `${exhibitors.length} exhibitor${
            exhibitors.length === 1
                ? ""
                : "s"
        } imported.`;


    /*
    =========================================
    SORT EXHIBITORS
    =========================================

    Order:

    1. Stall number
    2. Organization
    3. Exhibitor name

    This ensures everyone from the same
    physical stall appears together.
    */

    const sortedExhibitors =
        [...exhibitors].sort((a, b) => {

            /*
            -----------------------------
            STALL
            -----------------------------
            */

            const stallA =
                String(
                    a.exi_stall || ""
                )
                .trim()
                .toUpperCase();

            const stallB =
                String(
                    b.exi_stall || ""
                )
                .trim()
                .toUpperCase();


            const stallComparison =
                stallA.localeCompare(
                    stallB,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                );


            if (stallComparison !== 0) {

                return stallComparison;

            }


            /*
            -----------------------------
            ORGANIZATION
            -----------------------------
            */

            const organizationA =
                String(
                    a.organization || ""
                )
                .trim();

            const organizationB =
                String(
                    b.organization || ""
                )
                .trim();


            const organizationComparison =
                organizationA.localeCompare(
                    organizationB,
                    undefined,
                    {
                        sensitivity: "base"
                    }
                );


            if (organizationComparison !== 0) {

                return organizationComparison;

            }


            /*
            -----------------------------
            EXHIBITOR NAME
            -----------------------------
            */

            const nameA =
                String(
                    a.exi_name || ""
                )
                .trim();

            const nameB =
                String(
                    b.exi_name || ""
                )
                .trim();


            return nameA.localeCompare(
                nameB,
                undefined,
                {
                    sensitivity: "base"
                }
            );

        });


    /*
    =========================================
    BUILD TABLE
    =========================================
    */

    exhibitorsTableBody.innerHTML =
        sortedExhibitors.map(exhibitor => {

            const contactParts = [];


            /*
            -----------------------------
            PHONE
            -----------------------------
            */

            if (exhibitor.exi_phonenumber) {

                contactParts.push(
                    `<span>${escapeHTML(
                        exhibitor.exi_phonenumber
                    )}</span>`
                );

            }


            /*
            -----------------------------
            EMAIL
            -----------------------------
            */

            if (exhibitor.exi_email) {

                contactParts.push(
                    `<span>${escapeHTML(
                        exhibitor.exi_email
                    )}</span>`
                );

            }


            /*
            -----------------------------
            STALL
            -----------------------------
            */

            const stallNumber =
                String(
                    exhibitor.exi_stall || ""
                )
                .trim();


            return `
                <tr>

                    <!-- EXHIBITOR -->

                    <td>

                        <strong>
                            ${escapeHTML(
                                exhibitor.exi_name
                            )}
                        </strong>

                        ${
                            exhibitor.exi_location

                            ? `
                                <small class="table-subtext">
                                    ${escapeHTML(
                                        exhibitor.exi_location
                                    )}
                                </small>
                            `

                            : ""
                        }

                    </td>


                    <!-- ORGANIZATION -->

                    <td>
                        ${escapeHTML(
                            exhibitor.organization ||
                            "—"
                        )}
                    </td>


                    <!-- STALL -->

                    <td>

                        ${
                            stallNumber

                            ? `
                                <span class="stall-badge">
                                    ${escapeHTML(
                                        stallNumber
                                    )}
                                </span>
                            `

                            : `
                                <span class="stall-empty">
                                    Unassigned
                                </span>
                            `
                        }

                    </td>


                    <!-- DESIGNATION -->

                    <td>
                        ${escapeHTML(
                            exhibitor.exi_designation ||
                            "—"
                        )}
                    </td>


                    <!-- CONTACT -->

                    <td>

                        <div class="contact-stack">

                            ${
                                contactParts.length

                                ? contactParts.join("")

                                : "<span>—</span>"
                            }

                        </div>

                    </td>


                    <!-- LOGIN CODE -->

                    <td>

                        ${
                            exhibitor.exi_code

                            ? `
                                <span class="exhibitor-code">
                                    ${escapeHTML(
                                        exhibitor.exi_code
                                    )}
                                </span>
                            `

                            : `
                                <span>
                                    —
                                </span>
                            `
                        }

                    </td>

                </tr>
            `;

        }).join("");

}

// =========================================
// REFRESH EXHIBITORS
// =========================================

refreshExhibitorsBtn.addEventListener(
    "click",
    async () => {

        if (!selectedExhibitorEventId) {

            return;

        }


        await loadExhibitors(
            selectedExhibitorEventId
        );

    }
);


// =========================================
// MESSAGE HELPER
// =========================================

function showMessage(
    element,
    message,
    type
) {

    element.textContent =
        message;

    element.className =
        `dashboard-message ${type}`;

}


// =========================================
// INITIAL LOAD
// =========================================

async function initializeDashboard() {

    await loadOrganizations();

    await loadEvents();

}


// Start dashboard

initializeDashboard();