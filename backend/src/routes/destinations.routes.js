const express = require("express");
const {
  getActiveDestinations,
  getAdminDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
} = require("../controllers/destinations.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");

const router = express.Router();

// User accessible (authenticated)
router.get("/", authenticate, getActiveDestinations);

// Admin accessible
router.get("/admin/all", authenticate, requireAdmin, getAdminDestinations);
router.post("/admin", authenticate, requireAdmin, createDestination);
router.put("/admin/:id", authenticate, requireAdmin, updateDestination);
router.delete("/admin/:id", authenticate, requireAdmin, deleteDestination);

module.exports = router;
