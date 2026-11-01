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

interface CheckOutScreenProps {
  onCheckOutComplete: () => void;
  onCancel: () => void;
}

export const CheckOutScreen: React.FC<CheckOutScreenProps> = ({
  onCheckOutComplete,
  onCancel,
}) => {
  const { token, apiUrl } = useAuth();
  const [activeAttendance, setActiveAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Directly start with camera open
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch(`${apiUrl}/attendance/my-active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.hasActive) {
            setActiveAttendance(data.attendance);
          } else {
            Alert.alert(
              "No Active Session",
              "You do not have an active check-in to check out from.",
              [{ text: "OK", onPress: onCancel }]
            );
          }
        }
      } catch (err) {
        console.log("Failed to load active attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActive();
  }, [token]);

  const handlePhotoConfirmed = (uri: string, base64?: string) => {
    setPhotoUri(uri);
    setPhotoBase64(base64 || "");
    setIsCameraOpen(false);
  };

  const handleSubmitCheckOut = async () => {
    if (!photoUri) {
      setIsCameraOpen(true);
      return;
    }

    if (!location) {
      Alert.alert(
        "GPS Location Required",
        "Waiting for your departure location. Please ensure GPS is enabled."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${apiUrl}/attendance/check-out`, {
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
        throw new Error(data.message || "Failed to record check-out");
      }

      const duration = data.attendance?.durationMinutes || 0;

      Alert.alert(
        "Check-Out Complete",
        `Your visit has concluded successfully.\nTotal Recorded Duration: ${duration} minutes.`,
        [{ text: "Back to Dashboard", onPress: onCheckOutComplete }]
      );
    } catch (err: any) {
      Alert.alert("Check-Out Error", err.message || "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Verifying active check-in...</Text>
      </View>
    );
  }

  // If user hasn't captured photo yet, show Camera immediately
  if (isCameraOpen) {
    return (
      <CameraCapture
        title="Check-Out Selfie"
        onPhotoConfirmed={handlePhotoConfirmed}
        onCancel={onCancel}
      />
    );
  }

  const cin = activeAttendance?.checkIn;
  const elapsedMinutes = cin
    ? Math.max(0, Math.floor((Date.now() - new Date(cin.timestamp).getTime()) / 60000))
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Check-Out</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Active Visit Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.statusDot} />
          <Text style={styles.summaryTitle}>Closing Active Session</Text>
        </View>

        <Text style={styles.destName}>
          {activeAttendance?.destinationId
            ? activeAttendance.destinationId.name
            : activeAttendance?.customDestination || "On-site Duty"}
        </Text>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            Started: {cin ? new Date(cin.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          </Text>
          <Text style={styles.durationPill}>~{elapsedMinutes} mins duration</Text>
        </View>
      </View>

      {/* Captured Photo Preview Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Captured Live Selfie</Text>
          <TouchableOpacity
            style={styles.retakeLink}
            onPress={() => setIsCameraOpen(true)}
          >
            <Ionicons name="camera-reverse-outline" size={16} color="#059669" />
            <Text style={[styles.retakeLinkText, { color: "#059669" }]}>Retake Photo</Text>
          </TouchableOpacity>
        </View>

        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={[styles.verifiedBadge, { backgroundColor: "rgba(5, 150, 105, 0.9)" }]}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.verifiedBadgeText}>Departure Selfie Ready</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Current Departure Location */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Departure Location</Text>
        <LocationCapture
          location={location}
          onLocationCaptured={setLocation}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!photoUri || !location || isSubmitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmitCheckOut}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.submitRow}>
            <Ionicons name="log-out-sharp" size={22} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Check-Out</Text>
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
  centerContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  summaryCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.5,
  },
  destName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#065F46",
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "600",
  },
  durationPill: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: "#059669",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#059669",
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
