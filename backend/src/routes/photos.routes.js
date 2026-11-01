const express = require("express");
const { getPhoto } = require("../controllers/photos.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/:filename", authenticate, getPhoto);

module.exports = router;
