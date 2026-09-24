const pool = require("../config/database");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


/* =========================================
   UPLOAD DIRECTORY
========================================= */

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "exhibitors"
);


/* =========================================
   ENSURE DIRECTORY EXISTS
========================================= */

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}


/* =========================================
   ALLOWED FILE TYPES
========================================= */

const allowedTypes = {
    PROFILE_PHOTO: [
        "image/jpeg",
        "image/png",
        "image/webp"
    ],

    COMPANY_LOGO: [
        "image/jpeg",
        "image/png",
        "image/webp"
    ],

    BROCHURE: [
        "application/pdf"
    ]
};


/* =========================================
   MAX FILE SIZES
========================================= */

const maxFileSizes = {
    PROFILE_PHOTO: 5 * 1024 * 1024,      // 5 MB
    COMPANY_LOGO: 5 * 1024 * 1024,        // 5 MB
    BROCHURE: 15 * 1024 * 1024            // 15 MB
};


/* =========================================
   UPLOAD EXHIBITOR ASSET
========================================= */

async function uploadExhibitorAsset(req, res) {

    try {

        const { exi_id } = req.params;
        const { asset_type } = req.body;


        /* =====================================
           BASIC VALIDATION
        ====================================== */

        if (!exi_id) {

            return res.status(400).json({
                success: false,
                message: "Exhibitor ID is required."
            });

        }


        if (!asset_type) {

            return res.status(400).json({
                success: false,
                message: "Asset type is required."
            });

        }


        if (!allowedTypes[asset_type]) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid asset type. Allowed types are PROFILE_PHOTO, COMPANY_LOGO and BROCHURE."
            });

        }


        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please upload a file."
            });

        }


        /* =====================================
           CHECK EXHIBITOR
        ====================================== */

        const exhibitorResult = await pool.query(
            `
            SELECT
                exi_id,
                exi_name,
                organization
            FROM exhibitors
            WHERE exi_id = $1
            `,
            [exi_id]
        );


        if (exhibitorResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Exhibitor not found."
            });

        }


        /* =====================================
           CHECK FILE TYPE
        ====================================== */

        if (
            !allowedTypes[asset_type]
                .includes(req.file.mimetype)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `Invalid file type for ${asset_type}.`
            });

        }


        /* =====================================
           CHECK FILE SIZE
        ====================================== */

        if (
            req.file.size >
            maxFileSizes[asset_type]
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `File is too large for ${asset_type}.`
            });

        }


        /* =====================================
           GENERATE SAFE FILE NAME
        ====================================== */

        const extension =
            path.extname(req.file.originalname)
                .toLowerCase();

        const uniqueName =
            `${crypto.randomUUID()}${extension}`;


        const filePath =
            path.join(
                uploadDirectory,
                uniqueName
            );


        /* =====================================
           SAVE FILE
        ====================================== */

        fs.writeFileSync(
            filePath,
            req.file.buffer
        );


        /* =====================================
           CHECK EXISTING ASSET
        ====================================== */

        const existingAsset =
            await pool.query(
                `
                SELECT
                    asset_id,
                    asset_path
                FROM exhibitor_assets
                WHERE exi_id = $1
                AND asset_type = $2
                `,
                [
                    exi_id,
                    asset_type
                ]
            );


        /* =====================================
           REPLACE EXISTING ASSET
        ====================================== */

        if (existingAsset.rows.length > 0) {

            const oldAsset =
                existingAsset.rows[0];


            /* Delete old physical file */

            const oldFilePath =
                path.join(
                    __dirname,
                    "..",
                    oldAsset.asset_path
                );


            if (fs.existsSync(oldFilePath)) {

                fs.unlinkSync(
                    oldFilePath
                );

            }


            /* Update database record */

            const updated =
                await pool.query(
                    `
                    UPDATE exhibitor_assets
                    SET
                        asset_path = $1,
                        uploaded_at = NOW()
                    WHERE asset_id = $2
                    RETURNING
                        asset_id,
                        exi_id,
                        asset_type,
                        asset_path,
                        uploaded_at
                    `,
                    [
                        `uploads/exhibitors/${uniqueName}`,
                        oldAsset.asset_id
                    ]
                );


            return res.status(200).json({
                success: true,
                message: "Asset replaced successfully.",
                asset: updated.rows[0]
            });

        }


        /* =====================================
           CREATE NEW ASSET
        ====================================== */

        const result =
            await pool.query(
                `
                INSERT INTO exhibitor_assets
                (
                    exi_id,
                    asset_type,
                    asset_path
                )
                VALUES
                (
                    $1,
                    $2,
                    $3
                )
                RETURNING
                    asset_id,
                    exi_id,
                    asset_type,
                    asset_path,
                    uploaded_at
                `,
                [
                    exi_id,
                    asset_type,
                    `uploads/exhibitors/${uniqueName}`
                ]
            );


        /* =====================================
           SUCCESS
        ====================================== */

        return res.status(201).json({

            success: true,

            message:
                "Asset uploaded successfully.",

            asset:
                result.rows[0]

        });


    } catch (error) {

        console.error(
            "Upload exhibitor asset error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to upload exhibitor asset."

        });

    }

}


/* =========================================
   GET EXHIBITOR ASSETS
========================================= */

async function getExhibitorAssets(req, res) {

    try {

        const { exi_id } = req.params;


        if (!exi_id) {

            return res.status(400).json({
                success: false,
                message: "Exhibitor ID is required."
            });

        }


        const result =
            await pool.query(
                `
                SELECT
                    asset_id,
                    exi_id,
                    asset_type,
                    asset_path,
                    uploaded_at
                FROM exhibitor_assets
                WHERE exi_id = $1
                ORDER BY uploaded_at DESC
                `,
                [exi_id]
            );


        return res.status(200).json({

            success: true,

            assets:
                result.rows

        });


    } catch (error) {

        console.error(
            "Get exhibitor assets error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve exhibitor assets."

        });

    }

}


module.exports = {
    uploadExhibitorAsset,
    getExhibitorAssets
};