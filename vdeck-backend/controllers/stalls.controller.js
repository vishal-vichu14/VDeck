const pool = require("../config/database");

/*
=========================================
GET ALL STALLS FOR AN EVENT
=========================================

A physical stall can contain multiple exhibitors.

Example:

A100
  ├── ABC Motors
  │    ├── Ravi Kumar
  │    ├── Priya Kumar
  │    └── Arun Kumar
  │
A101
  └── XYZ Components
       ├── Karthik Raj
       └── Suresh Kumar

One stall is therefore counted only once.
*/

const getStallsByEvent = async (req, res) => {
    const { event_id } = req.params;

    try {
        /*
        First verify that the event exists.
        */

        const eventResult = await pool.query(
            `
            SELECT
                eve_id,
                eve_name,
                eve_location,
                eve_start,
                eve_end
            FROM events
            WHERE eve_id = $1;
            `,
            [event_id]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        /*
        Get all physical stalls.

        Important:
        COUNT(*) is NOT used for total stalls.

        We GROUP BY exi_stall so that:

        A100 - 3 exhibitors
        A101 - 5 exhibitors

        becomes:

        2 physical stalls
        */

        const result = await pool.query(
            `
            SELECT
                TRIM(exi_stall) AS stall_number,
                MIN(organization) AS organization,
                COUNT(*) AS exhibitor_count
            FROM exhibitors
            WHERE event_id = $1
              AND exi_stall IS NOT NULL
              AND TRIM(exi_stall) <> ''
            GROUP BY TRIM(exi_stall)
            ORDER BY TRIM(exi_stall) ASC;
            `,
            [event_id]
        );

        /*
        Get exhibitors belonging to each stall.
        */

        const exhibitorsResult = await pool.query(
            `
            SELECT
                exi_id,
                exi_stall,
                organization,
                exi_name,
                exi_designation,
                exi_location,
                exi_photo
            FROM exhibitors
            WHERE event_id = $1
              AND exi_stall IS NOT NULL
              AND TRIM(exi_stall) <> ''
            ORDER BY
                TRIM(exi_stall) ASC,
                exi_name ASC;
            `,
            [event_id]
        );

        /*
        Build the final stall structure.
        */

        const stalls = result.rows.map((stall) => {

            const stallExhibitors =
                exhibitorsResult.rows.filter(
                    (exhibitor) =>
                        exhibitor.exi_stall &&
                        exhibitor.exi_stall.trim().toUpperCase() ===
                        stall.stall_number.trim().toUpperCase()
                );

            return {
                stall_number: stall.stall_number,
                organization: stall.organization,
                exhibitor_count: Number(stall.exhibitor_count),
                exhibitors: stallExhibitors
            };
        });

        res.json({
            success: true,
            event: eventResult.rows[0],
            total_stalls: stalls.length,
            stalls: stalls
        });

    } catch (error) {

        console.error("Error fetching event stalls:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch event stalls."
        });
    }
};


/*
=========================================
GET STALLS UNLOCKED BY A VISITOR
=========================================

A visitor can scan any exhibitor belonging
to a physical stall.

The stall is considered unlocked if the
visitor has interacted with at least one
exhibitor from that stall.

Example:

Visitor scans Ravi from A100.

Result:

A100 = unlocked

If the visitor later scans Priya from A100,
A100 remains one unlocked stall.

This prevents:

Ravi -> A100
Priya -> A100

from being counted as two stalls.
*/

