const pool = require("../config/database");


// ======================================================
// CREATE INTERACTION / CONNECTION
// ======================================================
//
// Supported:
//
// 1. Visitor → Exhibitor
//
// {
//     event_id,
//     vis_id,
//     exi_id
// }
//
// 2. Exhibitor → Exhibitor
//
// {
//     event_id,
//     actor_exi_id,
//     exi_id
// }
//
// exi_id = target exhibitor
//
// ======================================================

const createConnection = async (req, res) => {

    const {
        event_id,
        vis_id,
        exi_id,
        actor_exi_id
    } = req.body;

    try {

        // --------------------------------------------------
        // 1. Validate event
        // --------------------------------------------------

        if (!event_id) {
            return res.status(400).json({
                success: false,
                message: "event_id is required"
            });
        }


        // --------------------------------------------------
        // 2. Determine actor type
        // --------------------------------------------------

        const visitorActor = Boolean(vis_id);
        const exhibitorActor = Boolean(actor_exi_id);

        if (!visitorActor && !exhibitorActor) {
            return res.status(400).json({
                success: false,
                message: "Either vis_id or actor_exi_id is required"
            });
        }

        if (visitorActor && exhibitorActor) {
            return res.status(400).json({
                success: false,
                message: "Provide either vis_id or actor_exi_id, not both"
            });
        }


        // --------------------------------------------------
        // 3. Target exhibitor is required
        // --------------------------------------------------

        if (!exi_id) {
            return res.status(400).json({
                success: false,
                message: "Target exhibitor exi_id is required"
            });
        }


        // --------------------------------------------------
        // 4. Check event exists
        // --------------------------------------------------

        const eventResult = await pool.query(
            `
            SELECT *
            FROM events
            WHERE eve_id = $1
            `,
            [event_id]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const event = eventResult.rows[0];


        // --------------------------------------------------
        // 5. Check target exhibitor exists
        // --------------------------------------------------

        const targetExhibitorResult = await pool.query(
            `
            SELECT *
            FROM exhibitors
            WHERE exi_id = $1
            `,
            [exi_id]
        );

        if (targetExhibitorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Target exhibitor not found"
            });
        }

        const targetExhibitor = targetExhibitorResult.rows[0];


        // --------------------------------------------------
        // 6. Check target exhibitor belongs to this event
        // --------------------------------------------------

        if (targetExhibitor.event_id !== event_id) {
            return res.status(400).json({
                success: false,
                message: "Target exhibitor does not belong to this event"
            });
        }


        // ==================================================
        // VISITOR → EXHIBITOR
        // ==================================================

        if (visitorActor) {

            // ----------------------------------------------
            // 7A. Check visitor exists
            // ----------------------------------------------

            const visitorResult = await pool.query(
                `
                SELECT *
                FROM visitors
                WHERE vis_id = $1
                `,
                [vis_id]
            );

            if (visitorResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Visitor not found"
                });
            }

            const visitor = visitorResult.rows[0];


            // ----------------------------------------------
            // 8A. Check visitor belongs to event
            // ----------------------------------------------

            if (visitor.event_id !== event_id) {
                return res.status(400).json({
                    success: false,
                    message: "Visitor does not belong to this event"
                });
            }


            // ----------------------------------------------
            // 9A. Check duplicate interaction
            // ----------------------------------------------

            const existingInteraction = await pool.query(
                `
                SELECT *
                FROM expo_interactions
                WHERE event_id = $1
                  AND visitor_actor_id = $2
                  AND target_exhibitor_id = $3
                `,
                [
                    event_id,
                    vis_id,
                    exi_id
                ]
            );

            if (existingInteraction.rows.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "Connection already exists",
                    interaction: existingInteraction.rows[0]
                });
            }


            // ----------------------------------------------
            // 10A. Create visitor interaction
            // ----------------------------------------------

            const interactionResult = await pool.query(
                `
                INSERT INTO expo_interactions (
                    event_id,
                    visitor_actor_id,
                    target_exhibitor_id
                )
                VALUES ($1, $2, $3)
                RETURNING *
                `,
                [
                    event_id,
                    vis_id,
                    exi_id
                ]
            );

            const interaction = interactionResult.rows[0];


            // ----------------------------------------------
            // 11A. Return visitor interaction
            // ----------------------------------------------

            return res.status(201).json({

                success: true,

                message: "Connection created successfully",

                interaction: interaction,

                // Backward-compatible connection object
                connection: {
                    connection_id: interaction.interaction_id,
                    event_id: interaction.event_id,
                    vis_id: interaction.visitor_actor_id,
                    exi_id: interaction.target_exhibitor_id,
                    connected_at: interaction.interacted_at
                },

                actor_type: "VISITOR",

                visitor: {
                    vis_id: visitor.vis_id,
                    vis_name: visitor.vis_name,
                    vis_email: visitor.vis_email,
                    vis_orgn: visitor.vis_orgn,
                    vis_designation: visitor.vis_designation,
                    vis_phonenumber: visitor.vis_phonenumber
                },

                exhibitor: {
                    exi_id: targetExhibitor.exi_id,
                    exi_name: targetExhibitor.exi_name,
                    exi_designation: targetExhibitor.exi_designation,
                    organization: targetExhibitor.organization,
                    exi_code: targetExhibitor.exi_code
                },

                event: {
                    eve_id: event.eve_id,
                    eve_name: event.eve_name,
                    eve_location: event.eve_location
                }
            });
        }


        // ==================================================
        // EXHIBITOR → EXHIBITOR
        // ==================================================

        if (exhibitorActor) {

            // ----------------------------------------------
            // 7B. Check actor exhibitor exists
            // ----------------------------------------------

            const actorExhibitorResult = await pool.query(
                `
                SELECT *
                FROM exhibitors
                WHERE exi_id = $1
                `,
                [actor_exi_id]
            );

            if (actorExhibitorResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Actor exhibitor not found"
                });
            }

            const actorExhibitor = actorExhibitorResult.rows[0];


            // ----------------------------------------------
            // 8B. Check actor belongs to event
            // ----------------------------------------------

            if (actorExhibitor.event_id !== event_id) {
                return res.status(400).json({
                    success: false,
                    message: "Actor exhibitor does not belong to this event"
                });
            }


            // ----------------------------------------------
            // 9B. Prevent self-scan
            // ----------------------------------------------

            if (actor_exi_id === exi_id) {
                return res.status(400).json({
                    success: false,
                    message: "An exhibitor cannot scan their own stall"
                });
            }


            // ----------------------------------------------
            // 10B. Check duplicate interaction
            // ----------------------------------------------

            const existingInteraction = await pool.query(
                `
                SELECT *
                FROM expo_interactions
                WHERE event_id = $1
                  AND exhibitor_actor_id = $2
                  AND target_exhibitor_id = $3
                `,
                [
                    event_id,
                    actor_exi_id,
                    exi_id
                ]
            );

            if (existingInteraction.rows.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "Connection already exists",
                    interaction: existingInteraction.rows[0]
                });
            }


            // ----------------------------------------------
            // 11B. Create exhibitor interaction
            // ----------------------------------------------

            const interactionResult = await pool.query(
                `
                INSERT INTO expo_interactions (
                    event_id,
                    exhibitor_actor_id,
                    target_exhibitor_id
                )
                VALUES ($1, $2, $3)
                RETURNING *
                `,
                [
                    event_id,
                    actor_exi_id,
                    exi_id
                ]
            );

            const interaction = interactionResult.rows[0];


            // ----------------------------------------------
            // 12B. Return exhibitor interaction
            // ----------------------------------------------

            return res.status(201).json({

                success: true,

                message: "Exhibitor connection created successfully",

                interaction: interaction,

                // Backward-compatible connection object
                connection: {
                    connection_id: interaction.interaction_id,
                    event_id: interaction.event_id,
                    vis_id: null,
                    exi_id: interaction.target_exhibitor_id,
                    connected_at: interaction.interacted_at
                },

                actor_type: "EXHIBITOR",

                actor_exhibitor: {
                    exi_id: actorExhibitor.exi_id,
                    exi_name: actorExhibitor.exi_name,
                    exi_designation: actorExhibitor.exi_designation,
                    organization: actorExhibitor.organization,
                    exi_code: actorExhibitor.exi_code
                },

                target_exhibitor: {
                    exi_id: targetExhibitor.exi_id,
                    exi_name: targetExhibitor.exi_name,
                    exi_designation: targetExhibitor.exi_designation,
                    organization: targetExhibitor.organization,
                    exi_code: targetExhibitor.exi_code
                },

                event: {
                    eve_id: event.eve_id,
                    eve_name: event.eve_name,
                    eve_location: event.eve_location
                }
            });
        }

    } catch (error) {

        console.error("Create interaction error:", error);

        // ----------------------------------------------
        // Handle database duplicate protection
        // ----------------------------------------------

        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                message: "Connection already exists"
            });
        }


        return res.status(500).json({
            success: false,
            message: "Failed to create connection",
            error: error.message
        });
    }
};


