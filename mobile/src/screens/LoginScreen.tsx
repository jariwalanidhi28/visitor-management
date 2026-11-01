import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("jariwalanidhi28@gmail.com");
  const [password, setPassword] = useState("nidhi123");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, apiUrl, updateApiUrl } = useAuth();
  const [isServerModalVisible, setIsServerModalVisible] = useState(false);
  const [serverInput, setServerInput] = useState(apiUrl);

  useEffect(() => {
    setServerInput(apiUrl);
  }, [apiUrl]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Input Error", "Please enter your registered email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      Alert.alert(
        "Authentication Failed",
        err.message || "Invalid credentials. Please verify with your admin."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Icon & Title */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={38} color="#2563EB" />
          </View>
          <Text style={styles.appTitle}>VisitorFlow</Text>
          <Text style={styles.appSubtitle}>
            Secure Check-In & Geo-Verification System
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Employee Login</Text>
          <Text style={styles.formDesc}>
            Sign in with credentials provided by your corporate administrator.
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Corporate Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="employee@visitor.local"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security & Organization Policy Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text style={styles.noticeText}>
            Public registration is disabled. Contact your supervisor or administrator if you require account setup.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.serverInfoButton}
          onPress={() => {
            setServerInput(apiUrl);
            setIsServerModalVisible(true);
          }}
        >
          <Ionicons name="wifi-outline" size={13} color="#2563EB" />
          <Text style={styles.serverInfoText}>
            Server: {apiUrl}
          </Text>
          <Text style={styles.serverInfoChange}>Tap to Change</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server IP Config Modal */}
      <Modal
        visible={isServerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsServerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="server" size={24} color="#2563EB" />
              <Text style={styles.modalTitle}>Configure Backend Server</Text>
            </View>
            <Text style={styles.modalDesc}>
              Change the server address whenever your Wi-Fi network changes:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={serverInput}
              onChangeText={setServerInput}
              placeholder="http://10.79.110.138:5000/api"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsServerModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={async () => {
                  if (serverInput.trim()) {
                    await updateApiUrl(serverInput.trim());
                    setIsServerModalVisible(false);
                    Alert.alert("Server Updated", `Backend set to:\n${serverInput.trim()}`);
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  formDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: "#2563EB",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  serverInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 20,
    alignSelf: "center",
  },
  serverInfoText: {
    fontSize: 11,
    color: "#1E40AF",
    fontWeight: "500",
  },
  serverInfoChange: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
    textDecorationLine: "underline",
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalDesc: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
