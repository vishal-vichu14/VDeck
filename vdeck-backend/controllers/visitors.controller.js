const pool = require("../config/database");

// =====================================================
// REGISTER TEMPORARY VISITOR
// =====================================================

const registerVisitor = async (req, res) => {
    try {
        const {
            event_id,
            vis_name,
            vis_email,
            vis_orgn,
            vis_designation,
            vis_phonenumber
        } = req.body;

        // =================================================
        // VALIDATION
        // =================================================

        if (!event_id) {
            return res.status(400).json({
                success: false,
                message: "event_id is required."
            });
        }

        if (!vis_name || !String(vis_name).trim()) {
            return res.status(400).json({
                success: false,
                message: "vis_name is required."
            });
        }

        // =================================================
        // CHECK EVENT
        // =================================================

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

        // =================================================
        // CREATE TEMPORARY VISITOR
        // =================================================

        const result = await pool.query(
            `
            INSERT INTO visitors (
                vis_id,
                event_id,
                vis_email,
                vis_name,
                vis_orgn,
                vis_designation,
                vis_phonenumber
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING
                vis_id,
                event_id,
                vis_email,
                vis_name,
                vis_orgn,
                vis_designation,
                vis_phonenumber;
            `,
            [
                event_id,
                vis_email
                    ? String(vis_email).trim()
                    : null,
                String(vis_name).trim(),
                vis_orgn
                    ? String(vis_orgn).trim()
                    : null,
                vis_designation
                    ? String(vis_designation).trim()
                    : null,
                vis_phonenumber
                    ? String(vis_phonenumber).trim()
                    : null
            ]
        );

        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({
            success: true,
            message: "Temporary visitor registered successfully.",
            event: eventResult.rows[0],
            visitor: result.rows[0],
            permanent_user_created: false
        });

    } catch (error) {
        console.error(
            "Error registering visitor:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not register visitor."
        });
    }
};


// =====================================================
// GET TEMPORARY VISITOR BY ID
// =====================================================

const getVisitorById = async (req, res) => {
    try {
        const { vis_id } = req.params;

        // =================================================
        // VALIDATION
        // =================================================

        if (!vis_id) {
            return res.status(400).json({
                success: false,
                message: "vis_id is required."
            });
        }

        // =================================================
        // GET VISITOR
        // =================================================

        const result = await pool.query(
            `
            SELECT
                vis_id,
                event_id,
                vis_email,
                vis_name,
                vis_orgn,
                vis_designation,
                vis_phonenumber
            FROM visitors
            WHERE vis_id = $1;
            `,
            [vis_id]
        );

        // =================================================
        // VISITOR NOT FOUND
        // =================================================

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found."
            });
        }

        // =================================================
        // GET EVENT DETAILS
        // =================================================

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
            [result.rows[0].event_id]
        );

        // =================================================
        // RESPONSE
        // =================================================

        res.json({
            success: true,
            visitor: result.rows[0],
            event: eventResult.rows[0] || null
        });

    } catch (error) {
        console.error(
            "Error fetching visitor:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not fetch visitor."
        });
    }
};


// =====================================================
// GET ALL VISITORS BY EVENT
// =====================================================

const getVisitorsByEvent = async (req, res) => {
    try {
        const { event_id } = req.params;

        // =================================================
        // VALIDATION
        // =================================================

        if (!event_id) {
            return res.status(400).json({
                success: false,
                message: "event_id is required."
            });
        }

        // =================================================
        // CHECK EVENT
        // =================================================

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

        // =================================================
        // GET VISITORS
        // =================================================

        const result = await pool.query(
            `
            SELECT
                vis_id,
                event_id,
                vis_email,
                vis_name,
                vis_orgn,
                vis_designation,
                vis_phonenumber
            FROM visitors
            WHERE event_id = $1
            ORDER BY vis_name ASC;
            `,
            [event_id]
        );

        // =================================================
        // RESPONSE
        // =================================================

        res.json({
            success: true,
            event: eventResult.rows[0],
            visitor_count: result.rows.length,
            visitors: result.rows
        });

    } catch (error) {
        console.error(
            "Error fetching visitors by event:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not fetch visitors."
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    registerVisitor,
    getVisitorById,
    getVisitorsByEvent
};