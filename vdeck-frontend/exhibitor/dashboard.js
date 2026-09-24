// =====================================================
// VDECK EXPO INTELLIGENCE
// EXHIBITOR DASHBOARD
// =====================================================

const API_BASE_URL =
    "http://localhost:3000/api";



// =====================================================
// ELEMENTS
// =====================================================

const loadingOverlay =
    document.getElementById("loadingOverlay");

const errorMessage =
    document.getElementById("errorMessage");

const eventName =
    document.getElementById("eventName");

const eventLocation =
    document.getElementById("eventLocation");

const connectionsCount =
    document.getElementById("connectionsCount");

const visitorInteractionsCount =
    document.getElementById(
        "visitorInteractionsCount"
    );

const exhibitorsScannedCount =
    document.getElementById(
        "exhibitorsScannedCount"
    );

const visitorUnlockedCount =
    document.getElementById(
        "visitorUnlockedCount"
    );

const visitorTotalCount =
    document.getElementById(
        "visitorTotalCount"
    );

const visitorEngagementPercentage =
    document.getElementById(
        "visitorEngagementPercentage"
    );

const visitorEngagementBar =
    document.getElementById(
        "visitorEngagementBar"
    );

const exhibitorUnlockedCount =
    document.getElementById(
        "exhibitorUnlockedCount"
    );

const exhibitorTotalCount =
    document.getElementById(
        "exhibitorTotalCount"
    );

const exhibitorEngagementPercentage =
    document.getElementById(
        "exhibitorEngagementPercentage"
    );

const exhibitorEngagementBar =
    document.getElementById(
        "exhibitorEngagementBar"
    );

const activityChart =
    document.getElementById(
        "activityChart"
    );

const designationList =
    document.getElementById(
        "designationList"
    );

const organizationList =
    document.getElementById(
        "organizationList"
    );

const recentConnections =
    document.getElementById(
        "recentConnections"
    );

const exhibitorConnections =
    document.getElementById(
        "exhibitorConnections"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );



// =====================================================
// CHECK LOGIN
// =====================================================

const loggedIn =
    localStorage.getItem(
        "vdeckExhibitorLoggedIn"
    );

const exhibitorData =
    localStorage.getItem(
        "vdeckExhibitor"
    );

if (
    loggedIn !== "true" ||
    !exhibitorData
) {

    window.location.href =
        "index.html";
}



// =====================================================
// PARSE EXHIBITOR
// =====================================================

let exhibitor;

try {

    exhibitor =
        JSON.parse(exhibitorData);

} catch (error) {

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
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        showLoading();

        const response =
            await fetch(
                `${API_BASE_URL}/exhibitors/${exhibitor.exi_id}/dashboard`
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Could not load dashboard."
            );
        }

        renderDashboard(data);

        hideLoading();

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        hideLoading();

        showError(
            error.message ||
            "Something went wrong while loading the dashboard."
        );
    }
}



// =====================================================
// RENDER DASHBOARD
// =====================================================

function renderDashboard(data) {

    renderEvent(
        data.event
    );

    renderPerformance(
        data
    );

    renderEngagement(
        data.stall_engagement
    );

    renderActivity(
        data.connection_activity || []
    );

    renderDesignations(
        data.visitor_designations || []
    );

    renderOrganizations(
        data.visitor_organizations || []
    );

    renderExhibitorsScanned(
        data.exhibitors_i_scanned || []
    );

    renderRecentVisitors(
        data.recent_visitors || []
    );
}



// =====================================================
// EVENT
// =====================================================

function renderEvent(event) {

    if (!event) {

        eventName.textContent =
            "Event information unavailable";

        eventLocation.textContent =
            "";

        return;
    }

    eventName.textContent =
        event.eve_name ||
        "Unknown Event";

    eventLocation.textContent =
        event.eve_location ||
        "Location unavailable";
}



// =====================================================
// PERFORMANCE
// =====================================================

function renderPerformance(data) {

    const stallEngagement =
        data.stall_engagement || {};

    const myNetworking =
        data.my_networking || {};

    const visitorData =
        stallEngagement.visitors || {};


    /*
        Connections means
        visitor interactions received
        by this exhibitor's stall.
    */

    connectionsCount.textContent =
        Number(
            visitorData.unlocked || 0
        );

    visitorInteractionsCount.textContent =
        Number(
            visitorData.unlocked || 0
        );

    exhibitorsScannedCount.textContent =
        Number(
            myNetworking.exhibitors_scanned || 0
        );
}



