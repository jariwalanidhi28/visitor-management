const SystemSettings = require("../models/SystemSettings");
const AuditLog = require("../models/AuditLog");

exports.getActiveTrackingConfig = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      trackingProvider: settings.trackingProvider,
      hypertrack: {
        publishableKey: settings.hypertrack?.publishableKey || "",
        isEnabled: settings.trackingProvider === "hypertrack",
      },
      geocoding: {
        provider: settings.geocoding?.provider || "google",
        isEnabled: settings.trackingProvider === "native_geocoding",
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Return actual key or unmasked if configured
    const displayHyperTrackSecret = settings.hypertrack?.secretKey || "";
    const displayGoogleApiKey = settings.geocoding?.apiKey || process.env.GOOGLE_MAPS_API_KEY || "";

    res.status(200).json({
      success: true,
      settings: {
        trackingProvider: settings.trackingProvider,
        hypertrack: {
          publishableKey: settings.hypertrack?.publishableKey || "",
          accountId: settings.hypertrack?.accountId || "",
          secretKeyMasked: displayHyperTrackSecret,
          hasSecretKey: Boolean(settings.hypertrack?.secretKey),
        },
        geocoding: {
          apiKeyMasked: displayGoogleApiKey,
          hasApiKey: Boolean(settings.geocoding?.apiKey || process.env.GOOGLE_MAPS_API_KEY),
          provider: settings.geocoding?.provider || "google",
        },
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminSettings = async (req, res, next) => {
  try {
    const { trackingProvider, hypertrack, geocoding } = req.body;

    const settings = await SystemSettings.getSettings();

    if (trackingProvider) {
      if (!["native_geocoding", "hypertrack"].includes(trackingProvider)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tracking provider. Must be 'native_geocoding' or 'hypertrack'.",
        });
      }
      settings.trackingProvider = trackingProvider;
    }

    if (hypertrack) {
      if (hypertrack.publishableKey !== undefined) {
        settings.hypertrack.publishableKey = hypertrack.publishableKey.trim();
      }
      if (hypertrack.accountId !== undefined) {
        settings.hypertrack.accountId = hypertrack.accountId.trim();
      }
      if (hypertrack.secretKey && !hypertrack.secretKey.includes("••••")) {
        settings.hypertrack.secretKey = hypertrack.secretKey.trim();
      }
      settings.hypertrack.isEnabled = settings.trackingProvider === "hypertrack";
    }

    if (geocoding) {
      if (geocoding.apiKey && !geocoding.apiKey.includes("••••")) {
        settings.geocoding.apiKey = geocoding.apiKey.trim();
      }
      if (geocoding.provider) {
        settings.geocoding.provider = geocoding.provider;
      }
      settings.geocoding.isEnabled = settings.trackingProvider === "native_geocoding";
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_UPDATE_TRACKING_SETTINGS",
      entityType: "SystemSettings",
      entityId: settings._id.toString(),
      ipAddress: req.ip,
      details: {
        activeTrackingProvider: settings.trackingProvider,
      },
    });

    res.status(200).json({
      success: true,
      message: `Tracking configuration updated: ${settings.trackingProvider.toUpperCase()} is now active.`,
      trackingProvider: settings.trackingProvider,
    });
  } catch (error) {
    next(error);
  }
};
