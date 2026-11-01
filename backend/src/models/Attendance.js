const mongoose = require("mongoose");

const attendanceEventSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      default: null,
    },
    customDestination: {
      type: String,
      default: "",
      trim: true,
    },
    purpose: {
      type: String,
      default: "Work Attendance",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["checked_in", "checked_out"],
      default: "checked_in",
      required: true,
      index: true,
    },
    checkIn: {
      type: attendanceEventSchema,
      required: true,
    },
    checkOut: {
      type: attendanceEventSchema,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null,
    },
    trackingProvider: {
      type: String,
      enum: ["native_geocoding", "hypertrack"],
      default: "native_geocoding",
    },
    trackingMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single active check-in per user at database level with unique partial index
attendanceSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "checked_in" },
  }
);

attendanceSchema.index({ "checkIn.timestamp": -1 });
attendanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