// ======================================================
// GET VISITOR CONNECTIONS
// ======================================================
//
// Shows exhibitors that this visitor scanned.
//
// expo_interactions:
// visitor_actor_id = visitor
//
// ======================================================

const getVisitorConnections = async (req, res) => {

    const { vis_id } = req.params;

    try {

        // --------------------------------------------------
        // 1. Validate visitor ID
        // --------------------------------------------------

        if (!vis_id) {
            return res.status(400).json({
                success: false,
                message: "Visitor ID is required"
            });
        }


        // --------------------------------------------------
        // 2. Check visitor exists
        // --------------------------------------------------

        const visitorResult = await pool.query(
            `
            SELECT *
            FROM visitors
            WHERE vis_id = $1
            `,
            [vis_id]
        );

        if (visitorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found"
            });
        }


        const visitor = visitorResult.rows[0];


        // --------------------------------------------------
        // 3. Get visitor interactions
        // --------------------------------------------------

        const connectionsResult = await pool.query(
            `
            SELECT
                i.interaction_id AS connection_id,
                i.interaction_id,
                i.event_id,
                i.interacted_at AS connected_at,

                e.eve_name,
                e.eve_location,

                ex.exi_id,
                ex.exi_name,
                ex.exi_designation,
                ex.exi_phonenumber,
                ex.exi_email,
                ex.exi_location,
                ex.exi_description,
                ex.organization,
                ex.exi_code

            FROM expo_interactions i

            JOIN events e
                ON i.event_id = e.eve_id

            JOIN exhibitors ex
                ON i.target_exhibitor_id = ex.exi_id

            WHERE i.visitor_actor_id = $1

            ORDER BY i.interacted_at DESC
            `,
            [vis_id]
        );


        // --------------------------------------------------
        // 4. Return visitor connections
        // --------------------------------------------------

        return res.status(200).json({

            success: true,

            visitor: {
                vis_id: visitor.vis_id,
                vis_name: visitor.vis_name,
                vis_email: visitor.vis_email,
                vis_orgn: visitor.vis_orgn,
                vis_designation: visitor.vis_designation,
                vis_phonenumber: visitor.vis_phonenumber
            },

            connection_count: connectionsResult.rows.length,

            connections: connectionsResult.rows
        });

    } catch (error) {

        console.error(
            "Get visitor connections error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve visitor connections",
            error: error.message
        });
    }
};


