// ======================================================
// VDECK EXHIBITOR CONNECTIONS
// ======================================================


// ======================================================
// CHECK LOGIN
// ======================================================

const isLoggedIn =
    localStorage.getItem("vdeckExhibitorLoggedIn");

if (isLoggedIn !== "true") {
    window.location.href = "index.html";
}


// ======================================================
// GET EXHIBITOR DATA
// ======================================================

const exhibitorData =
    localStorage.getItem("vdeckExhibitor");

if (!exhibitorData) {
    window.location.href = "index.html";
}

const exhibitor =
    JSON.parse(exhibitorData);


// ======================================================
// ELEMENTS
// ======================================================

const connectionCount =
    document.getElementById("connectionCount");

const eventName =
    document.getElementById("eventName");

const eventLocation =
    document.getElementById("eventLocation");

const connectionsList =
    document.getElementById("connectionsList");

const loadingMessage =
    document.getElementById("loadingMessage");

const emptyMessage =
    document.getElementById("emptyMessage");

const errorMessage =
    document.getElementById("errorMessage");

const backHomeBtn =
    document.getElementById("backHomeBtn");


// ======================================================
// API URL
// ======================================================

const API_BASE_URL =
    "http://localhost:3000/api";


// ======================================================
// LOAD CONNECTIONS
// ======================================================

async function loadConnections() {

    try {

        // ------------------------------------------------
        // SHOW LOADING
        // ------------------------------------------------

        loadingMessage.style.display = "block";
        emptyMessage.style.display = "none";
        errorMessage.style.display = "none";

        connectionsList.innerHTML = "";


        // ------------------------------------------------
        // CHECK EXHIBITOR ID
        // ------------------------------------------------

        if (!exhibitor.exi_id) {

            throw new Error(
                "Exhibitor information is missing."
            );

        }


        // ------------------------------------------------
        // FETCH CONNECTIONS
        // ------------------------------------------------

        const response = await fetch(
            `${API_BASE_URL}/connections/exhibitor/${exhibitor.exi_id}`
        );


        if (!response.ok) {

            throw new Error(
                "Could not load connections."
            );

        }


        const data =
            await response.json();


        // ------------------------------------------------
        // HIDE LOADING
        // ------------------------------------------------

        loadingMessage.style.display = "none";


        // =================================================
        // CONNECTION COUNT
        // =================================================

        connectionCount.textContent =
            data.lead_count || 0;


        // =================================================
        // EVENT INFORMATION
        // =================================================

        if (
            data.leads &&
            data.leads.length > 0
        ) {

            const firstLead =
                data.leads[0];

            eventName.textContent =
                firstLead.eve_name ||
                "Current Event";

            eventLocation.textContent =
                firstLead.eve_location ||
                "-";

        }

        else if (
            exhibitor.event
        ) {

            eventName.textContent =
                exhibitor.event.eve_name ||
                "Current Event";

            eventLocation.textContent =
                exhibitor.event.eve_location ||
                "-";

        }


        // =================================================
        // NO CONNECTIONS
        // =================================================

        if (
            !data.leads ||
            data.leads.length === 0
        ) {

            emptyMessage.style.display =
                "block";

            return;

        }


        // =================================================
        // DISPLAY CONNECTIONS
        // =================================================

        data.leads.forEach(function (lead) {

            // ------------------------------------------------
            // MAIN CARD
            // ------------------------------------------------

            const card =
                document.createElement("div");

            card.className =
                "connection-card";


            // ------------------------------------------------
            // VISITOR AVATAR
            // ------------------------------------------------

            const avatar =
                document.createElement("div");

            avatar.className =
                "visitor-avatar";

            const visitorName =
                lead.vis_name ||
                "Visitor";

            avatar.textContent =
                visitorName
                    .trim()
                    .charAt(0)
                    .toUpperCase();


            // ------------------------------------------------
            // VISITOR INFORMATION
            // ------------------------------------------------

            const visitorInfo =
                document.createElement("div");

            visitorInfo.className =
                "visitor-info";


            // NAME
            const name =
                document.createElement("h3");

            name.className =
                "visitor-name";

            name.textContent =
                visitorName;


            // DESIGNATION
            const designation =
                document.createElement("p");

            designation.className =
                "visitor-role";

            designation.textContent =
                lead.vis_designation ||
                "Designation not provided";


            // ORGANIZATION
            const organization =
                document.createElement("p");

            organization.className =
                "visitor-organization";

            organization.textContent =
                lead.vis_orgn ||
                "Organization not provided";


            // ------------------------------------------------
            // ADD VISITOR INFORMATION
            // ------------------------------------------------

            visitorInfo.appendChild(name);
            visitorInfo.appendChild(designation);
            visitorInfo.appendChild(organization);


            // ------------------------------------------------
            // CONTACT INFORMATION
            // ------------------------------------------------

            const contactContainer =
                document.createElement("div");

            contactContainer.className =
                "visitor-contact";


            // EMAIL
            if (lead.vis_email) {

                const email =
                    document.createElement("a");

                email.className =
                    "contact-item";

                email.href =
                    `mailto:${lead.vis_email}`;

                email.textContent =
                    lead.vis_email;

                contactContainer.appendChild(
                    email
                );

            }


            // PHONE
            if (lead.vis_phonenumber) {

                const phone =
                    document.createElement("a");

                phone.className =
                    "contact-item";

                phone.href =
                    `tel:${lead.vis_phonenumber}`;

                phone.textContent =
                    lead.vis_phonenumber;

                contactContainer.appendChild(
                    phone
                );

            }


            // ------------------------------------------------
            // CONNECTION DATE
            // ------------------------------------------------

            const connectedAt =
                document.createElement("p");

            connectedAt.className =
                "connection-time";


            if (lead.connected_at) {

                const date =
                    new Date(
                        lead.connected_at
                    );

                connectedAt.textContent =
                    "Connected " +
                    date.toLocaleString(
                        "en-IN",
                        {
                            dateStyle: "medium",
                            timeStyle: "short"
                        }
                    );

            }

            else {

                connectedAt.textContent =
                    "Connection date unavailable";

            }


            // ------------------------------------------------
            // ADD DATE TO CONTACT COLUMN
            // ------------------------------------------------

            contactContainer.appendChild(
                connectedAt
            );


            // =================================================
            // BUILD FINAL CARD
            // =================================================

            card.appendChild(
                avatar
            );

            card.appendChild(
                visitorInfo
            );

            card.appendChild(
                contactContainer
            );


            // ------------------------------------------------
            // ADD CARD TO PAGE
            // ------------------------------------------------

            connectionsList.appendChild(
                card
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading connections:",
            error
        );


        // ------------------------------------------------
        // HIDE OTHER STATES
        // ------------------------------------------------

        loadingMessage.style.display =
            "none";

        emptyMessage.style.display =
            "none";


        // ------------------------------------------------
        // SHOW ERROR
        // ------------------------------------------------

        errorMessage.style.display =
            "block";

        errorMessage.textContent =
            error.message ||
            "Something went wrong while loading connections.";

    }

}


// ======================================================
// BACK TO HOME
// ======================================================

if (backHomeBtn) {

    backHomeBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "home.html";

        }
    );

}


// ======================================================
// LOAD PAGE
// ======================================================

loadConnections();