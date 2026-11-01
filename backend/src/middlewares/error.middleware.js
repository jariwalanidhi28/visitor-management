const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Photo file size exceeds the 5MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    if (err.keyPattern && err.keyPattern.userId && err.keyPattern.status) {
      return res.status(409).json({
        success: false,
        message: "You already have an active check-in. Please check out first.",
      });
    }
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
