const express = require("express");
const multer = require("multer");

const router = express.Router();


const {
    importExhibitors,
    getExhibitorsByEvent,
    loginExhibitor,
    getExhibitorById,
    updateExhibitorProfile,
    getExhibitorEventStats,
    getExhibitorDashboard
} = require("../controllers/exhibitors.controller");


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});


const exhibitorUpload =
    require("../middleware/exhibitorUpload");


// =====================================================
// IMPORT EXHIBITORS
// =====================================================

router.post(
    "/import",
    upload.single("file"),
    importExhibitors
);


// =====================================================
// GET EXHIBITORS BY EVENT
// =====================================================

router.get(
    "/event/:event_id",
    getExhibitorsByEvent
);


// =====================================================
// EXHIBITOR LOGIN
// =====================================================

router.post(
    "/login",
    loginExhibitor
);


// =====================================================
// UPDATE EXHIBITOR PROFILE
// =====================================================

router.put(
    "/:exi_id",
    exhibitorUpload.fields([
        {
            name: "exi_photo",
            maxCount: 1
        },
        {
            name: "org_logo",
            maxCount: 1
        },
        {
            name: "exi_brochure",
            maxCount: 1
        }
    ]),
    updateExhibitorProfile
);


// =====================================================
// EXHIBITOR EVENT STATS
// IMPORTANT:
// Must come BEFORE /:exi_id
// =====================================================

router.get(
    "/:exi_id/stats",
    getExhibitorEventStats
);


// =====================================================
// EXHIBITOR DASHBOARD
// IMPORTANT:
// Must come BEFORE /:exi_id
// =====================================================

router.get(
    "/:exi_id/dashboard",
    getExhibitorDashboard
);


// =====================================================
// SINGLE EXHIBITOR PROFILE
// =====================================================

router.get(
    "/:exi_id",
    getExhibitorById
);


module.exports = router;