const express = require("express");

const router = express.Router();

const {
    getStallsByEvent,
    getVisitorStalls,
    getExhibitorStalls
} = require("../controllers/stalls.controller");


/*
=========================================
GET ALL STALLS FOR AN EVENT
=========================================

GET /api/stalls/event/:event_id
*/

router.get(
    "/event/:event_id",
    getStallsByEvent
);


/*
=========================================
GET VISITOR STALLS
=========================================

GET /api/stalls/visitor/:vis_id
*/

router.get(
    "/visitor/:vis_id",
    getVisitorStalls
);


/*
=========================================
GET EXHIBITOR STALLS
=========================================

GET /api/stalls/exhibitor/:exi_id
*/

router.get(
    "/exhibitor/:exi_id",
    getExhibitorStalls
);


module.exports = router;