import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, logout, apiUrl } = useAuth();
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const handleTestBackend = async () => {
    setTestingHealth(true);
    setHealthStatus(null);
    try {
      const res = await fetch(`${apiUrl}/health`);
      const data = await res.json();
      if (res.ok && data.success) {
        setHealthStatus("Backend API Online & Reachable");
      } else {
        setHealthStatus("Backend returned error status");
      }
    } catch (e: any) {
      setHealthStatus(`Connection failed: ${e.message}`);
    } finally {
      setTestingHealth(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Confirm Sign Out",
      "Are you sure you want to log out of VisitorFlow?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* User Identity Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {user?.name?.charAt(0) || "U"}
          </Text>
        </View>

        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>
          {user?.designation} • {user?.department}
        </Text>
        <View style={styles.empBadge}>
          <Text style={styles.empBadgeText}>Employee ID: {user?.employeeId}</Text>
        </View>
      </View>

      {/* Details List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Employee Details</Text>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color="#64748B" />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color="#64748B" />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>{user?.mobile}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoValue, { color: "#16A34A" }]}>
              {user?.isActive ? "Active (Authorized)" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      {/* Security & Privacy Notice */}
      <View style={styles.card}>
        <View style={styles.privacyHeader}>
          <Ionicons name="lock-closed" size={18} color="#2563EB" />
          <Text style={styles.cardTitle}>Privacy & Permissions</Text>
        </View>

        <Text style={styles.privacyText}>
          • Camera Access: Used solely to take in-app verification selfies at check-in and check-out. Gallery media access is disabled.
        </Text>
        <Text style={styles.privacyText}>
          • GPS Geolocation: Captured only during check-in and check-out events. The system performs NO continuous or background tracking.
        </Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutButtonText}>Sign Out of Application</Text>
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
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563EB",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  userRole: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  empBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  empBadgeText: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#475569",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 1,
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 8,
  },
  endpointText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#64748B",
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  testButton: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    alignItems: "center",
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  healthStatusText: {
    fontSize: 11,
    color: "#16A34A",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
