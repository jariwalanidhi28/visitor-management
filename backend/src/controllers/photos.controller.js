const path = require("path");
const fs = require("fs");
const Attendance = require("../models/Attendance");

exports.getPhoto = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const photoPath = path.join(__dirname, "../../uploads/attendance", filename);

    // 1. If physical file exists on server disk, stream it
    if (fs.existsSync(photoPath)) {
      const ext = path.extname(filename).toLowerCase();
      let contentType = "image/jpeg";
      if (ext === ".png") contentType = "image/png";
      if (ext === ".webp") contentType = "image/webp";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const stream = fs.createReadStream(photoPath);
      return stream.pipe(res);
    }

    // 2. Fallback: Lookup in database if saved as photoBase64
    const record = await Attendance.findOne({
      $or: [
        { "checkIn.photoUrl": filename },
        { "checkOut.photoUrl": filename },
      ],
    });

    const base64Data =
      record?.checkIn?.photoUrl === filename
        ? record.checkIn.photoBase64
        : record?.checkOut?.photoUrl === filename
        ? record.checkOut.photoBase64
        : null;

    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(cleanBase64, "base64");
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.end(imgBuffer);
    }

    return res.status(404).json({
      success: false,
      message: "Photo not found",
    });
  } catch (error) {
    next(error);
  }
};
