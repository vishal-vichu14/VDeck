const pool = require("../config/database");

const XLSX = require("xlsx");

const crypto = require("crypto");

// =====================================================
// GENERATE EXHIBITOR CODE
// Example: VDX-K4N95J
// =====================================================

const generateExhibitorCode = () => {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "VDX-";

    for (let i = 0; i < 6; i++) {

        const randomIndex = crypto.randomInt(
            0,
            characters.length
        );

        code += characters[randomIndex];
    }

    return code;
};

// =====================================================
// IMPORT EXHIBITORS FROM EXCEL / CSV
// =====================================================

const importExhibitors = async (req, res) => {

    let client;

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message:
                    "Please upload an Excel or CSV file."
            });

        }

        const { event_id } = req.body;

        if (!event_id) {

            return res.status(400).json({
                success: false,
                message:
                    "event_id is required."
            });
        }

        // =================================================
        // CHECK EVENT
        // =================================================

        const eventResult = await pool.query(
            `
            SELECT
                eve_id,
                eve_name
            FROM events
            WHERE eve_id = $1;
            `,
            [event_id]
        );

        if (eventResult.rows.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Event not found."
            });
        }

        // =================================================
        // READ EXCEL / CSV
        // =================================================

        const workbook = XLSX.read(
            req.file.buffer,
            {
                type: "buffer"
            }
        );

        const sheetName =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[sheetName];

        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: ""
                }
            );

        if (rows.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "The uploaded file is empty."
            });
        }

        // =================================================
        // REQUIRED COLUMNS
        // =================================================

        const requiredColumns = [
            "organization",
            "exi_name",
            "exi_stall_number"
        ];

        const fileColumns =
            Object.keys(rows[0]);

        for (const column of requiredColumns) {

            if (!fileColumns.includes(column)) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Missing required column: ${column}`
                });
            }
        }

        // =================================================
        // VALIDATE ROWS
        // =================================================

        const errors = [];

        rows.forEach((row, index) => {

            const excelRowNumber =
                index + 2;

            // ---------------------------------------------
            // ORGANIZATION
            // ---------------------------------------------

            if (
                !String(
                    row.organization
                ).trim()
            ) {

                errors.push({
                    row: excelRowNumber,
                    field: "organization",
                    message:
                        "Organization is required."
                });
            }

            // ---------------------------------------------
            // EXHIBITOR NAME
            // ---------------------------------------------

            if (
                !String(
                    row.exi_name
                ).trim()
            ) {

                errors.push({
                    row: excelRowNumber,
                    field: "exi_name",
                    message:
                        "Exhibitor name is required."
                });
            }

            // ---------------------------------------------
            // STALL NUMBER
            // ---------------------------------------------

            if (
                !String(
                    row.exi_stall_number
                ).trim()
            ) {

                errors.push({
                    row: excelRowNumber,
                    field: "exi_stall_number",
                    message:
                        "Stall number is required."
                });
            }
        });

        // =================================================
        // VALIDATE STALL ORGANIZATION CONSISTENCY
        //
        // One physical stall can contain multiple
        // exhibitors, but they must belong to the
        // same organization.
        // =================================================

        const stallOrganizations = {};

        rows.forEach((row, index) => {

            const excelRowNumber =
                index + 2;

            const organization =
                String(
                    row.organization
                ).trim();

            const stallNumber =
                String(
                    row.exi_stall_number
                ).trim();

            // Skip incomplete rows because
            // those errors are already handled above.
            if (
                !organization ||
                !stallNumber
            ) {
                return;
            }

            // Normalize stall number and organization
            // only for validation purposes.
            const stallKey =
                stallNumber.toUpperCase();

            const organizationKey =
                organization.toLowerCase();

            if (
                !stallOrganizations[stallKey]
            ) {

                stallOrganizations[stallKey] = {
                    organization,
                    organizationKey,
                    firstRow:
                        excelRowNumber
                };

                return;
            }

            if (
                stallOrganizations[stallKey]
                    .organizationKey !==
                organizationKey
            ) {

                errors.push({
                    row: excelRowNumber,
                    field: "exi_stall_number",
                    message:
                        `Stall ${stallNumber} is already assigned to organization "${stallOrganizations[stallKey].organization}" in Excel row ${stallOrganizations[stallKey].firstRow}. The same stall cannot contain exhibitors from different organizations.`
                });
            }
        });

        if (errors.length > 0) {

            return res.status(400).json({
                success: false,
                message:
                    "File validation failed.",
                errors: errors
            });
        }

        // =================================================
        // START TRANSACTION
        // =================================================

        client = await pool.connect();

        await client.query("BEGIN");

        const importedExhibitors = [];

        // =================================================
        // INSERT EXHIBITORS
        // =================================================

        for (const row of rows) {

            let exiCode;

            // ---------------------------------------------
            // GENERATE UNIQUE EXHIBITOR CODE
            // ---------------------------------------------

            while (true) {

                exiCode =
                    generateExhibitorCode();

                const existingCode =
                    await client.query(
                        `
                        SELECT exi_id
                        FROM exhibitors
                        WHERE exi_code = $1;
                        `,
                        [exiCode]
                    );

                if (
                    existingCode.rows.length === 0
                ) {

                    break;
                }
            }

            // ---------------------------------------------
            // GENERATE EXHIBITOR ID
            // ---------------------------------------------

            const exiId =
                crypto.randomUUID();

            // ---------------------------------------------
            // INSERT
            // ---------------------------------------------

            const result =
                await client.query(
                    `
                    INSERT INTO exhibitors (
                        exi_id,
                        event_id,
                        exi_code,
                        organization,
                        exi_name,
                        exi_designation,
                        exi_phonenumber,
                        exi_email,
                        exi_location,
                        exi_description,
                        exi_stall
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        $11
                    )
                    RETURNING
                        exi_id,
                        event_id,
                        exi_code,
                        organization,
                        exi_name,
                        exi_designation,
                        exi_phonenumber,
                        exi_email,
                        exi_location,
                        exi_description,
                        exi_stall;
                    `,
                    [
                        exiId,

                        event_id,

                        exiCode,

                        String(
                            row.organization
                        ).trim(),

                        String(
                            row.exi_name
                        ).trim(),

                        String(
                            row.exi_designation
                        ).trim() || null,

                        String(
                            row.exi_phonenumber
                        ).trim() || null,

                        String(
                            row.exi_email
                        ).trim() || null,

                        String(
                            row.exi_location
                        ).trim() || null,

                        String(
                            row.exi_description
                        ).trim() || null,

                        String(
                            row.exi_stall_number
                        ).trim()
                    ]
                );

            importedExhibitors.push(
                result.rows[0]
            );
        }

        // =================================================
        // COMMIT
        // =================================================

        await client.query("COMMIT");

        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Exhibitors imported successfully.",

            event:
                eventResult.rows[0],

            imported_count:
                importedExhibitors.length,

            exhibitors:
                importedExhibitors
        });

    } catch (error) {

        // =================================================
        // ROLLBACK
        // =================================================

        if (client) {

            try {

                await client.query(
                    "ROLLBACK"
                );

            } catch (rollbackError) {

                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "Error importing exhibitors:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not import exhibitors."
        });

    } finally {

        if (client) {

            client.release();
        }
    }
};

// =====================================================
// GET EXHIBITORS BY EVENT
// =====================================================

const getExhibitorsByEvent = async (req, res) => {

    try {

        const { event_id } =
            req.params;

        const result =
            await pool.query(
                `
                SELECT
                    exi_id,
                    event_id,
                    exi_code,
                    organization,
                    exi_name,
                    exi_designation,
                    exi_phonenumber,
                    exi_email,
                    exi_location,
                    exi_description,
                    exi_stall
                FROM exhibitors
                WHERE event_id = $1
                ORDER BY
                    exi_stall ASC,
                    organization ASC,
                    exi_name ASC;
                `,
                [event_id]
            );

        res.json({

            success: true,

            count:
                result.rows.length,

            exhibitors:
                result.rows
        });

    } catch (error) {

        console.error(
            "Error fetching exhibitors:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not fetch exhibitors."
        });
    }
};

// =====================================================
// EXHIBITOR LOGIN
// =====================================================

const loginExhibitor = async (req, res) => {

    try {

        const { exi_code } =
            req.body;

        // =================================================
        // VALIDATE CODE
        // =================================================

        if (!exi_code) {

            return res.status(400).json({

                success: false,

                message:
                    "exi_code is required."
            });
        }

        // =================================================
        // FIND EXHIBITOR + EVENT + PROFILE
        // =================================================

        const result =
            await pool.query(
                `
                SELECT
                    e.exi_id,
                    e.event_id,
                    e.exi_code,
                    e.organization,
                    e.exi_name,
                    e.exi_designation,
                    e.exi_phonenumber,
                    e.exi_email,
                    e.exi_location,
                    e.exi_stall,
                    e.exi_photo,
                    e.exi_brochure,
                    e.exi_description,
                    e.org_description,
                    e.org_logo,
                    e.exi_whatsapp,
                    e.exi_website,
                    e.exi_linkedin,
                    e.exi_facebook,
                    e.exi_instagram,
                    ev.eve_id,
                    ev.eve_name,
                    ev.eve_location,
                    ev.eve_start,
                    ev.eve_end
                FROM exhibitors e
                LEFT JOIN events ev
                    ON e.event_id = ev.eve_id
                WHERE e.exi_code = $1;
                `,
                [
                    String(exi_code)
                        .trim()
                        .toUpperCase()
                ]
            );

        // =================================================
        // INVALID CODE
        // =================================================

        if (result.rows.length === 0) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid exhibitor code."
            });
        }

        const row =
            result.rows[0];

        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            message:
                "Exhibitor login successful.",

            exhibitor: {

                // -----------------------------------------
                // IDENTITY
                // -----------------------------------------

                exi_id:
                    row.exi_id,

                event_id:
                    row.event_id,

                exi_code:
                    row.exi_code,

                organization:
                    row.organization,

                exi_name:
                    row.exi_name,

                exi_designation:
                    row.exi_designation,

                exi_phonenumber:
                    row.exi_phonenumber,

                exi_email:
                    row.exi_email,

                exi_location:
                    row.exi_location,

                exi_stall:
                    row.exi_stall,

                // -----------------------------------------
                // PROFILE
                // -----------------------------------------

                exi_photo:
                    row.exi_photo,

                exi_brochure:
                    row.exi_brochure,

                exi_description:
                    row.exi_description,

                org_description:
                    row.org_description,

                org_logo:
                    row.org_logo,

                exi_whatsapp:
                    row.exi_whatsapp,

                exi_website:
                    row.exi_website,

                exi_linkedin:
                    row.exi_linkedin,

                exi_facebook:
                    row.exi_facebook,

                exi_instagram:
                    row.exi_instagram,

                // -----------------------------------------
                // EVENT
                // -----------------------------------------

                event:
                    row.eve_id
                        ? {

                            eve_id:
                                row.eve_id,

                            eve_name:
                                row.eve_name,

                            eve_location:
                                row.eve_location,

                            eve_start:
                                row.eve_start,

                            eve_end:
                                row.eve_end

                        }
                        : null
            }
        });

    } catch (error) {

        console.error(
            "Error during exhibitor login:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not login exhibitor."
        });
    }
};

// =====================================================
// GET SINGLE EXHIBITOR PROFILE
// =====================================================

const getExhibitorById = async (req, res) => {

    try {

        const { exi_id } =
            req.params;

        const result =
            await pool.query(
                `
                SELECT
                    e.exi_id,
                    e.event_id,
                    e.exi_code,
                    e.organization,
                    e.exi_name,
                    e.exi_designation,
                    e.exi_phonenumber,
                    e.exi_email,
                    e.exi_location,
                    e.exi_stall,
                    e.exi_photo,
                    e.exi_brochure,
                    e.exi_description,
                    e.org_description,
                    e.org_logo,
                    e.exi_whatsapp,
                    e.exi_website,
                    e.exi_linkedin,
                    e.exi_facebook,
                    e.exi_instagram,
                    ev.eve_id,
                    ev.eve_name,
                    ev.eve_location,
                    ev.eve_start,
                    ev.eve_end
                FROM exhibitors e
                LEFT JOIN events ev
                    ON e.event_id = ev.eve_id
                WHERE e.exi_id = $1;
                `,
                [exi_id]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Exhibitor not found."
            });
        }

        const row =
            result.rows[0];

        res.json({

            success: true,

            exhibitor: {

                exi_id:
                    row.exi_id,

                event_id:
                    row.event_id,

                exi_code:
                    row.exi_code,

                organization:
                    row.organization,

                exi_name:
                    row.exi_name,

                exi_designation:
                    row.exi_designation,

                exi_phonenumber:
                    row.exi_phonenumber,

                exi_email:
                    row.exi_email,

                exi_location:
                    row.exi_location,

                exi_stall:
                    row.exi_stall,

                exi_photo:
                    row.exi_photo,

                exi_brochure:
                    row.exi_brochure,

                exi_description:
                    row.exi_description,

                org_description:
                    row.org_description,

                org_logo:
                    row.org_logo,

                exi_whatsapp:
                    row.exi_whatsapp,

                exi_website:
                    row.exi_website,

                exi_linkedin:
                    row.exi_linkedin,

                exi_facebook:
                    row.exi_facebook,

                exi_instagram:
                    row.exi_instagram,

                event:
                    row.eve_id
                        ? {

                            eve_id:
                                row.eve_id,

                            eve_name:
                                row.eve_name,

                            eve_location:
                                row.eve_location,

                            eve_start:
                                row.eve_start,

                            eve_end:
                                row.eve_end

                        }
                        : null
            }
        });

    } catch (error) {

        console.error(
            "Error fetching exhibitor profile:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not fetch exhibitor profile."
        });
    }
};

// =====================================================
// UPDATE EXHIBITOR PROFILE
// =====================================================

const updateExhibitorProfile = async (req, res) => {

    try {

        const { exi_id } =
            req.params;

        const {
            exi_description,
            org_description,
            exi_whatsapp,
            exi_website,
            exi_linkedin,
            exi_facebook,
            exi_instagram
        } = req.body;

        // =================================================
        // CHECK EXHIBITOR
        // =================================================

        const existingExhibitor =
            await pool.query(
                `
                SELECT exi_id
                FROM exhibitors
                WHERE exi_id = $1;
                `,
                [exi_id]
            );

        if (
            existingExhibitor.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Exhibitor not found."
            });
        }

        // =================================================
        // FILE PATHS
        // =================================================

        let exiPhotoPath = null;

        let orgLogoPath = null;

        let brochurePath = null;

        // -------------------------------------------------
        // PROFILE PHOTO
        // -------------------------------------------------

        if (
            req.files &&
            req.files.exi_photo &&
            req.files.exi_photo.length > 0
        ) {

            exiPhotoPath =
                "/uploads/exhibitors/" +
                req.files.exi_photo[0].filename;
        }

        // -------------------------------------------------
        // ORGANIZATION LOGO
        // -------------------------------------------------

        if (
            req.files &&
            req.files.org_logo &&
            req.files.org_logo.length > 0
        ) {

            orgLogoPath =
                "/uploads/exhibitors/" +
                req.files.org_logo[0].filename;
        }

        // -------------------------------------------------
        // BROCHURE
        // -------------------------------------------------

        if (
            req.files &&
            req.files.exi_brochure &&
            req.files.exi_brochure.length > 0
        ) {

            brochurePath =
                "/uploads/exhibitors/" +
                req.files.exi_brochure[0].filename;
        }

        // =================================================
        // UPDATE ONLY EDITABLE PROFILE FIELDS
        // =================================================

        const result =
            await pool.query(
                `
                UPDATE exhibitors
                SET

                    exi_photo =
                        COALESCE(
                            $1,
                            exi_photo
                        ),

                    exi_brochure =
                        COALESCE(
                            $2,
                            exi_brochure
                        ),

                    exi_description =
                        COALESCE(
                            $3,
                            exi_description
                        ),

                    org_description =
                        COALESCE(
                            $4,
                            org_description
                        ),

                    org_logo =
                        COALESCE(
                            $5,
                            org_logo
                        ),

                    exi_whatsapp =
                        COALESCE(
                            $6,
                            exi_whatsapp
                        ),

                    exi_website =
                        COALESCE(
                            $7,
                            exi_website
                        ),

                    exi_linkedin =
                        COALESCE(
                            $8,
                            exi_linkedin
                        ),

                    exi_facebook =
                        COALESCE(
                            $9,
                            exi_facebook
                        ),

                    exi_instagram =
                        COALESCE(
                            $10,
                            exi_instagram
                        )

                WHERE exi_id = $11

                RETURNING

                    exi_id,
                    event_id,
                    exi_code,
                    organization,
                    exi_name,
                    exi_designation,
                    exi_phonenumber,
                    exi_email,
                    exi_location,
                    exi_stall,
                    exi_photo,
                    exi_brochure,
                    exi_description,
                    org_description,
                    org_logo,
                    exi_whatsapp,
                    exi_website,
                    exi_linkedin,
                    exi_facebook,
                    exi_instagram;

                `,
                [

                    exiPhotoPath,

                    brochurePath,

                    exi_description !== undefined
                        ? String(
                            exi_description
                        ).trim() || null
                        : null,

                    org_description !== undefined
                        ? String(
                            org_description
                        ).trim() || null
                        : null,

                    orgLogoPath,

                    exi_whatsapp !== undefined
                        ? String(
                            exi_whatsapp
                        ).trim() || null
                        : null,

                    exi_website !== undefined
                        ? String(
                            exi_website
                        ).trim() || null
                        : null,

                    exi_linkedin !== undefined
                        ? String(
                            exi_linkedin
                        ).trim() || null
                        : null,

                    exi_facebook !== undefined
                        ? String(
                            exi_facebook
                        ).trim() || null
                        : null,

                    exi_instagram !== undefined
                        ? String(
                            exi_instagram
                        ).trim() || null
                        : null,

                    exi_id
                ]
            );

        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            message:
                "Exhibitor profile updated successfully.",

            exhibitor:
                result.rows[0]
        });

    } catch (error) {

        console.error(
            "Error updating exhibitor profile:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Could not update exhibitor profile."
        });
    }
};

// =====================================================
// GET EXHIBITOR EVENT STATS
// =====================================================

const getExhibitorEventStats = async (req, res) => {

    try {

        const { exi_id } =
            req.params;

        // =================================================
        // 1. GET EXHIBITOR + EVENT
        // =================================================

        const exhibitorResult =
            await pool.query(
                `
                SELECT
                    e.exi_id,
                    e.event_id,
                    ev.eve_id,
                    ev.eve_name,
                    ev.eve_location,
                    ev.eve_start,
                    ev.eve_end
                FROM exhibitors e
                LEFT JOIN events ev
                    ON e.event_id = ev.eve_id
                WHERE e.exi_id = $1;
                `,
                [exi_id]
            );

        if (
            exhibitorResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Exhibitor not found."
            });
        }

        const exhibitor =
            exhibitorResult.rows[0];

        if (!exhibitor.event_id) {

            return res.status(404).json({

                success: false,

                message:
                    "Event not found for this exhibitor."
            });
        }

        const eventId =
            exhibitor.event_id;

        // =================================================
        // 2. TOTAL EXHIBITORS
        // =================================================

        const exhibitorsResult =
            await pool.query(
                `
                SELECT COUNT(*) AS count
                FROM exhibitors
                WHERE event_id = $1;
                `,
                [eventId]
            );

        // =================================================
        // 3. TOTAL VISITORS
        // =================================================

        const visitorsResult =
            await pool.query(
                `
                SELECT COUNT(*) AS count
                FROM visitors
                WHERE event_id = $1;
                `,
                [eventId]
            );

        // =================================================
        // 4. TOTAL EXPO INTERACTIONS
        // =================================================

        const interactionsResult =
            await pool.query(
                `
                SELECT COUNT(*) AS count
                FROM expo_interactions
                WHERE event_id = $1;
                `,
                [eventId]
            );

        // =================================================
        // 5. VISITORS WHO INTERACTED WITH THIS STALL
        // =================================================

        const visitorUnlocksResult =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT visitor_actor_id
                    ) AS count
                FROM expo_interactions
                WHERE event_id = $1
                AND target_exhibitor_id = $2
                AND visitor_actor_id IS NOT NULL;
                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 6. EXHIBITORS WHO INTERACTED WITH THIS STALL
        // =================================================

        const exhibitorUnlocksResult =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT exhibitor_actor_id
                    ) AS count
                FROM expo_interactions
                WHERE event_id = $1
                AND target_exhibitor_id = $2
                AND exhibitor_actor_id IS NOT NULL;
                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 7. UNIQUE STALLS UNLOCKED IN ENTIRE EVENT
        //
        // IMPORTANT:
        // Count unique target exhibitors.
        //
        // This will be upgraded later to count physical
        // stalls once the complete stall architecture is
        // implemented.
        // =================================================

        const stallsUnlockedResult =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT target_exhibitor_id
                    ) AS count
                FROM expo_interactions
                WHERE event_id = $1;
                `,
                [eventId]
            );

        // =================================================
        // 8. CALCULATE
        // =================================================

        const totalExhibitors =
            Number(
                exhibitorsResult.rows[0].count
            );

        const totalVisitors =
            Number(
                visitorsResult.rows[0].count
            );

        const totalInteractions =
            Number(
                interactionsResult.rows[0].count
            );

        const visitorsUnlocked =
            Number(
                visitorUnlocksResult.rows[0].count
            );

        const exhibitorsUnlocked =
            Number(
                exhibitorUnlocksResult.rows[0].count
            );

        const totalStallsUnlocked =
            Number(
                stallsUnlockedResult.rows[0].count
            );

        // =================================================
        // 9. RESPONSE
        // =================================================

        res.json({

            success: true,

            event: {

                eve_id:
                    exhibitor.eve_id,

                eve_name:
                    exhibitor.eve_name,

                eve_location:
                    exhibitor.eve_location,

                eve_start:
                    exhibitor.eve_start,

                eve_end:
                    exhibitor.eve_end
            },

            stats: {

                exhibitors:
                    totalExhibitors,

                visitors:
                    totalVisitors,

                interactions:
                    totalInteractions,

                stall_engagement: {

                    visitors_unlocked:
                        visitorsUnlocked,

                    visitors_total:
                        totalVisitors,

                    exhibitors_unlocked:
                        exhibitorsUnlocked,

                    exhibitors_total:
                        totalExhibitors,

                    total_stalls_unlocked:
                        totalStallsUnlocked,

                    total_stalls:
                        totalExhibitors
                }
            }
        });

    } catch (error) {

        console.error(
            "Error fetching exhibitor event stats:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not fetch event stats."
        });
    }
};

