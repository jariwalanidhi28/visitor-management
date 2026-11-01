import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface DashboardScreenProps {
  onNavigateToCheckIn: () => void;
  onNavigateToCheckOut: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToCheckIn,
  onNavigateToCheckOut,
  onNavigateToHistory,
  onNavigateToProfile,
}) => {
  const { user, token, apiUrl } = useAuth();
  const [activeAttendance, setActiveAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  const fetchActiveStatus = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${apiUrl}/attendance/my-active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hasActive) {
          setActiveAttendance(data.attendance);
        } else {
          setActiveAttendance(null);
        }
      }
    } catch (e) {
      console.log("Failed to fetch active attendance:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveStatus();
  }, [token]);

  // Live elapsed visit timer calculation
  useEffect(() => {
    if (!activeAttendance?.checkIn?.timestamp) return;

    const updateElapsed = () => {
      const start = new Date(activeAttendance.checkIn.timestamp).getTime();
      const now = Date.now();
      const mins = Math.max(0, Math.floor((now - start) / 60000));
      setElapsedMinutes(mins);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 30000); // every 30s
    return () => clearInterval(interval);
  }, [activeAttendance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveStatus();
  };

  const isCheckedIn = Boolean(activeAttendance);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Top Header Card */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.empIdBadge}>{user?.employeeId}</Text>
            <Text style={styles.deptBadge}>{user?.department}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={onNavigateToProfile}
        >
          <Ionicons name="person-circle-outline" size={36} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Date Banner */}
      <View style={styles.dateBar}>
        <Ionicons name="calendar-outline" size={14} color="#64748B" />
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Live System Attendance Status Card */}
      <View
        style={[
          styles.statusCard,
          isCheckedIn ? styles.statusCardActive : styles.statusCardInactive,
        ]}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicatorRow}>
            <View
              style={[
                styles.statusDot,
                isCheckedIn ? styles.statusDotActive : styles.statusDotInactive,
              ]}
            />
            <Text style={styles.statusTitle}>
              {isCheckedIn ? "CURRENTLY CHECKED IN" : "NOT CHECKED IN"}
            </Text>
          </View>

          {isCheckedIn && (
            <View style={styles.liveTimerBadge}>
              <Ionicons name="time-outline" size={12} color="#047857" />
              <Text style={styles.liveTimerText}>{elapsedMinutes}m elapsed</Text>
            </View>
          )}
        </View>

        {isCheckedIn ? (
          <View style={styles.activeDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="business-outline" size={16} color="#047857" />
              <Text style={styles.detailLabel}>Destination:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {activeAttendance.destinationId
                  ? activeAttendance.destinationId.name
                  : activeAttendance.customDestination || "Custom Location"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="log-in-outline" size={16} color="#047857" />
              <Text style={styles.detailLabel}>Check-In Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(activeAttendance.checkIn.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="navigate-outline" size={16} color="#047857" />
              <Text style={styles.detailLabel}>Purpose:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {activeAttendance.purpose}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.inactiveDesc}>
            You have no active check-in session. Tap "Start Check-In" below to record arrival with your live camera and GPS coordinates.
          </Text>
        )}
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionGrid}>
        {/* Check In Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.checkInButton,
            isCheckedIn && styles.actionButtonDisabled,
          ]}
          onPress={onNavigateToCheckIn}
          disabled={isCheckedIn}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons
              name="log-in-sharp"
              size={28}
              color={isCheckedIn ? "#94A3B8" : "#FFFFFF"}
            />
          </View>
          <Text
            style={[
              styles.actionButtonTitle,
              isCheckedIn && styles.actionButtonTitleDisabled,
            ]}
          >
            Check-In
          </Text>
          <Text style={styles.actionButtonSubtitle}>
            {isCheckedIn ? "Already active" : "Record arrival & selfie"}
          </Text>
        </TouchableOpacity>

        {/* Check Out Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.checkOutButton,
            !isCheckedIn && styles.actionButtonDisabled,
          ]}
          onPress={onNavigateToCheckOut}
          disabled={!isCheckedIn}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons
              name="log-out-sharp"
              size={28}
              color={!isCheckedIn ? "#94A3B8" : "#FFFFFF"}
            />
          </View>
          <Text
            style={[
              styles.actionButtonTitle,
              !isCheckedIn && styles.actionButtonTitleDisabled,
            ]}
          >
            Check-Out
          </Text>
          <Text style={styles.actionButtonSubtitle}>
            {!isCheckedIn ? "Requires check-in" : "Complete visit & selfie"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attendance History Shortcut */}
      <TouchableOpacity
        style={styles.historyShortcutCard}
        onPress={onNavigateToHistory}
      >
        <View style={styles.historyShortcutLeft}>
          <View style={styles.historyIconWrapper}>
            <Ionicons name="reader-outline" size={22} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.historyCardTitle}>My Attendance History</Text>
            <Text style={styles.historyCardSub}>
              Review past check-ins, durations, and GPS locations
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  empIdBadge: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontFamily: "monospace",
  },
  deptBadge: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  profileButton: {
    padding: 4,
  },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  statusCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  statusCardActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusCardInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotActive: {
    backgroundColor: "#10B981",
  },
  statusDotInactive: {
    backgroundColor: "#94A3B8",
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#0F172A",
  },
  liveTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveTimerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
  activeDetails: {
    gap: 8,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
  },
  inactiveDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  checkInButton: {
    backgroundColor: "#2563EB",
  },
  checkOutButton: {
    backgroundColor: "#059669",
  },
  actionButtonDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 0,
    shadowOpacity: 0,
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionButtonTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionButtonTitleDisabled: {
    color: "#94A3B8",
  },
  actionButtonSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textAlign: "center",
  },
  historyShortcutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyShortcutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  historyIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  historyCardSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
