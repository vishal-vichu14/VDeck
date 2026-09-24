const pool = require("../config/database");


// ========================================
// GET ALL EVENTS
// ========================================

const getAllEvents = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                eve_id,
                eve_name,
                orgn_id,
                eve_location,
                eve_start,
                eve_end
            FROM events
            ORDER BY eve_start DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            events: result.rows
        });

    } catch (error) {

        console.error("Error fetching events:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch events."
        });

    }

};


// ========================================
// GET EVENT BY ID
// ========================================

const getEventById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                eve_id,
                eve_name,
                orgn_id,
                eve_location,
                eve_start,
                eve_end
            FROM events
            WHERE eve_id = $1;
        `, [id]);

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Event not found."
            });

        }

        res.json({
            success: true,
            event: result.rows[0]
        });

    } catch (error) {

        console.error("Error fetching event:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch event."
        });

    }

};


// ========================================
// CREATE EVENT
// ========================================

const createEvent = async (req, res) => {

    try {

        const {
            eve_name,
            orgn_id,
            eve_location,
            eve_start,
            eve_end
        } = req.body;


        // -------------------------------
        // BASIC VALIDATION
        // -------------------------------

        if (!eve_name || !orgn_id || !eve_start || !eve_end) {

            return res.status(400).json({
                success: false,
                message: "eve_name, orgn_id, eve_start and eve_end are required."
            });

        }


        // -------------------------------
        // CHECK ORGANIZATION EXISTS
        // -------------------------------

        const organization = await pool.query(
            `
            SELECT orgn_id
            FROM organizations
            WHERE orgn_id = $1;
            `,
            [orgn_id]
        );


        if (organization.rows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Organization not found."
            });

        }


        // -------------------------------
        // CREATE EVENT
        // -------------------------------

        const result = await pool.query(
            `
            INSERT INTO events (
                eve_id,
                eve_name,
                orgn_id,
                eve_location,
                eve_start,
                eve_end
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING
                eve_id,
                eve_name,
                orgn_id,
                eve_location,
                eve_start,
                eve_end;
            `,
            [
                eve_name,
                orgn_id,
                eve_location || null,
                eve_start,
                eve_end
            ]
        );


        // -------------------------------
        // SEND CREATED EVENT
        // -------------------------------

        res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event: result.rows[0]
        });

    } catch (error) {

        console.error("Error creating event:", error);

        res.status(500).json({
            success: false,
            message: "Could not create event."
        });

    }

};


// ========================================
// EXPORT FUNCTIONS
// ========================================

module.exports = {
    getAllEvents,
    getEventById,
    createEvent
};