// ======================================================
// GET EXHIBITOR LEADS / CONNECTIONS
// ======================================================
//
// For an exhibitor:
//
// 1. Visitors who scanned this exhibitor
// 2. Exhibitors who scanned this exhibitor
//
// The old "leads" response is preserved for visitors.
//
// ======================================================

const getExhibitorLeads = async (req, res) => {

    const { exi_id } = req.params;

    try {

        // --------------------------------------------------
        // 1. Validate exhibitor ID
        // --------------------------------------------------

        if (!exi_id) {
            return res.status(400).json({
                success: false,
                message: "Exhibitor ID is required"
            });
        }


        // --------------------------------------------------
        // 2. Check exhibitor exists
        // --------------------------------------------------

        const exhibitorResult = await pool.query(
            `
            SELECT *
            FROM exhibitors
            WHERE exi_id = $1
            `,
            [exi_id]
        );

        if (exhibitorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Exhibitor not found"
            });
        }


        const exhibitor = exhibitorResult.rows[0];


        // ==================================================
        // 3. VISITORS WHO SCANNED THIS EXHIBITOR
        // ==================================================

        const visitorLeadsResult = await pool.query(
            `
            SELECT
                i.interaction_id AS connection_id,
                i.interaction_id,
                i.event_id,
                i.interacted_at AS connected_at,

                e.eve_name,
                e.eve_location,

                v.vis_id,
                v.vis_name,
                v.vis_email,
                v.vis_orgn,
                v.vis_designation,
                v.vis_phonenumber

            FROM expo_interactions i

            JOIN events e
                ON i.event_id = e.eve_id

            JOIN visitors v
                ON i.visitor_actor_id = v.vis_id

            WHERE i.target_exhibitor_id = $1
              AND i.visitor_actor_id IS NOT NULL

            ORDER BY i.interacted_at DESC
            `,
            [exi_id]
        );


        // ==================================================
        // 4. EXHIBITORS WHO SCANNED THIS EXHIBITOR
        // ==================================================

        const exhibitorConnectionsResult = await pool.query(
            `
            SELECT
                i.interaction_id AS connection_id,
                i.interaction_id,
                i.event_id,
                i.interacted_at AS connected_at,

                e.eve_name,
                e.eve_location,

                actor.exi_id,
                actor.exi_name,
                actor.exi_designation,
                actor.exi_phonenumber,
                actor.exi_email,
                actor.exi_location,
                actor.exi_description,
                actor.organization,
                actor.exi_code

            FROM expo_interactions i

            JOIN events e
                ON i.event_id = e.eve_id

            JOIN exhibitors actor
                ON i.exhibitor_actor_id = actor.exi_id

            WHERE i.target_exhibitor_id = $1
              AND i.exhibitor_actor_id IS NOT NULL

            ORDER BY i.interacted_at DESC
            `,
            [exi_id]
        );


        // ==================================================
        // 5. Return
        // ==================================================

        return res.status(200).json({

            success: true,

            exhibitor: {
                exi_id: exhibitor.exi_id,
                exi_name: exhibitor.exi_name,
                organization: exhibitor.organization,
                exi_code: exhibitor.exi_code
            },

            // ----------------------------------------------
            // Existing frontend-compatible data
            // ----------------------------------------------

            lead_count: visitorLeadsResult.rows.length,

            leads: visitorLeadsResult.rows,

            // ----------------------------------------------
            // New exhibitor-to-exhibitor data
            // ----------------------------------------------

            exhibitor_connection_count:
                exhibitorConnectionsResult.rows.length,

            exhibitor_connections:
                exhibitorConnectionsResult.rows,

            // ----------------------------------------------
            // Combined count
            // ----------------------------------------------

            total_connections:
                visitorLeadsResult.rows.length +
                exhibitorConnectionsResult.rows.length

        });

    } catch (error) {

        console.error(
            "Get exhibitor connections error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve exhibitor connections",
            error: error.message
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    createConnection,
    getVisitorConnections,
    getExhibitorLeads
};