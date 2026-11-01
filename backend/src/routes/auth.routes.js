const express = require("express");
const { login, getMe, logout } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

module.exports = router;