// =====================================================
// GET EXHIBITOR DASHBOARD INTELLIGENCE
// =====================================================

const getExhibitorDashboard = async (req, res) => {

    try {

        const { exi_id } =
            req.params;

        // =================================================
        // 1. GET EXHIBITOR + EVENT
        // =================================================

        const exhibitorResult =
            await pool.query(
                `
                SELECT
                    e.exi_id,
                    e.event_id,
                    e.organization,
                    e.exi_name,
                    e.exi_designation,
                    ev.eve_id,
                    ev.eve_name,
                    ev.eve_location,
                    ev.eve_start,
                    ev.eve_end
                FROM exhibitors e
                LEFT JOIN events ev
                    ON e.event_id = ev.eve_id
                WHERE e.exi_id = $1;
                `,
                [exi_id]
            );

        // =================================================
        // CHECK EXHIBITOR
        // =================================================

        if (
            exhibitorResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Exhibitor not found."
            });
        }

        const exhibitor =
            exhibitorResult.rows[0];

        // =================================================
        // CHECK EVENT
        // =================================================

        if (!exhibitor.event_id) {

            return res.status(404).json({

                success: false,

                message:
                    "Event not found for this exhibitor."
            });
        }

        const eventId =
            exhibitor.event_id;

        // =================================================
        // 2. EVENT TOTALS
        // =================================================

        const eventTotalsResult =
            await pool.query(
                `
                SELECT

                    (
                        SELECT COUNT(*)
                        FROM exhibitors
                        WHERE event_id = $1
                    ) AS total_exhibitors,

                    (
                        SELECT COUNT(*)
                        FROM visitors
                        WHERE event_id = $1
                    ) AS total_visitors,

                    (
                        SELECT COUNT(*)
                        FROM expo_interactions
                        WHERE event_id = $1
                    ) AS total_interactions,

                    (
                        SELECT COUNT(
                            DISTINCT target_exhibitor_id
                        )
                        FROM expo_interactions
                        WHERE event_id = $1
                    ) AS stalls_unlocked;

                `,
                [eventId]
            );

        const eventTotals =
            eventTotalsResult.rows[0];

        // =================================================
        // 3. VISITORS WHO INTERACTED WITH MY STALL
        // =================================================

        const visitorConnectionsResult =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT visitor_actor_id
                    ) AS count
                FROM expo_interactions
                WHERE event_id = $1
                AND target_exhibitor_id = $2
                AND visitor_actor_id IS NOT NULL;
                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 4. EXHIBITORS WHO INTERACTED WITH MY STALL
        // =================================================

        const exhibitorConnectionsResult =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT exhibitor_actor_id
                    ) AS count
                FROM expo_interactions
                WHERE event_id = $1
                AND target_exhibitor_id = $2
                AND exhibitor_actor_id IS NOT NULL;
                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 5. EXHIBITORS I SCANNED
        // =================================================

        const outgoingExhibitorResult =
            await pool.query(
                `
                SELECT
                    COUNT(
                        DISTINCT target_exhibitor_id
                    ) AS count
                FROM expo_interactions
                WHERE event_id = $1
                AND exhibitor_actor_id = $2
                AND target_exhibitor_id <> $2;
                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 6. CONNECTION ACTIVITY
        // =================================================

        const activityResult =
            await pool.query(
                `
                SELECT
                    DATE(interacted_at)
                        AS interaction_date,

                    COUNT(*)::integer
                        AS interactions

                FROM expo_interactions

                WHERE event_id = $1
                AND target_exhibitor_id = $2

                GROUP BY
                    DATE(interacted_at)

                ORDER BY
                    interaction_date ASC;

                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 7. VISITOR DESIGNATION BREAKDOWN
        // =================================================

        const designationResult =
            await pool.query(
                `
                SELECT

                    COALESCE(
                        NULLIF(
                            TRIM(v.vis_designation),
                            ''
                        ),
                        'Not specified'
                    ) AS designation,

                    COUNT(
                        DISTINCT ei.visitor_actor_id
                    )::integer AS visitors

                FROM expo_interactions ei

                INNER JOIN visitors v
                    ON ei.visitor_actor_id = v.vis_id

                WHERE ei.event_id = $1
                AND ei.target_exhibitor_id = $2
                AND ei.visitor_actor_id IS NOT NULL

                GROUP BY

                    COALESCE(
                        NULLIF(
                            TRIM(v.vis_designation),
                            ''
                        ),
                        'Not specified'
                    )

                ORDER BY
                    visitors DESC;

                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 8. VISITOR ORGANIZATION BREAKDOWN
        // =================================================

        const organizationResult =
            await pool.query(
                `
                SELECT

                    COALESCE(
                        NULLIF(
                            TRIM(v.vis_orgn),
                            ''
                        ),
                        'Not specified'
                    ) AS organization,

                    COUNT(
                        DISTINCT ei.visitor_actor_id
                    )::integer AS visitors

                FROM expo_interactions ei

                INNER JOIN visitors v
                    ON ei.visitor_actor_id = v.vis_id

                WHERE ei.event_id = $1
                AND ei.target_exhibitor_id = $2
                AND ei.visitor_actor_id IS NOT NULL

                GROUP BY

                    COALESCE(
                        NULLIF(
                            TRIM(v.vis_orgn),
                            ''
                        ),
                        'Not specified'
                    )

                ORDER BY
                    visitors DESC;

                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 9. RECENT VISITOR INTERACTIONS
        // =================================================

        const recentVisitorsResult =
            await pool.query(
                `
                SELECT

                    ei.interaction_id,
                    ei.interacted_at,

                    v.vis_id,
                    v.vis_name,
                    v.vis_email,
                    v.vis_orgn,
                    v.vis_designation,
                    v.vis_phonenumber

                FROM expo_interactions ei

                INNER JOIN visitors v
                    ON ei.visitor_actor_id = v.vis_id

                WHERE ei.event_id = $1
                AND ei.target_exhibitor_id = $2
                AND ei.visitor_actor_id IS NOT NULL

                ORDER BY
                    ei.interacted_at DESC

                LIMIT 10;

                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 10. RECENT EXHIBITOR INTERACTIONS
        // =================================================

        const recentExhibitorsResult =
            await pool.query(
                `
                SELECT

                    ei.interaction_id,
                    ei.interacted_at,

                    e.exi_id,
                    e.exi_name,
                    e.exi_designation,
                    e.organization,
                    e.exi_code

                FROM expo_interactions ei

                INNER JOIN exhibitors e
                    ON ei.exhibitor_actor_id = e.exi_id

                WHERE ei.event_id = $1
                AND ei.target_exhibitor_id = $2
                AND ei.exhibitor_actor_id IS NOT NULL

                ORDER BY
                    ei.interacted_at DESC

                LIMIT 10;

                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 11. EXHIBITORS I SCANNED
        // =================================================

        const myExhibitorInteractionsResult =
            await pool.query(
                `
                SELECT

                    ei.interaction_id,
                    ei.interacted_at,

                    e.exi_id,
                    e.exi_name,
                    e.exi_designation,
                    e.organization,
                    e.exi_code

                FROM expo_interactions ei

                INNER JOIN exhibitors e
                    ON ei.target_exhibitor_id = e.exi_id

                WHERE ei.event_id = $1
                AND ei.exhibitor_actor_id = $2

                ORDER BY
                    ei.interacted_at DESC

                LIMIT 10;

                `,
                [
                    eventId,
                    exi_id
                ]
            );

        // =================================================
        // 12. CALCULATE SUMMARY
        // =================================================

        const totalExhibitors =
            Number(
                eventTotals.total_exhibitors
            );

        const totalVisitors =
            Number(
                eventTotals.total_visitors
            );

        const totalInteractions =
            Number(
                eventTotals.total_interactions
            );

        const totalStallsUnlocked =
            Number(
                eventTotals.stalls_unlocked
            );

        const visitorsUnlocked =
            Number(
                visitorConnectionsResult
                    .rows[0]
                    .count
            );

        const exhibitorsUnlocked =
            Number(
                exhibitorConnectionsResult
                    .rows[0]
                    .count
            );

        const exhibitorsIScanned =
            Number(
                outgoingExhibitorResult
                    .rows[0]
                    .count
            );

        // =================================================
        // 13. ENGAGEMENT PERCENTAGES
        // =================================================

        const visitorEngagement =
            totalVisitors > 0
                ? Number(
                    (
                        (
                            visitorsUnlocked /
                            totalVisitors
                        ) * 100
                    ).toFixed(2)
                )
                : 0;

        const exhibitorEngagement =
            totalExhibitors > 0
                ? Number(
                    (
                        (
                            exhibitorsUnlocked /
                            totalExhibitors
                        ) * 100
                    ).toFixed(2)
                )
                : 0;

        const stallEngagement =
            totalExhibitors > 0
                ? Number(
                    (
                        (
                            totalStallsUnlocked /
                            totalExhibitors
                        ) * 100
                    ).toFixed(2)
                )
                : 0;

        // =================================================
        // 14. RESPONSE
        // =================================================

        res.json({

            success: true,

            // =================================================
            // EXHIBITOR
            // =================================================

            exhibitor: {

                exi_id:
                    exhibitor.exi_id,

                exi_name:
                    exhibitor.exi_name,

                exi_designation:
                    exhibitor.exi_designation,

                organization:
                    exhibitor.organization
            },

            // =================================================
            // EVENT
            // =================================================

            event: {

                eve_id:
                    exhibitor.eve_id,

                eve_name:
                    exhibitor.eve_name,

                eve_location:
                    exhibitor.eve_location,

                eve_start:
                    exhibitor.eve_start,

                eve_end:
                    exhibitor.eve_end
            },

            // =================================================
            // EVENT INTELLIGENCE
            // =================================================

            event_intelligence: {

                total_exhibitors:
                    totalExhibitors,

                total_visitors:
                    totalVisitors,

                total_interactions:
                    totalInteractions
            },

            // =================================================
            // STALL ENGAGEMENT
            // =================================================

            stall_engagement: {

                visitors: {

                    unlocked:
                        visitorsUnlocked,

                    total:
                        totalVisitors,

                    percentage:
                        visitorEngagement
                },

                exhibitors: {

                    unlocked:
                        exhibitorsUnlocked,

                    total:
                        totalExhibitors,

                    percentage:
                        exhibitorEngagement
                },

                stalls_unlocked:
                    totalStallsUnlocked,

                total_stalls:
                    totalExhibitors,

                percentage:
                    stallEngagement
            },

            // =================================================
            // MY NETWORKING
            // =================================================

            my_networking: {

                exhibitors_scanned:
                    exhibitorsIScanned
            },

            // =================================================
            // CONNECTION ACTIVITY
            // =================================================

            connection_activity:
                activityResult.rows.map(
                    row => ({

                        date:
                            row.interaction_date,

                        interactions:
                            Number(
                                row.interactions
                            )
                    })
                ),

            // =================================================
            // VISITOR DESIGNATIONS
            // =================================================

            visitor_designations:
                designationResult.rows.map(
                    row => ({

                        designation:
                            row.designation,

                        visitors:
                            Number(
                                row.visitors
                            )
                    })
                ),

            // =================================================
            // VISITOR ORGANIZATIONS
            // =================================================

            visitor_organizations:
                organizationResult.rows.map(
                    row => ({

                        organization:
                            row.organization,

                        visitors:
                            Number(
                                row.visitors
                            )
                    })
                ),

            // =================================================
            // RECENT VISITORS
            // =================================================

            recent_visitors:
                recentVisitorsResult.rows.map(
                    row => ({

                        interaction_id:
                            row.interaction_id,

                        interacted_at:
                            row.interacted_at,

                        visitor: {

                            vis_id:
                                row.vis_id,

                            vis_name:
                                row.vis_name,

                            vis_email:
                                row.vis_email,

                            vis_orgn:
                                row.vis_orgn,

                            vis_designation:
                                row.vis_designation,

                            vis_phonenumber:
                                row.vis_phonenumber
                        }
                    })
                ),

            // =================================================
            // RECENT EXHIBITORS
            // =================================================

            recent_exhibitors:
                recentExhibitorsResult.rows.map(
                    row => ({

                        interaction_id:
                            row.interaction_id,

                        interacted_at:
                            row.interacted_at,

                        exhibitor: {

                            exi_id:
                                row.exi_id,

                            exi_name:
                                row.exi_name,

                            exi_designation:
                                row.exi_designation,

                            organization:
                                row.organization,

                            exi_code:
                                row.exi_code
                        }
                    })
                ),

            // =================================================
            // EXHIBITORS I SCANNED
            // =================================================

            exhibitors_i_scanned:
                myExhibitorInteractionsResult.rows.map(
                    row => ({

                        interaction_id:
                            row.interaction_id,

                        interacted_at:
                            row.interacted_at,

                        exhibitor: {

                            exi_id:
                                row.exi_id,

                            exi_name:
                                row.exi_name,

                            exi_designation:
                                row.exi_designation,

                            organization:
                                row.organization,

                            exi_code:
                                row.exi_code
                        }
                    })
                )
        });

    } catch (error) {

        console.error(
            "Error fetching exhibitor dashboard:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not fetch exhibitor dashboard."
        });
    }
};

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {

    importExhibitors,

    getExhibitorsByEvent,

    loginExhibitor,

    getExhibitorById,

    updateExhibitorProfile,

    getExhibitorEventStats,

    getExhibitorDashboard

};