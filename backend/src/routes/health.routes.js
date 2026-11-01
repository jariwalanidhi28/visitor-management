const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Visitor Management API is running",
  });
});

router.get("/db", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? "Connected" : "Disconnected",
  });
});

module.exports = router;