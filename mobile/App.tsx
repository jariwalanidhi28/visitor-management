import React, { useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { CheckInScreen } from "./src/screens/CheckInScreen";
import { CheckOutScreen } from "./src/screens/CheckOutScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

type Screen = "dashboard" | "checkin" | "checkout" | "history" | "profile";

function MainNavigator() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");

  // Whenever the user state changes (e.g. logging in, logging out, switching users),
  // always reset to the dashboard screen so new logins don't stay on the profile/signout screen.
  React.useEffect(() => {
    setCurrentScreen("dashboard");
  }, [user?._id]);

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.splashText}>Restoring Secure Session...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  switch (currentScreen) {
    case "checkin":
      return (
        <CheckInScreen
          onCheckInComplete={() => setCurrentScreen("dashboard")}
          onCancel={() => setCurrentScreen("dashboard")}
        />
      );
    case "checkout":
      return (
        <CheckOutScreen
          onCheckOutComplete={() => setCurrentScreen("dashboard")}
          onCancel={() => setCurrentScreen("dashboard")}
        />
      );
    case "history":
      return <HistoryScreen onBack={() => setCurrentScreen("dashboard")} />;
    case "profile":
      return <ProfileScreen onBack={() => setCurrentScreen("dashboard")} />;
    case "dashboard":
    default:
      return (
        <DashboardScreen
          onNavigateToCheckIn={() => setCurrentScreen("checkin")}
          onNavigateToCheckOut={() => setCurrentScreen("checkout")}
          onNavigateToHistory={() => setCurrentScreen("history")}
          onNavigateToProfile={() => setCurrentScreen("profile")}
        />
      );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.appContainer} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  splashText: {
    marginTop: 14,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