const getVisitorStalls = async (req, res) => {
    const { vis_id } = req.params;

    try {

        /*
        Verify visitor exists.
        */

        const visitorResult = await pool.query(
            `
            SELECT
                vis_id,
                event_id
            FROM visitors
            WHERE vis_id = $1;
            `,
            [vis_id]
        );

        if (visitorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found."
            });
        }

        const eventId = visitorResult.rows[0].event_id;

        /*
        Get every physical stall in the event.
        */

        const stallsResult = await pool.query(
            `
            SELECT
                TRIM(exi_stall) AS stall_number,
                MIN(organization) AS organization,
                COUNT(*) AS exhibitor_count
            FROM exhibitors
            WHERE event_id = $1
              AND exi_stall IS NOT NULL
              AND TRIM(exi_stall) <> ''
            GROUP BY TRIM(exi_stall)
            ORDER BY TRIM(exi_stall) ASC;
            `,
            [eventId]
        );

        /*
        Find stalls this visitor has unlocked.

        We intentionally use the exhibitor's
        exi_stall instead of counting exhibitors.
        */

        const unlockedResult = await pool.query(
            `
            SELECT DISTINCT
                UPPER(TRIM(e.exi_stall)) AS stall_number
            FROM expo_interactions i
            JOIN exhibitors e
                ON i.target_exhibitor_id = e.exi_id
            WHERE i.event_id = $1
              AND i.visitor_actor_id = $2
              AND e.exi_stall IS NOT NULL
              AND TRIM(e.exi_stall) <> '';
            `,
            [eventId, vis_id]
        );

        const unlockedStalls = new Set(
            unlockedResult.rows.map(
                (row) => row.stall_number
            )
        );

        const stalls = stallsResult.rows.map((stall) => {

            const stallNumber =
                stall.stall_number.trim();

            return {
                stall_number: stallNumber,
                organization: stall.organization,
                exhibitor_count:
                    Number(stall.exhibitor_count),
                unlocked:
                    unlockedStalls.has(
                        stallNumber.toUpperCase()
                    )
            };
        });

        const unlockedCount =
            stalls.filter(
                (stall) => stall.unlocked
            ).length;

        res.json({
            success: true,
            event_id: eventId,
            visitor_id: vis_id,
            total_stalls: stalls.length,
            unlocked_stalls: unlockedCount,
            locked_stalls:
                stalls.length - unlockedCount,
            stalls: stalls
        });

    } catch (error) {

        console.error(
            "Error fetching visitor stalls:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not fetch visitor stalls."
        });
    }
};


/*
=========================================
GET STALLS DISCOVERED BY AN EXHIBITOR
=========================================

This is for the exhibitor side.

If an exhibitor scans another exhibitor,
the physical stall belonging to that
target exhibitor becomes discovered.

Again, multiple exhibitors at the same
stall count as ONE physical stall.
*/

const getExhibitorStalls = async (req, res) => {
    const { exi_id } = req.params;

    try {

        /*
        Find the exhibitor and event.
        */

        const exhibitorResult = await pool.query(
            `
            SELECT
                exi_id,
                event_id
            FROM exhibitors
            WHERE exi_id = $1;
            `,
            [exi_id]
        );

        if (exhibitorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Exhibitor not found."
            });
        }

        const eventId =
            exhibitorResult.rows[0].event_id;

        /*
        Get all physical stalls in the event.
        */

        const stallsResult = await pool.query(
            `
            SELECT
                TRIM(exi_stall) AS stall_number,
                MIN(organization) AS organization,
                COUNT(*) AS exhibitor_count
            FROM exhibitors
            WHERE event_id = $1
              AND exi_stall IS NOT NULL
              AND TRIM(exi_stall) <> ''
            GROUP BY TRIM(exi_stall)
            ORDER BY TRIM(exi_stall) ASC;
            `,
            [eventId]
        );

        /*
        Find physical stalls discovered by
        this exhibitor.
        */

        const unlockedResult = await pool.query(
            `
            SELECT DISTINCT
                UPPER(TRIM(e.exi_stall)) AS stall_number
            FROM expo_interactions i
            JOIN exhibitors e
                ON i.target_exhibitor_id = e.exi_id
            WHERE i.event_id = $1
              AND i.exhibitor_actor_id = $2
              AND e.exi_stall IS NOT NULL
              AND TRIM(e.exi_stall) <> '';
            `,
            [eventId, exi_id]
        );

        const unlockedStalls = new Set(
            unlockedResult.rows.map(
                (row) => row.stall_number
            )
        );

        const stalls = stallsResult.rows.map((stall) => {

            const stallNumber =
                stall.stall_number.trim();

            return {
                stall_number: stallNumber,
                organization: stall.organization,
                exhibitor_count:
                    Number(stall.exhibitor_count),
                unlocked:
                    unlockedStalls.has(
                        stallNumber.toUpperCase()
                    )
            };
        });

        const unlockedCount =
            stalls.filter(
                (stall) => stall.unlocked
            ).length;

        res.json({
            success: true,
            event_id: eventId,
            exhibitor_id: exi_id,
            total_stalls: stalls.length,
            unlocked_stalls: unlockedCount,
            locked_stalls:
                stalls.length - unlockedCount,
            stalls: stalls
        });

    } catch (error) {

        console.error(
            "Error fetching exhibitor stalls:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not fetch exhibitor stalls."
        });
    }
};


module.exports = {
    getStallsByEvent,
    getVisitorStalls,
    getExhibitorStalls
};