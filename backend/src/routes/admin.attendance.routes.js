const express = require("express");
const {
  getAttendanceRecords,
  getAttendanceById,
  getAttendanceStats,
  exportAttendance,
} = require("../controllers/admin.attendance.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/stats", getAttendanceStats);
router.get("/export", exportAttendance);
router.get("/", getAttendanceRecords);
router.get("/:id", getAttendanceById);

module.exports = router;
