const https = require("https");
const SystemSettings = require("../models/SystemSettings");

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "VisitorManagement-GeocodingService/1.0",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on("error", reject);
  });
};

exports.reverseGeocode = async (latitude, longitude, fallbackAddress = "") => {
  try {
    const settings = await SystemSettings.getSettings();
    const apiKey = settings.geocoding?.apiKey || process.env.GOOGLE_MAPS_API_KEY;

    // 1. Google Maps Geocoding API if key configured
    if (apiKey && settings.geocoding?.provider === "google") {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const response = await fetchJson(url);

      if (response.status === "OK" && response.results && response.results.length > 0) {
        const primary = response.results[0];
        return {
          provider: "google",
          address: primary.formatted_address,
          placeId: primary.place_id,
          locationType: primary.geometry?.location_type,
          types: primary.types,
        };
      }
    }

    // 2. OpenStreetMap Nominatim fallback
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    try {
      const nomResponse = await fetchJson(nominatimUrl);
      if (nomResponse && nomResponse.display_name) {
        return {
          provider: "nominatim",
          address: nomResponse.display_name,
          placeId: nomResponse.place_id?.toString(),
          osmType: nomResponse.osm_type,
        };
      }
    } catch (nomErr) {
      // Nominatim rate limits or offline
    }

    // 3. Fallback to client reverse geocode
    return {
      provider: "client_fallback",
      address: fallbackAddress || `Coordinates: ${latitude}, ${longitude}`,
      placeId: null,
    };
  } catch (error) {
    console.error("Geocoding service error:", error);
    return {
      provider: "fallback_error",
      address: fallbackAddress || `Coordinates: ${latitude}, ${longitude}`,
      placeId: null,
    };
  }
};
