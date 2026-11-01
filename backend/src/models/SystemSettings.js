const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default_settings",
      unique: true,
    },
    trackingProvider: {
      type: String,
      enum: ["native_geocoding", "hypertrack"],
      default: "native_geocoding",
      required: true,
    },
    hypertrack: {
      publishableKey: {
        type: String,
        default: "",
        trim: true,
      },
      secretKey: {
        type: String,
        default: "",
        trim: true,
      },
      accountId: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },
    geocoding: {
      apiKey: {
        type: String,
        default: "",
        trim: true,
      },
      provider: {
        type: String,
        enum: ["google", "nominatim"],
        default: "google",
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "default_settings" });
  if (!settings) {
    settings = await this.create({
      key: "default_settings",
      trackingProvider: "native_geocoding",
      geocoding: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
        provider: "google",
        isEnabled: true,
      },
      hypertrack: {
        publishableKey: process.env.HYPERTRACK_PUBLISHABLE_KEY || "",
        secretKey: process.env.HYPERTRACK_SECRET_KEY || "",
        accountId: process.env.HYPERTRACK_ACCOUNT_ID || "",
        isEnabled: false,
      },
    });
  }
  return settings;
};

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
