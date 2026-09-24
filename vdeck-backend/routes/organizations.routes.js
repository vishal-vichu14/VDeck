const express = require("express");

const router = express.Router();

const {
    createOrganization,
    getAllOrganizations,
    getOrganizationById,
    verifyOrganization
} = require("../controllers/organizations.controller");


// ========================================
// GET ALL ORGANIZATIONS
// ========================================

router.get("/", getAllOrganizations);


// ========================================
// GET ORGANIZATION BY ID
// ========================================

router.get("/:id", getOrganizationById);


// ========================================
// CREATE ORGANIZATION
// ========================================

router.post("/", createOrganization);


// ========================================
// VERIFY ORGANIZATION
// ========================================

router.put("/:orgn_id/verify", verifyOrganization);


module.exports = router;