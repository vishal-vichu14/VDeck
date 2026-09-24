const express = require("express");

const router = express.Router();

const {
    createConnection,
    getVisitorConnections,
    getExhibitorLeads
} = require("../controllers/connections.controller");


router.post("/", createConnection);

router.get("/visitor/:vis_id", getVisitorConnections);

router.get("/exhibitor/:exi_id", getExhibitorLeads);


module.exports = router;