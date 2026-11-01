const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  resetPassword,
} = require("../controllers/admin.users.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.post("/:id/reset-password", resetPassword);

module.exports = router;
