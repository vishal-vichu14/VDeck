const express = require("express");
const multer = require("multer");

const router = express.Router();


const {
    uploadExhibitorAsset,
    getExhibitorAssets
} = require(
    "../controllers/exhibitorAssets.controller"
);


/* =========================================
   MULTER
========================================= */

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 15 * 1024 * 1024
    }

});


/* =========================================
   UPLOAD ASSET
========================================= */

router.post(
    "/:exi_id",
    upload.single("file"),
    uploadExhibitorAsset
);


/* =========================================
   GET ASSETS
========================================= */

router.get(
    "/:exi_id",
    getExhibitorAssets
);


module.exports = router;