const express = require("express");

const router = express.Router();

const {
    getAllEvents,
    getEventById,
    createEvent
} = require("../controllers/events.controller");


// GET /api/events
router.get("/", getAllEvents);


// GET /api/events/:id
router.get("/:id", getEventById);


// POST /api/events
router.post("/", createEvent);


module.exports = router;