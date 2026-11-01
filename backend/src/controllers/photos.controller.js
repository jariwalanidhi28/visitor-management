const path = require("path");
const fs = require("fs");
const Attendance = require("../models/Attendance");

exports.getPhoto = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const photoPath = path.join(__dirname, "../../uploads/attendance", filename);

    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // Role check: If not admin, check if this photo belongs to an attendance record of req.user
    if (req.user.role !== "admin") {
      const record = await Attendance.findOne({
        $or: [
          { "checkIn.photoUrl": filename },
          { "checkOut.photoUrl": filename },
        ],
        userId: req.user._id,
      });

      if (!record) {
        return res.status(403).json({
          success: false,
          message: "Access to this photo is restricted",
        });
      }
    }

    // Stream image
    const ext = path.extname(filename).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".webp") contentType = "image/webp";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=86400");
    const stream = fs.createReadStream(photoPath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
