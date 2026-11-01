const express = require("express");
const {
  checkIn,
  checkOut,
  getMyActive,
  getMyHistory,
  getAttendanceById,
} = require("../controllers/attendance.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/check-in", upload.single("photo"), checkIn);
router.post("/check-out", upload.single("photo"), checkOut);
router.get("/my-active", getMyActive);
router.get("/my-history", getMyHistory);
router.get("/:id", getAttendanceById);

module.exports = router;
