// =====================================================
// VDECK EXHIBITOR HOME
// =====================================================


// =====================================================
// API
// =====================================================

const API_BASE_URL =
    "http://localhost:3000/api";


// =====================================================
// CHECK LOGIN
// =====================================================

const loggedIn =
    localStorage.getItem(
        "vdeckExhibitorLoggedIn"
    );

const storedExhibitor =
    localStorage.getItem(
        "vdeckExhibitor"
    );


if (
    loggedIn !== "true" ||
    !storedExhibitor
) {
    window.location.href =
        "index.html";
}


// =====================================================
// GET EXHIBITOR
// =====================================================

let exhibitor;

try {

    exhibitor =
        JSON.parse(
            storedExhibitor
        );

} catch (error) {

    console.error(
        "Unable to read exhibitor data:",
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


// =====================================================
// ELEMENTS
// =====================================================

const eventName =
    document.getElementById(
        "eventName"
    );

const eventLocation =
    document.getElementById(
        "eventLocation"
    );

const exhibitorCount =
    document.getElementById(
        "exhibitorCount"
    );

const visitorCount =
    document.getElementById(
        "visitorCount"
    );

const connectionCount =
    document.getElementById(
        "connectionCount"
    );

const stallDiscoveryCount =
    document.getElementById(
        "stallDiscoveryCount"
    );

const discoveryPercentage =
    document.getElementById(
        "discoveryPercentage"
    );

const discoveryProgressBar =
    document.getElementById(
        "discoveryProgressBar"
    );

const homeMessage =
    document.getElementById(
        "homeMessage"
    );



// =====================================================
// LOAD EVENT STATS
// =====================================================

async function loadEventStats() {

    if (
        !exhibitor ||
        !exhibitor.exi_id
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/exhibitors/${exhibitor.exi_id}/stats`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load event statistics."
            );

        }



        // -------------------------------------------------
        // EVENT
        // -------------------------------------------------

        if (data.event) {

            eventName.textContent =
                data.event.eve_name ||
                "Event";


            eventLocation.textContent =
                data.event.eve_location ||
                "Location not provided";

        }



        // -------------------------------------------------
        // STATS
        // -------------------------------------------------

        if (data.stats) {

            // ---------------------------------------------
            // TOTAL EXHIBITORS
            // ---------------------------------------------

            const totalExhibitors =
                Number(
                    data.stats.exhibitors || 0
                );


            // ---------------------------------------------
            // TOTAL VISITORS
            // ---------------------------------------------

            const totalVisitors =
                Number(
                    data.stats.visitors || 0
                );


            // ---------------------------------------------
            // CONNECTIONS
            // ---------------------------------------------

            const totalConnections =
                Number(
                    data.stats.connections || 0
                );


            // ---------------------------------------------
            // UNIQUE STALLS DISCOVERED
            // ---------------------------------------------

            const stallsDiscovered =
                Number(
                    data.stats.stall_unlocks || 0
                );


            // ---------------------------------------------
            // BASIC STATS
            // ---------------------------------------------

            exhibitorCount.textContent =
                totalExhibitors;


            visitorCount.textContent =
                totalVisitors;


            connectionCount.textContent =
                totalConnections;



            // ---------------------------------------------
            // STALL DISCOVERY
            //
            // Example:
            // 2 / 7
            // ---------------------------------------------

            stallDiscoveryCount.textContent =
                `${stallsDiscovered} / ${totalExhibitors}`;



            // ---------------------------------------------
            // EVENT COVERAGE
            // ---------------------------------------------

            let percentage = 0;


            if (totalExhibitors > 0) {

                percentage =
                    (
                        stallsDiscovered /
                        totalExhibitors
                    ) * 100;

            }


            percentage =
                Math.min(
                    Math.max(
                        percentage,
                        0
                    ),
                    100
                );


            discoveryPercentage.textContent =
                `${percentage.toFixed(2)}%`;


            discoveryProgressBar.style.width =
                `${percentage}%`;

        }

    } catch (error) {

        console.error(
            "Error loading event statistics:",
            error
        );


        homeMessage.textContent =
            error.message ||
            "Unable to load event statistics.";

    }

}



// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById(
        "logoutBtn"
    )
    .addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "vdeckExhibitorLoggedIn"
            );

            localStorage.removeItem(
                "vdeckExhibitor"
            );

            localStorage.removeItem(
                "vdeckExhibitorProfileCompleted"
            );

            window.location.href =
                "index.html";

        }
    );



// =====================================================
// MY PROFILE
// =====================================================

document
    .getElementById(
        "myProfileBtn"
    )
    .addEventListener(
        "click",
        function () {

            window.location.href =
                "profile.html";

        }
    );



// =====================================================
// DASHBOARD
// =====================================================

document
    .getElementById(
        "dashboardBtn"
    )
    .addEventListener(
        "click",
        function () {

            window.location.href =
                "dashboard.html";

        }
    );



// =====================================================
// CONNECTIONS
// =====================================================

document
    .getElementById(
        "connectionsBtn"
    )
    .addEventListener(
        "click",
        function () {

            window.location.href =
                "connections.html";

        }
    );



// =====================================================
// START
// =====================================================

loadEventStats();