// =====================================================
// STALL ENGAGEMENT
// =====================================================

function renderEngagement(
    stallEngagement
) {

    if (!stallEngagement) {
        return;
    }

    const visitors =
        stallEngagement.visitors || {};

    const exhibitors =
        stallEngagement.exhibitors || {};



    // -----------------------------------------------
    // VISITORS
    // -----------------------------------------------

    const visitorUnlocked =
        Number(
            visitors.unlocked || 0
        );

    const visitorTotal =
        Number(
            visitors.total || 0
        );

    const visitorPercentage =
        Number(
            visitors.percentage || 0
        );

    visitorUnlockedCount.textContent =
        visitorUnlocked;

    visitorTotalCount.textContent =
        visitorTotal;

    visitorEngagementPercentage.textContent =
        `${formatPercentage(visitorPercentage)}%`;

    visitorEngagementBar.style.width =
        `${Math.min(
            Math.max(visitorPercentage, 0),
            100
        )}%`;



    // -----------------------------------------------
    // EXHIBITORS WHO DISCOVERED YOU
    // -----------------------------------------------

    const exhibitorUnlocked =
        Number(
            exhibitors.unlocked || 0
        );

    const exhibitorTotal =
        Number(
            exhibitors.total || 0
        );

    const exhibitorPercentage =
        Number(
            exhibitors.percentage || 0
        );

    exhibitorUnlockedCount.textContent =
        exhibitorUnlocked;

    exhibitorTotalCount.textContent =
        exhibitorTotal;

    exhibitorEngagementPercentage.textContent =
        `${formatPercentage(exhibitorPercentage)}%`;

    exhibitorEngagementBar.style.width =
        `${Math.min(
            Math.max(exhibitorPercentage, 0),
            100
        )}%`;
}



// =====================================================
// CONNECTION ACTIVITY
// =====================================================

function renderActivity(
    activity
) {

    if (!activity.length) {

        activityChart.innerHTML = `
            <div class="chart-empty">
                No connection activity yet.
            </div>
        `;

        return;
    }


    /*
        Backend returns:

        {
            date: "...",
            interactions: 8
        }
    */

    const maxInteractions =
        Math.max(
            ...activity.map(
                item =>
                    Number(
                        item.interactions || 0
                    )
            )
        );


    const graph =
        document.createElement(
            "div"
        );

    graph.className =
        "activity-graph";


    activity.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "activity-bar-wrapper";


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "activity-bar";


            const value =
                document.createElement(
                    "span"
                );

            value.className =
                "activity-value";

            value.textContent =
                Number(
                    item.interactions || 0
                );


            const date =
                document.createElement(
                    "span"
                );

            date.className =
                "activity-date";

            date.textContent =
                formatDate(
                    item.date
                );


            const percentage =
                maxInteractions > 0
                    ? (
                        Number(
                            item.interactions || 0
                        ) /
                        maxInteractions
                    ) * 100
                    : 0;


            bar.style.height =
                `${Math.max(
                    percentage,
                    5
                )}%`;


            wrapper.appendChild(
                value
            );

            wrapper.appendChild(
                bar
            );

            wrapper.appendChild(
                date
            );

            graph.appendChild(
                wrapper
            );
        }
    );


    activityChart.innerHTML =
        "";

    activityChart.appendChild(
        graph
    );
}



// =====================================================
// DESIGNATIONS
// =====================================================

function renderDesignations(
    items
) {

    if (!items.length) {

        designationList.innerHTML = `
            <div class="list-empty">
                No visitor data yet.
            </div>
        `;

        return;
    }


    const max =
        Math.max(
            ...items.map(
                item =>
                    Number(
                        item.visitors || 0
                    )
            )
        );


    designationList.innerHTML =
        items.map(
            item => {

                const count =
                    Number(
                        item.visitors || 0
                    );

                const percentage =
                    max > 0
                        ? (
                            count / max
                        ) * 100
                        : 0;


                return `
                    <div class="insight-row">

                        <div class="insight-row-top">

                            <span class="insight-name">
                                ${escapeHTML(
                                    item.designation ||
                                    "Not specified"
                                )}
                            </span>

                            <span class="insight-count">
                                ${count}
                            </span>

                        </div>


                        <div class="insight-progress">

                            <div
                                class="insight-progress-bar"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                    </div>
                `;
            }
        ).join("");
}



// =====================================================
// ORGANIZATIONS
// =====================================================

