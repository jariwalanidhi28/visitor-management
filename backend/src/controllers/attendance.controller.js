const fs = require("fs");
const path = require("path");
const Attendance = require("../models/Attendance");
const Destination = require("../models/Destination");
const AuditLog = require("../models/AuditLog");
const SystemSettings = require("../models/SystemSettings");
const geocodingService = require("../services/geocoding.service");
const hypertrackService = require("../services/hypertrack.service");

const saveBase64Image = (base64Str) => {
  const uploadDir = path.join(__dirname, "../../uploads/attendance");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  const filename = `attend-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
};

exports.checkIn = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if user already has an active check-in
    const existingActive = await Attendance.findOne({
      userId,
      status: "checked_in",
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: "You already have an active check-in. Please check out first.",
        activeAttendance: existingActive,
      });
    }

    let photoFilename = null;
    if (req.file) {
      photoFilename = req.file.filename;
    } else if (req.body.photoBase64) {
      photoFilename = saveBase64Image(req.body.photoBase64);
    }

    if (!photoFilename) {
      return res.status(400).json({
        success: false,
        message: "Live camera photo is mandatory for check-in",
      });
    }

    const {
      destinationId,
      customDestination,
      purpose,
      remarks,
      latitude,
      longitude,
      accuracy,
      address,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Valid current GPS coordinates (latitude and longitude) are required",
      });
    }

    let verifiedDestination = null;
    let verifiedDestinationId = null;
    if (destinationId) {
      verifiedDestination = await Destination.findById(destinationId);
      if (verifiedDestination) {
        verifiedDestinationId = verifiedDestination._id;
      }
    }

    // Inspect active tracking provider from admin system settings
    const settings = await SystemSettings.getSettings();
    const activeProvider = settings.trackingProvider; // 'native_geocoding' | 'hypertrack'

    let finalAddress = address ? address.trim() : "";
    let trackingMetadata = {};

    // 1. Resolve high-fidelity readable area name via Geocoding (Nominatim / Google Maps)
    try {
      const geoResult = await geocodingService.reverseGeocode(
        parseFloat(latitude),
        parseFloat(longitude),
        finalAddress
      );
      if (geoResult?.address) {
        finalAddress = geoResult.address;
      }
      trackingMetadata.geocodingEngine = geoResult?.provider || "nominatim";
      trackingMetadata.placeId = geoResult?.placeId || null;
      trackingMetadata.verifiedAt = new Date();
    } catch (geoErr) {
      console.log("Geocoding reverse lookup note:", geoErr.message);
    }

    // 2. Track via active engine
    if (activeProvider === "hypertrack") {
      const htMeta = await hypertrackService.registerCheckIn(
        req.user,
        verifiedDestination,
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: finalAddress,
        }
      );
      trackingMetadata = { ...trackingMetadata, ...htMeta };
    }

    const finalPurpose = purpose?.trim() || "Work Check-In";
    const finalCustomDest =
      customDestination?.trim() ||
      (verifiedDestination ? verifiedDestination.name : finalAddress || "Current Location");

    const newAttendance = await Attendance.create({
      userId,
      destinationId: verifiedDestinationId,
      customDestination: finalCustomDest,
      purpose: finalPurpose,
      remarks: remarks ? remarks.trim() : "",
      status: "checked_in",
      trackingProvider: activeProvider,
      trackingMetadata,
      checkIn: {
        timestamp: new Date(),
        photoUrl: photoFilename,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        address: finalAddress,
      },
    });

    await AuditLog.create({
      actorId: userId,
      action: "USER_CHECK_IN",
      entityType: "Attendance",
      entityId: newAttendance._id.toString(),
      ipAddress: req.ip,
      details: {
        destinationId: verifiedDestinationId,
        customDestination,
        trackingProvider: activeProvider,
        latitude,
        longitude,
      },
    });

    const populated = await Attendance.findById(newAttendance._id)
      .populate("destinationId")
      .populate("userId", "name employeeId department designation");

    res.status(201).json({
      success: true,
      message: `Check-in recorded successfully via ${activeProvider === "hypertrack" ? "HyperTrack" : "Geocoding"} tracking`,
      attendance: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkOut = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const activeAttendance = await Attendance.findOne({
      userId,
      status: "checked_in",
    });

    if (!activeAttendance) {
      return res.status(400).json({
        success: false,
        message: "No active check-in found to check out from",
      });
    }

    let photoFilename = null;
    if (req.file) {
      photoFilename = req.file.filename;
    } else if (req.body.photoBase64) {
      photoFilename = saveBase64Image(req.body.photoBase64);
    }

    if (!photoFilename) {
      return res.status(400).json({
        success: false,
        message: "Live camera photo is mandatory for check-out",
      });
    }

    const { latitude, longitude, accuracy, address, remarks } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Valid current GPS coordinates are required for check-out",
      });
    }

    const checkOutTimestamp = new Date();
    const durationMs = checkOutTimestamp.getTime() - activeAttendance.checkIn.timestamp.getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));

    let finalAddress = address ? address.trim() : "";

    // 1. Resolve high-fidelity departure area name via Geocoding (Nominatim / Google Maps)
    try {
      const geoResult = await geocodingService.reverseGeocode(
        parseFloat(latitude),
        parseFloat(longitude),
        finalAddress
      );
      if (geoResult?.address) {
        finalAddress = geoResult.address;
      }
      activeAttendance.trackingMetadata = {
        ...(activeAttendance.trackingMetadata || {}),
        checkoutPlaceId: geoResult?.placeId || null,
        checkoutGeocodingEngine: geoResult?.provider || "nominatim",
        checkoutVerifiedAt: checkOutTimestamp,
      };
    } catch (geoErr) {
      console.log("Checkout reverse geocoding note:", geoErr.message);
    }

    // 2. Track via active engine
    if (activeAttendance.trackingProvider === "hypertrack") {
      const htMeta = await hypertrackService.registerCheckOut(
        req.user,
        activeAttendance.trackingMetadata,
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: finalAddress,
        }
      );
      activeAttendance.trackingMetadata = {
        ...activeAttendance.trackingMetadata,
        ...htMeta,
      };
    }

    activeAttendance.checkOut = {
      timestamp: checkOutTimestamp,
      photoUrl: photoFilename,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      address: finalAddress,
    };

    activeAttendance.durationMinutes = durationMinutes;
    activeAttendance.status = "checked_out";
    if (remarks) {
      activeAttendance.remarks = activeAttendance.remarks
        ? `${activeAttendance.remarks} | Checkout: ${remarks.trim()}`
        : remarks.trim();
    }

    await activeAttendance.save();

    await AuditLog.create({
      actorId: userId,
      action: "USER_CHECK_OUT",
      entityType: "Attendance",
      entityId: activeAttendance._id.toString(),
      ipAddress: req.ip,
      details: {
        durationMinutes,
        latitude,
        longitude,
      },
    });

    const populated = await Attendance.findById(activeAttendance._id)
      .populate("destinationId")
      .populate("userId", "name employeeId department designation");

    res.status(200).json({
      success: true,
      message: "Check-out completed successfully",
      attendance: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyActive = async (req, res, next) => {
  try {
    const active = await Attendance.findOne({
      userId: req.user._id,
      status: "checked_in",
    }).populate("destinationId");

    res.status(200).json({
      success: true,
      hasActive: Boolean(active),
      attendance: active,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: req.user._id };

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ "checkIn.timestamp": -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("destinationId")
        .lean(),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceById = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate("destinationId")
      .populate("userId", "name employeeId email mobile department designation");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Only admin or record owner can view
    if (
      req.user.role !== "admin" &&
      record.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this record",
      });
    }

    res.status(200).json({
      success: true,
      attendance: record,
    });
  } catch (error) {
    next(error);
  }
};
