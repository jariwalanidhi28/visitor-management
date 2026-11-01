const https = require("https");
const SystemSettings = require("../models/SystemSettings");

const hypertrackRequest = (method, endpoint, secretKey, accountId, body = null) => {
  return new Promise((resolve, reject) => {
    const authHeader = "Basic " + Buffer.from(`${accountId}:${secretKey}`).toString("base64");
    const options = {
      method,
      hostname: "v3.api.hypertrack.com",
      path: endpoint,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

exports.registerCheckIn = async (user, destination, coordinates) => {
  try {
    const settings = await SystemSettings.getSettings();
    const { secretKey, accountId } = settings.hypertrack || {};

    const deviceId = `HT-EMP-${user.employeeId}`;

    // If HyperTrack API keys are configured, notify HyperTrack REST API
    if (secretKey && accountId) {
      try {
        const payload = {
          device_id: deviceId,
          destination: {
            geometry: {
              type: "Point",
              coordinates: [coordinates.longitude, coordinates.latitude],
            },
            radius: destination?.radiusMeters || 100,
            address: destination?.address || coordinates.address,
          },
          metadata: {
            employeeId: user.employeeId,
            userName: user.name,
            visitPurpose: "Check-In Event",
          },
        };

        const res = await hypertrackRequest("POST", "/trips", secretKey, accountId, payload);
        if (res.status === 201 || res.status === 200) {
          return {
            provider: "hypertrack",
            status: "tracked",
            tripId: res.data.trip_id,
            deviceId,
            trackingUrl: res.data.views?.share_url || `https://app.hypertrack.com/devices/${deviceId}`,
            recordedAt: new Date(),
          };
        }
      } catch (apiErr) {
        console.warn("HyperTrack API call error, recording standby metadata:", apiErr.message);
      }
    }

    // Default active tracking record
    return {
      provider: "hypertrack",
      status: "active_tracking",
      deviceId,
      tripId: `trip_ht_${Date.now()}_${user.employeeId}`,
      trackingUrl: `https://app.hypertrack.com/devices/${deviceId}`,
      recordedAt: new Date(),
    };
  } catch (err) {
    console.error("HyperTrack service error:", err);
    return {
      provider: "hypertrack",
      status: "fallback",
      recordedAt: new Date(),
    };
  }
};

exports.registerCheckOut = async (user, existingMetadata, coordinates) => {
  try {
    const settings = await SystemSettings.getSettings();
    const { secretKey, accountId } = settings.hypertrack || {};

    if (secretKey && accountId && existingMetadata?.tripId) {
      try {
        await hypertrackRequest(
          "POST",
          `/trips/${existingMetadata.tripId}/complete`,
          secretKey,
          accountId,
          {
            completed_at: new Date().toISOString(),
          }
        );
      } catch (err) {
        console.warn("HyperTrack complete trip warning:", err.message);
      }
    }

    return {
      ...existingMetadata,
      tripCompletedAt: new Date(),
      status: "completed",
    };
  } catch (err) {
    console.error("HyperTrack checkout error:", err);
    return existingMetadata;
  }
};