function renderOrganizations(
    items
) {

    if (!items.length) {

        organizationList.innerHTML = `
            <div class="list-empty">
                No visitor data yet.
            </div>
        `;

        return;
    }


    const max =
        Math.max(
            ...items.map(
                item =>
                    Number(
                        item.visitors || 0
                    )
            )
        );


    organizationList.innerHTML =
        items.map(
            item => {

                const count =
                    Number(
                        item.visitors || 0
                    );

                const percentage =
                    max > 0
                        ? (
                            count / max
                        ) * 100
                        : 0;


                return `
                    <div class="insight-row">

                        <div class="insight-row-top">

                            <span class="insight-name">
                                ${escapeHTML(
                                    item.organization ||
                                    "Not specified"
                                )}
                            </span>

                            <span class="insight-count">
                                ${count}
                            </span>

                        </div>


                        <div class="insight-progress">

                            <div
                                class="insight-progress-bar"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                    </div>
                `;
            }
        ).join("");
}



// =====================================================
// EXHIBITORS I SCANNED
// =====================================================

function renderExhibitorsScanned(
    items
) {

    if (!items.length) {

        exhibitorConnections.innerHTML = `
            <div class="loading-state">
                You have not scanned another exhibitor yet.
            </div>
        `;

        return;
    }


    exhibitorConnections.innerHTML =
        items.map(
            item => {

                const scannedExhibitor =
                    item.exhibitor || {};


                const name =
                    scannedExhibitor.exi_name ||
                    "Unknown exhibitor";


                const designation =
                    scannedExhibitor.exi_designation ||
                    "Designation unavailable";


                const organization =
                    scannedExhibitor.organization ||
                    "Organization unavailable";


                const code =
                    scannedExhibitor.exi_code ||
                    "";


                return `
                    <div class="connection-card">

                        <div class="connection-person">

                            <span class="connection-name">
                                ${escapeHTML(name)}
                            </span>

                            <span class="connection-details">
                                ${escapeHTML(designation)}
                                ·
                                ${escapeHTML(organization)}
                            </span>

                            <span class="connection-type">
                                EXHIBITOR NETWORK
                            </span>

                        </div>


                        <span class="connection-time">

                            ${escapeHTML(code)}

                            <br>

                            ${formatDateTime(
                                item.interacted_at
                            )}

                        </span>

                    </div>
                `;
            }
        ).join("");
}



// =====================================================
// RECENT VISITORS
// =====================================================

function renderRecentVisitors(
    items
) {

    if (!items.length) {

        recentConnections.innerHTML = `
            <div class="loading-state">
                No visitor connections yet.
            </div>
        `;

        return;
    }


    recentConnections.innerHTML =
        items.map(
            item => {

                const visitor =
                    item.visitor || {};


                const name =
                    visitor.vis_name ||
                    "Unknown visitor";


                const designation =
                    visitor.vis_designation ||
                    "Designation unavailable";


                const organization =
                    visitor.vis_orgn ||
                    "Organization unavailable";


                return `
                    <div class="connection-card">

                        <div class="connection-person">

                            <span class="connection-name">
                                ${escapeHTML(name)}
                            </span>

                            <span class="connection-details">
                                ${escapeHTML(designation)}
                                ·
                                ${escapeHTML(organization)}
                            </span>

                            <span class="connection-type">
                                VISITOR CONNECTION
                            </span>

                        </div>


                        <span class="connection-time">
                            ${formatDateTime(
                                item.interacted_at
                            )}
                        </span>

                    </div>
                `;
            }
        ).join("");
}



// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    );
}



// =====================================================
// DATE + TIME FORMAT
// =====================================================

function formatDateTime(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}



// =====================================================
// PERCENTAGE FORMAT
// =====================================================

function formatPercentage(
    value
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return "0";
    }

    return number
        .toFixed(2)
        .replace(
            /\.00$/,
            ""
        );
}



// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}



// =====================================================
// LOADING
// =====================================================

function showLoading() {

    loadingOverlay.classList.remove(
        "hidden"
    );
}


function hideLoading() {

    loadingOverlay.classList.add(
        "hidden"
    );
}



// =====================================================
// ERROR
// =====================================================

function showError(
    message
) {

    errorMessage.textContent =
        message;

    errorMessage.style.display =
        "block";


    setTimeout(
        () => {

            errorMessage.style.display =
                "none";

        },
        5000
    );
}



// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener(
    "click",
    () => {

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
// START
// =====================================================

loadDashboard();