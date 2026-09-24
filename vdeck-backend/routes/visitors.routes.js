const express = require("express");

const router = express.Router();

const {
    registerVisitor,
    getVisitorById,
    getVisitorsByEvent
} = require("../controllers/visitors.controller");


// =====================================================
// REGISTER TEMPORARY VISITOR
// =====================================================

router.post(
    "/register",
    registerVisitor
);


// =====================================================
// GET ALL VISITORS BY EVENT
// IMPORTANT: THIS MUST COME BEFORE /:vis_id
// =====================================================

router.get(
    "/event/:event_id",
    getVisitorsByEvent
);


// =====================================================
// GET TEMPORARY VISITOR BY ID
// =====================================================

router.get(
    "/:vis_id",
    getVisitorById
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;