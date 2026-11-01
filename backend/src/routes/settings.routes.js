const express = require("express");
const {
  getActiveTrackingConfig,
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/settings.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");

const router = express.Router();

// Available to authenticated clients (Mobile app, Admin Web)
router.get("/tracking", authenticate, getActiveTrackingConfig);

// Admin only configuration
router.get("/admin", authenticate, requireAdmin, getAdminSettings);
router.put("/admin", authenticate, requireAdmin, updateAdminSettings);

module.exports = router;
