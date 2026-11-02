const express = require("express");
const { getPhoto } = require("../controllers/photos.controller");

const router = express.Router();

// Allow public image loading by authenticated filename
router.get("/:filename", getPhoto);

module.exports = router;
