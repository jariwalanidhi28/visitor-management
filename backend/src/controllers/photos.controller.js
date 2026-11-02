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
