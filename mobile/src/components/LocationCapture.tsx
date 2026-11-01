import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string;
}

interface LocationCaptureProps {
  onLocationCaptured: (loc: CapturedLocation) => void;
  location: CapturedLocation | null;
}

export const LocationCapture: React.FC<LocationCaptureProps> = ({
  onLocationCaptured,
  location,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(
          "Foreground location permission is mandatory to verify your attendance coordinates."
        );
        return;
      }

      // Check if location services enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setErrorMsg(
          "Device GPS / Location Services are turned off. Please enable GPS in device settings and retry."
        );
        return;
      }

      // Request fresh current position with high accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = position.coords;

      let formattedAddress = "";
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverse && reverse.length > 0) {
          const item = reverse[0];
          // Filter out raw Plus Codes (e.g. "5R6M+442") from being displayed as the street name
          const isPlusCode = item.name && item.name.includes("+");
          const streetPart = isPlusCode ? item.street : [item.name, item.street].filter(Boolean).join(", ");

          formattedAddress = [
            streetPart,
            item.district,
            item.city || item.subregion,
            item.region,
            item.postalCode,
            item.country || "India",
          ]
            .filter(Boolean)
            .join(", ");
        }
      } catch (e) {
        console.log("Reverse geocode fallback:", e);
      }

      onLocationCaptured({
        latitude,
        longitude,
        accuracy: accuracy ? Math.round(accuracy) : null,
        address: formattedAddress || `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to acquire GPS fix. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!location) {
      fetchLocation();
    }
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="location-sharp" size={20} color="#2563EB" />
          <Text style={styles.title}>GPS Attendance Verification</Text>
        </View>

        <TouchableOpacity
          onPress={fetchLocation}
          disabled={loading}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={16}
            color={loading ? "#94A3B8" : "#2563EB"}
          />
          <Text
            style={[
              styles.refreshText,
              loading && { color: "#94A3B8" },
            ]}
          >
            {loading ? "Locating..." : "Retry GPS"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.statusText}>Acquiring live satellite GPS fix...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : location ? (
        <View style={styles.locationContainer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {location.address}
          </Text>
          <View style={styles.coordsRow}>
            <Text style={styles.coordBadge}>
              Lat: {location.latitude.toFixed(5)}
            </Text>
            <Text style={styles.coordBadge}>
              Lng: {location.longitude.toFixed(5)}
            </Text>
            {location.accuracy !== null && (
              <Text
                style={[
                  styles.coordBadge,
                  location.accuracy <= 25 ? styles.highAccuracy : styles.lowAccuracy,
                ]}
              >
                Accuracy: ±{location.accuracy}m
              </Text>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.statusText}>No location captured.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  refreshText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  stateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#64748B",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#DC2626",
    lineHeight: 16,
  },
  locationContainer: {
    gap: 8,
  },
  addressText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 18,
  },
  coordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  coordBadge: {
    fontSize: 11,
    fontFamily: "monospace",
    backgroundColor: "#F1F5F9",
    color: "#475569",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  highAccuracy: {
    backgroundColor: "#ECFDF5",
    color: "#047857",
  },
  lowAccuracy: {
    backgroundColor: "#FFFBEB",
    color: "#B45309",
  },
});
