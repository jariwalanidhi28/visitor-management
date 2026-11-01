import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { CameraCapture } from "../components/CameraCapture";
import { LocationCapture, CapturedLocation } from "../components/LocationCapture";
import { Ionicons } from "@expo/vector-icons";

interface CheckInScreenProps {
  onCheckInComplete: () => void;
  onCancel: () => void;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({
  onCheckInComplete,
  onCancel,
}) => {
  const { token, apiUrl } = useAuth();

  // Directly start with camera open
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [trackingEngine, setTrackingEngine] = useState<string>("native_geocoding");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active tracking engine on mount
  useEffect(() => {
    const fetchTrackingEngine = async () => {
      try {
        const res = await fetch(`${apiUrl}/settings/tracking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.trackingProvider) {
            setTrackingEngine(data.trackingProvider);
          }
        }
      } catch (err) {
        console.log("Failed to fetch tracking engine:", err);
      }
    };

    fetchTrackingEngine();
  }, [token]);

  const handlePhotoConfirmed = (uri: string, base64?: string) => {
    setPhotoUri(uri);
    setPhotoBase64(base64 || "");
    setIsCameraOpen(false);
  };

  const handleSubmitCheckIn = async () => {
    if (!photoUri) {
      setIsCameraOpen(true);
      return;
    }

    if (!location) {
      Alert.alert(
        "GPS Location Required",
        "Waiting for your current location. Please ensure GPS is enabled on your device."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${apiUrl}/attendance/check-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoBase64,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to record check-in");
      }

      Alert.alert(
        "Check-In Successful",
        `Your check-in photo and current location have been recorded successfully.`,
        [{ text: "OK", onPress: onCheckInComplete }]
      );
    } catch (err: any) {
      Alert.alert("Check-In Error", err.message || "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user hasn't captured a photo yet, show Camera immediately
  if (isCameraOpen) {
    return (
      <CameraCapture
        title="Check-In Selfie"
        onPhotoConfirmed={handlePhotoConfirmed}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Check-In</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Captured Photo Preview Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Captured Live Selfie</Text>
          <TouchableOpacity
            style={styles.retakeLink}
            onPress={() => setIsCameraOpen(true)}
          >
            <Ionicons name="camera-reverse-outline" size={16} color="#2563EB" />
            <Text style={styles.retakeLinkText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>

        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.verifiedBadgeText}>Live Photo Ready</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Current Location Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Current Location</Text>
          <View
            style={[
              styles.engineBadge,
              trackingEngine === "hypertrack"
                ? styles.engineBadgeHt
                : styles.engineBadgeGeo,
            ]}
          >
            <Ionicons
              name={trackingEngine === "hypertrack" ? "hardware-chip" : "navigate"}
              size={12}
              color={trackingEngine === "hypertrack" ? "#047857" : "#1D4ED8"}
            />
            <Text
              style={[
                styles.engineBadgeText,
                trackingEngine === "hypertrack"
                  ? styles.engineBadgeTextHt
                  : styles.engineBadgeTextGeo,
              ]}
            >
              {trackingEngine === "hypertrack" ? "HyperTrack" : "GPS Geocoding"}
            </Text>
          </View>
        </View>

        <LocationCapture
          location={location}
          onLocationCaptured={setLocation}
        />
      </View>

      {/* One-Click Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!photoUri || !location || isSubmitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmitCheckIn}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.submitRow}>
            <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Check-In</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  retakeLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retakeLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  photoContainer: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(22, 163, 74, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  engineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  engineBadgeHt: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  engineBadgeGeo: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  engineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  engineBadgeTextHt: {
    color: "#047857",
  },
  engineBadgeTextGeo: {
    color: "#1D4ED8",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
