const pool = require("../config/database");


// ========================================
// GET ALL ORGANIZATIONS
// ========================================

const getAllOrganizations = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                orgn_id,
                org_name,
                orgn_location,
                org_verified
            FROM organizations
            ORDER BY org_name ASC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            organizations: result.rows
        });

    } catch (error) {

        console.error("Error fetching organizations:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch organizations."
        });

    }

};


// ========================================
// GET ORGANIZATION BY ID
// ========================================

const getOrganizationById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                orgn_id,
                org_name,
                orgn_location,
                org_verified
            FROM organizations
            WHERE orgn_id = $1;
        `, [id]);

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Organization not found."
            });

        }

        res.json({
            success: true,
            organization: result.rows[0]
        });

    } catch (error) {

        console.error("Error fetching organization:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch organization."
        });

    }

};


// ========================================
// CREATE ORGANIZATION
// ========================================

const createOrganization = async (req, res) => {

    try {

        const {
            org_name,
            orgn_location
        } = req.body;


        // -------------------------------
        // BASIC VALIDATION
        // -------------------------------

        if (!org_name) {

            return res.status(400).json({
                success: false,
                message: "org_name is required."
            });

        }


        // -------------------------------
        // CREATE ORGANIZATION
        // -------------------------------

        const result = await pool.query(
            `
            INSERT INTO organizations (
                orgn_id,
                org_name,
                orgn_location,
                org_verified
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                false
            )
            RETURNING
                orgn_id,
                org_name,
                orgn_location,
                org_verified;
            `,
            [
                org_name,
                orgn_location || null
            ]
        );


        // -------------------------------
        // SEND CREATED ORGANIZATION
        // -------------------------------

        res.status(201).json({
            success: true,
            message: "Organization created successfully.",
            organization: result.rows[0]
        });

    } catch (error) {

        console.error("Error creating organization:", error);

        res.status(500).json({
            success: false,
            message: "Could not create organization."
        });

    }

};


// ========================================
// VERIFY ORGANIZATION
// ========================================

const verifyOrganization = async (req, res) => {

    try {

        const { orgn_id } = req.params;


        // -------------------------------
        // BASIC VALIDATION
        // -------------------------------

        if (!orgn_id) {

            return res.status(400).json({
                success: false,
                message: "Organization ID is required."
            });

        }


        // -------------------------------
        // VERIFY ORGANIZATION
        // -------------------------------

        const result = await pool.query(
            `
            UPDATE organizations
            SET org_verified = TRUE
            WHERE orgn_id = $1
            RETURNING
                orgn_id,
                org_name,
                orgn_location,
                org_verified;
            `,
            [orgn_id]
        );


        // -------------------------------
        // ORGANIZATION NOT FOUND
        // -------------------------------

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Organization not found."
            });

        }


        // -------------------------------
        // SUCCESS
        // -------------------------------

        res.status(200).json({
            success: true,
            message: "Organization verified successfully.",
            organization: result.rows[0]
        });

    } catch (error) {

        console.error("Error verifying organization:", error);

        res.status(500).json({
            success: false,
            message: "Could not verify organization."
        });

    }

};


// ========================================
// EXPORT FUNCTIONS
// ========================================

module.exports = {

    createOrganization,
    getAllOrganizations,
    getOrganizationById,
    verifyOrganization

};