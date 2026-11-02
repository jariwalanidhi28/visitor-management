require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const connectDB = require("./src/config/db");
const healthRoutes = require("./src/routes/health.routes");
const authRoutes = require("./src/routes/auth.routes");
const adminUserRoutes = require("./src/routes/admin.users.routes");
const destinationRoutes = require("./src/routes/destinations.routes");
const attendanceRoutes = require("./src/routes/attendance.routes");
const adminAttendanceRoutes = require("./src/routes/admin.attendance.routes");
const photoRoutes = require("./src/routes/photos.routes");
const settingsRoutes = require("./src/routes/settings.routes");
const errorHandler = require("./src/middlewares/error.middleware");

const app = express();

app.disable("x-powered-by");

// Enhanced Helmet config permitting embedded images / cross origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS config allowing admin-web (with cookies) and mobile clients
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Dev environment permissive
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Route registration
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin/attendance", adminAttendanceRoutes);
app.use("/api/photos", photoRoutes);
app.use("/photos", photoRoutes);
app.use("/api/settings", settingsRoutes);

// Serve Admin Web Frontend (React + Vite build)
const adminDistPath = path.join(__dirname, "../admin-web/dist");
if (fs.existsSync(adminDistPath)) {
  app.use(express.static(adminDistPath));

  // SPA fallback for React client-side routing
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/photos")) {
      return res.sendFile(path.join(adminDistPath, "index.html"));
    }
    next();
  });
}

// 404 handler for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`Local API: http://localhost:${PORT}/api/health`);
  });
};

// Only listen if not imported by test suite
if (require.main === module) {
  startServer();
}

module.exports = app;
